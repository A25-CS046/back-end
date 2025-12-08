const fs = require("fs");
const path = require("path");
const csv = require("csv-parse");
const { pool } = require("../config/database");
const thresholds = require("../config/thresholds");

function parseWindowToMs(windowStr) {
  if (!windowStr) return 24 * 3600 * 1000; // default 24h
  const v = windowStr.toLowerCase();
  if (v.endsWith("h")) return parseInt(v) * 3600 * 1000;
  if (v.endsWith("d")) return parseInt(v) * 24 * 3600 * 1000;
  if (v.endsWith("m")) return parseInt(v) * 60 * 1000;
  return 24 * 3600 * 1000;
}

function intervalToSeconds(interval) {
  if (!interval) return 60;
  const v = interval.toLowerCase();
  if (v.endsWith("h")) return parseInt(v) * 3600;
  if (v.endsWith("d")) return parseInt(v) * 86400;
  if (v.endsWith("m")) return parseInt(v) * 60;
  return parseInt(v) || 60;
}

const readCsvData = (filename) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const filePath = path.join(
      __dirname,
      "../../../machine-learning/data",
      filename
    );
    if (!fs.existsSync(filePath))
      return reject(new Error(`File ${filename} tidak ditemukan`));
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

async function getDashboardSummary({ asOf, window }) {
  const sql = `
    SELECT
      COUNT(*)::int AS "totalMachines",
      COALESCE(AVG(latest."synthetic_RUL"),0)::float AS "avgRUL",
      SUM(CASE WHEN latest."synthetic_RUL" > $1 THEN 1 ELSE 0 END)::int AS healthy,
      SUM(CASE WHEN latest."synthetic_RUL" BETWEEN $2 AND $1 THEN 1 ELSE 0 END)::int AS warning,
      SUM(CASE WHEN latest."synthetic_RUL" < $2 THEN 1 ELSE 0 END)::int AS critical,
      SUM(CASE WHEN latest.is_failure = 1 THEN 1 ELSE 0 END)::int AS "activeFailures"
    FROM (
      SELECT DISTINCT ON (unit_id) *
      FROM telemetry
      ORDER BY unit_id, timestamp DESC
    ) latest;
  `;

  const params = [thresholds.warningRUL, thresholds.criticalRUL];
  const { rows } = await pool.query(sql, params);
  const r = rows[0] || {};

  return {
    totalMachines: Number(r.totalMachines || 0),
    stats: {
      total: Number(r.totalMachines || 0),
      avgHealth: Number(r.avgRUL || 0),
      avgRUL: Number(r.avgRUL || 0),
    },
    statusCounts: {
      healthy: Number(r.healthy || 0),
      warning: Number(r.warning || 0),
      critical: Number(r.critical || 0),
    },
    activeFailures: Number(r.activeFailures || 0),
  };
}

async function getMachinesLatest({ asOf, limit = 100, offset = 0 }) {
  const end = asOf ? new Date(asOf) : new Date();
  const sql = `
    SELECT DISTINCT ON (unit_id)
      unit_id, product_id, timestamp AS "lastSeen", "synthetic_RUL" AS synthetic_rul, tool_wear_min, "process_temperature_K" AS process_temperature_k, rotational_speed_rpm, is_failure
    FROM telemetry
    WHERE timestamp <= $1
    ORDER BY unit_id, timestamp DESC
    LIMIT $2 OFFSET $3;
  `;
  const countSql = `SELECT COUNT(DISTINCT unit_id)::int AS cnt FROM telemetry WHERE timestamp <= $1`;
  const params = [end.toISOString(), limit, offset];
  const { rows } = await pool.query(sql, params);
  const cntRes = await pool.query(countSql, [end.toISOString()]);
  const count = cntRes.rows[0] ? Number(cntRes.rows[0].cnt || 0) : 0;

  const items = rows.map((r) => {
    const rul = r.synthetic_rul == null ? null : Number(r.synthetic_rul);
    let status = "healthy";
    if (rul == null) status = "warning";
    else if (rul < thresholds.criticalRUL) status = "critical";
    else if (rul <= thresholds.warningRUL) status = "warning";
    return {
      unit_id: r.unit_id,
      product_id: r.product_id,
      lastSeen: new Date(r.lastSeen).toISOString(),
      healthPercent:
        rul != null ? Math.max(0, Math.min(100, Number(rul))) : null,
      synthetic_RUL: rul,
      status,
      process_temperature_K:
        r.process_temperature_k == null
          ? null
          : Number(r.process_temperature_k),
      rotational_speed_rpm:
        r.rotational_speed_rpm == null ? null : Number(r.rotational_speed_rpm),
      tool_wear_min: r.tool_wear_min == null ? null : Number(r.tool_wear_min),
      location: null,
      is_failure: !!r.is_failure,
    };
  });

  return { items, count };
}

async function getTelemetry({
  start,
  end,
  unitId,
  productId,
  limit = 100,
  offset = 0,
  aggregate = "raw",
}) {
  const defaultEnd = new Date();
  const defaultStart = new Date(defaultEnd.getTime() - 24 * 3600 * 1000);
  const s = start ? new Date(start) : defaultStart;
  const e = end ? new Date(end) : defaultEnd;

  const where = ["timestamp BETWEEN $1 AND $2"];
  const params = [s.toISOString(), e.toISOString()];
  let idx = 3;
  if (unitId) {
    where.push(`unit_id = $${idx++}`);
    params.push(unitId);
  }
  if (productId) {
    where.push(`product_id = $${idx++}`);
    params.push(productId);
  }
  const whereSql = "WHERE " + where.join(" AND ");

  if (aggregate === "raw") {
    const dataSql = `SELECT product_id, unit_id, timestamp, step_index, "air_temperature_K" AS air_temperature_k, "process_temperature_K" AS process_temperature_k, rotational_speed_rpm, "torque_Nm" AS torque_nm, tool_wear_min, is_failure, failure_type, "synthetic_RUL" AS synthetic_rul FROM telemetry ${whereSql} ORDER BY timestamp ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);
    const dataRes = await pool.query(dataSql, params);
    const countParams = params.slice(0, idx - 3);
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM telemetry ${whereSql}`,
      countParams
    );
    const count = countRes.rows[0] ? Number(countRes.rows[0].cnt) : 0;
    return { meta: { count, limit, offset }, data: dataRes.rows };
  }

  const trunc = aggregate === "daily" ? "day" : "hour";
  const aggSql = `
    SELECT date_trunc('${trunc}', timestamp) AT TIME ZONE 'UTC' AS timestamp,
      AVG("process_temperature_K") AS avg_process_temperature_k,
      AVG(rotational_speed_rpm) AS avg_rotational_speed_rpm,
      AVG("torque_Nm") AS avg_torque_nm,
      AVG(tool_wear_min) AS avg_tool_wear_min,
      AVG("synthetic_RUL") AS avg_synthetic_rul
    FROM telemetry
    ${whereSql}
    GROUP BY 1
    ORDER BY 1 ASC
    LIMIT $${idx++} OFFSET $${idx++};
  `;
  params.push(limit, offset);
  const dataRes = await pool.query(aggSql, params);
  const countParams = params.slice(0, idx - 3);
  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM (SELECT date_trunc('${trunc}', timestamp) AS b FROM telemetry ${whereSql} GROUP BY 1) t`,
    countParams
  );
  const count = countRes.rows[0] ? Number(countRes.rows[0].cnt) : 0;
  return { meta: { count, limit, offset }, data: dataRes.rows };
}

async function getMachineTimeseries(unitId, { start, end, interval = "1h" }) {
  if (!unitId) throw new Error("unitId required");
  const defaultEnd = new Date();
  const defaultStart = new Date(defaultEnd.getTime() - 24 * 3600 * 1000);
  const s = start ? new Date(start) : defaultStart;
  const e = end ? new Date(end) : defaultEnd;
  const seconds = intervalToSeconds(interval);

  const sql = `
    SELECT to_timestamp(floor(extract(epoch from timestamp::timestamp) / $2) * $2) AT TIME ZONE 'UTC' AS bucket,
      AVG("process_temperature_K")::float AS avg_process_temperature_k,
      AVG(rotational_speed_rpm)::float AS avg_rotational_speed_rpm,
      AVG("torque_Nm")::float AS avg_torque_nm,
      AVG(tool_wear_min)::float AS avg_tool_wear_min,
      AVG("synthetic_RUL")::float AS avg_synthetic_rul
    FROM telemetry
    WHERE unit_id = $1 AND timestamp::timestamp BETWEEN $3::timestamp AND $4::timestamp
    GROUP BY bucket
    ORDER BY bucket ASC;
  `;
  const params = [unitId, seconds, s.toISOString(), e.toISOString()];
  const { rows } = await pool.query(sql, params);
  return rows.map((r) => ({
    timestamp: new Date(r.bucket).toISOString(),
    avg_process_temperature_K: Number(r.avg_process_temperature_k),
    avg_rotational_speed_rpm: Number(r.avg_rotational_speed_rpm),
    avg_torque_Nm: Number(r.avg_torque_nm),
    avg_tool_wear_min: Number(r.avg_tool_wear_min),
    avg_synthetic_RUL: Number(r.avg_synthetic_rul),
  }));
}

module.exports = {
  readCsvData,
  getDashboardSummary,
  getMachinesLatest,
  getTelemetry,
  getMachineTimeseries,
};

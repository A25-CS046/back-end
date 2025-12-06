const { Pool } = require("pg");
const thresholds = require("../config/thresholds");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * List machines with pagination, search, and status filter
 * Machines are derived from distinct unit_id in telemetry table
 * @param {Object} options
 * @param {number} options.limit - max results (default 50)
 * @param {number} options.offset - pagination offset (default 0)
 * @param {string} options.search - optional search term for unit_id or product_id
 * @param {string} options.status - optional filter: 'healthy' | 'warning' | 'critical'
 */
async function listMachines({
  limit = 50,
  offset = 0,
  search = null,
  status = null,
} = {}) {
  const baseCte = `
    WITH latest_telemetry AS (
      SELECT DISTINCT ON (unit_id)
        unit_id,
        product_id,
        engine_type,
        "synthetic_RUL",
        is_failure,
        timestamp AS last_seen
      FROM telemetry
      ORDER BY unit_id, timestamp DESC
    ),
    machines_with_status AS (
      SELECT 
        *,
        CASE 
          WHEN is_failure = 1 THEN 'critical'
          WHEN "synthetic_RUL" > ${thresholds.warningRUL} THEN 'healthy'
          WHEN "synthetic_RUL" >= ${thresholds.criticalRUL} THEN 'warning'
          ELSE 'critical'
        END AS computed_status
      FROM latest_telemetry
    )
  `;

  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(
      `(unit_id ILIKE $${paramIdx} OR product_id ILIKE $${paramIdx})`
    );
    params.push(`%${search}%`);
    paramIdx++;
  }

  if (status && ["healthy", "warning", "critical"].includes(status)) {
    conditions.push(`computed_status = $${paramIdx}`);
    params.push(status);
    paramIdx++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countSql = `
    ${baseCte}
    SELECT COUNT(*)::int AS total
    FROM machines_with_status
    ${whereClause}
  `;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0]?.total || 0;

  const dataSql = `
    ${baseCte}
    SELECT *
    FROM machines_with_status
    ${whereClause}
    ORDER BY unit_id
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  params.push(limit, offset);

  const { rows } = await pool.query(dataSql, params);

  const data = rows.map((r) => {
    const rawRUL = r.synthetic_RUL != null ? Number(r.synthetic_RUL) : null;
    const syntheticRUL = rawRUL != null ? Math.round(rawRUL) : null;

    let healthPercent = null;
    if (rawRUL != null) {
      healthPercent = Math.min(
        100,
        Math.round((rawRUL / thresholds.warningRUL) * 100)
      );
    }

    const name =
      r.product_id && r.unit_id
        ? `${r.product_id}-${r.unit_id}`
        : r.product_id || r.unit_id || null;

    return {
      unitId: r.unit_id,
      productId: r.product_id || null,
      name,
      type: r.engine_type || null,
      manufacturer: null,
      model: null,
      location: null,
      healthPercent,
      syntheticRUL,
      status: r.computed_status,
      installDate: null,
      lastMaintenance: null,
    };
  });

  return {
    meta: { count: total, limit, offset, search, status },
    data,
  };
}

/**
 * Get single machine details by unitId
 * @param {string} unitId
 */
async function getMachineById(unitId) {
  const sql = `
    SELECT DISTINCT ON (unit_id)
      unit_id,
      product_id,
      engine_type,
      "synthetic_RUL",
      is_failure,
      timestamp AS last_seen
    FROM telemetry
    WHERE unit_id = $1
    ORDER BY unit_id, timestamp DESC
    LIMIT 1
  `;

  const { rows } = await pool.query(sql, [unitId]);

  if (rows.length === 0) {
    return null;
  }

  const r = rows[0];
  const rawRUL = r.synthetic_RUL != null ? Number(r.synthetic_RUL) : null;
  const syntheticRUL = rawRUL != null ? Math.round(rawRUL) : null;

  let status = null;
  if (r.is_failure === 1) {
    status = "critical";
  } else if (rawRUL != null) {
    if (rawRUL > thresholds.warningRUL) status = "healthy";
    else if (rawRUL >= thresholds.criticalRUL) status = "warning";
    else status = "critical";
  }

  let healthPercent = null;
  if (rawRUL != null) {
    healthPercent = Math.min(
      100,
      Math.round((rawRUL / thresholds.warningRUL) * 100)
    );
  }

  let lastSeen = null;
  if (r.last_seen) {
    try {
      lastSeen = new Date(r.last_seen).toISOString();
    } catch {
      lastSeen = null;
    }
  }

  const name =
    r.product_id && r.unit_id
      ? `${r.product_id}-${r.unit_id}`
      : r.product_id || r.unit_id || null;

  return {
    unitId: r.unit_id,
    productId: r.product_id || null,
    name,
    type: r.engine_type || null,
    manufacturer: null,
    model: null,
    location: null,
    healthPercent,
    syntheticRUL,
    status,
    installDate: null,
    lastMaintenance: null,
    meta: { lastSeen },
  };
}

/**
 * Get sensor timeseries data for a machine
 * @param {string} unitId
 * @param {Object} options
 * @param {string} options.start - ISO timestamp (optional, no default)
 * @param {string} options.end - ISO timestamp (optional, no default)
 * @param {string} options.interval - 'raw' | 'hourly' | 'daily' (default: 'hourly')
 * @param {number} options.limit - max results
 * @param {number} options.offset - pagination offset
 */
async function getMachineSensors(
  unitId,
  { start, end, interval = "hourly", limit = 500, offset = 0 } = {}
) {
  const startTime = start ? new Date(start) : null;
  const endTime = end ? new Date(end) : null;

  const startISO = startTime ? startTime.toISOString() : null;
  const endISO = endTime ? endTime.toISOString() : null;

  const hasTimeFilter = startISO && endISO;

  let sql;
  let countSql;
  const params = [unitId];
  let paramIdx = 2;

  let timeCondition = "";
  if (hasTimeFilter) {
    timeCondition = `AND timestamp::timestamp BETWEEN $${paramIdx}::timestamp AND $${
      paramIdx + 1
    }::timestamp`;
    params.push(startISO, endISO);
    paramIdx += 2;
  }

  if (interval === "raw") {
    sql = `
      SELECT
        timestamp,
        rotational_speed_rpm,
        "process_temperature_K" AS process_temperature_k,
        "air_temperature_K" AS air_temperature_k,
        "torque_Nm" AS torque_nm,
        tool_wear_min,
        "synthetic_RUL" AS synthetic_rul
      FROM telemetry
      WHERE unit_id = $1
        ${timeCondition}
      ORDER BY timestamp ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    countSql = `
      SELECT COUNT(*)::int AS cnt
      FROM telemetry
      WHERE unit_id = $1
        ${timeCondition}
    `;
    params.push(limit, offset);
  } else {
    const truncUnit = interval === "daily" ? "day" : "hour";

    sql = `
      SELECT
        date_trunc('${truncUnit}', timestamp::timestamp) AS ts,
        AVG(rotational_speed_rpm) AS rotational_speed_rpm,
        AVG("process_temperature_K") AS process_temperature_k,
        AVG("air_temperature_K") AS air_temperature_k,
        AVG("torque_Nm") AS torque_nm,
        AVG(tool_wear_min) AS tool_wear_min,
        AVG("synthetic_RUL") AS synthetic_rul
      FROM telemetry
      WHERE unit_id = $1
        ${timeCondition}
      GROUP BY 1
      ORDER BY 1 ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    countSql = `
      SELECT COUNT(DISTINCT date_trunc('${truncUnit}', timestamp::timestamp))::int AS cnt
      FROM telemetry
      WHERE unit_id = $1
        ${timeCondition}
    `;
    params.push(limit, offset);
  }

  const countParams = hasTimeFilter ? params.slice(0, 3) : params.slice(0, 1);

  const [dataResult, countResult] = await Promise.all([
    pool.query(sql, params),
    pool.query(countSql, countParams),
  ]);

  const count = countResult.rows[0]?.cnt || 0;

  const data = dataResult.rows.map((r) => {
    let timestamp = null;
    const tsValue = r.ts || r.timestamp;
    if (tsValue) {
      try {
        timestamp = new Date(tsValue).toISOString();
      } catch {
        timestamp = null;
      }
    }

    const rotationalSpeedRpm =
      r.rotational_speed_rpm != null ? Number(r.rotational_speed_rpm) : null;
    const processTemperatureK =
      r.process_temperature_k != null ? Number(r.process_temperature_k) : null;
    const airTemperatureK =
      r.air_temperature_k != null ? Number(r.air_temperature_k) : null;
    const torqueNm = r.torque_nm != null ? Number(r.torque_nm) : null;
    const toolWearMin =
      r.tool_wear_min != null ? Number(r.tool_wear_min) : null;
    const syntheticRUL =
      r.synthetic_rul != null ? Number(r.synthetic_rul) : null;

    // Temperature: convert Kelvin to Celsius
    const temperatureC =
      processTemperatureK != null
        ? Math.round((processTemperatureK - 273.15) * 100) / 100
        : null;

    const vibration = rotationalSpeedRpm;

    const current = null;

    return {
      timestamp,
      vibration,
      temperatureC,
      current,
      rotationalSpeedRpm:
        rotationalSpeedRpm != null
          ? Math.round(rotationalSpeedRpm * 100) / 100
          : null,
      processTemperatureK:
        processTemperatureK != null
          ? Math.round(processTemperatureK * 100) / 100
          : null,
      airTemperatureK:
        airTemperatureK != null
          ? Math.round(airTemperatureK * 100) / 100
          : null,
      torqueNm: torqueNm != null ? Math.round(torqueNm * 100) / 100 : null,
      toolWearMin:
        toolWearMin != null ? Math.round(toolWearMin * 100) / 100 : null,
      syntheticRUL:
        syntheticRUL != null ? Math.round(syntheticRUL * 100) / 100 : null,
    };
  });

  return {
    meta: {
      start: startISO,
      end: endISO,
      interval,
      count,
    },
    data,
  };
}

/**
 * Check if a machine exists
 * @param {string} unitId
 */
async function machineExists(unitId) {
  const sql = `SELECT 1 FROM telemetry WHERE unit_id = $1 LIMIT 1`;
  const { rows } = await pool.query(sql, [unitId]);
  return rows.length > 0;
}

module.exports = {
  listMachines,
  getMachineById,
  getMachineSensors,
  machineExists,
};

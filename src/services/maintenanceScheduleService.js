const { pool } = require("../config/database");

const getMaintenanceSchedules = async (options = {}) => {
  const { page = 1, limit = 10, status, search } = options;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];
  let paramIndex = 1;

  if (status) {
    whereConditions.push(`ms.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (search) {
    whereConditions.push(
      `(ms.schedule_id ILIKE $${paramIndex} OR ms.reason ILIKE $${paramIndex})`
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM maintenance_schedule ms ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Get schedules with pagination
  const query = `
    SELECT 
      ms.id,
      ms.schedule_id,
      ms.product_id,
      ms.unit_id,
      ms.recommended_start,
      ms.recommended_end,
      ms.reason,
      ms.risk_score,
      ms.model_version,
      ms.actions,
      ms.constraints_applied,
      ms.created_at,
      ms.status
    FROM maintenance_schedule ms
    ${whereClause}
    ORDER BY ms.recommended_start ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const result = await pool.query(query, [...params, limit, offset]);

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMaintenanceScheduleById = async (id) => {
  const query = `
    SELECT 
      ms.id,
      ms.schedule_id,
      ms.product_id,
      ms.unit_id,
      ms.recommended_start,
      ms.recommended_end,
      ms.reason,
      ms.risk_score,
      ms.model_version,
      ms.actions,
      ms.constraints_applied,
      ms.created_at,
      ms.status
    FROM maintenance_schedule ms
    WHERE ms.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

module.exports = {
  getMaintenanceSchedules,
  getMaintenanceScheduleById,
};

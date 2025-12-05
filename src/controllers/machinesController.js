const machineService = require("../services/machineService");

/**
 * GET /api/machines
 * List machines with pagination, search, and status filter
 * Query params:
 *   - limit (default 50, max 500)
 *   - offset (default 0)
 *   - search (optional, searches unit_id and product_id)
 *   - status (optional, one of: healthy, warning, critical)
 */
async function listMachines(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || null;
    const status = req.query.status || null;

    // Validate status if provided
    if (status && !["healthy", "warning", "critical"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: healthy, warning, critical",
        status: 400,
      });
    }

    const result = await machineService.listMachines({
      limit,
      offset,
      search,
      status,
    });
    res.json(result);
  } catch (err) {
    console.error("Error listing machines:", err.message);
    res.status(500).json({
      message: "Failed to retrieve machines",
      status: 500,
    });
  }
}

/**
 * GET /api/machines/:unitId
 * Get single machine details by unitId
 */
async function getMachine(req, res, next) {
  try {
    const { unitId } = req.params;

    if (!unitId) {
      return res.status(400).json({
        message: "unitId is required",
        status: 400,
      });
    }

    const machine = await machineService.getMachineById(unitId);

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
        status: 404,
      });
    }

    res.json(machine);
  } catch (err) {
    console.error("Error getting machine:", err.message);
    res.status(500).json({
      message: "Failed to retrieve machine",
      status: 500,
    });
  }
}

/**
 * GET /api/machines/:unitId/sensors
 * Get sensor timeseries data for a machine
 */
async function getMachineSensors(req, res, next) {
  try {
    const { unitId } = req.params;

    if (!unitId) {
      return res.status(400).json({
        message: "unitId is required",
        status: 400,
      });
    }

    const exists = await machineService.machineExists(unitId);
    if (!exists) {
      return res.status(404).json({
        message: "Machine not found",
        status: 404,
      });
    }

    const start = req.query.start || null;
    const end = req.query.end || null;
    const interval = req.query.interval || "hourly";
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);
    const offset = parseInt(req.query.offset) || 0;

    const validIntervals = ["raw", "hourly", "daily"];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        message: `Invalid interval. Must be one of: ${validIntervals.join(
          ", "
        )}`,
        status: 400,
      });
    }

    // Validate timestamps if provided
    if (start && isNaN(Date.parse(start))) {
      return res.status(400).json({
        message: "Invalid start timestamp. Must be ISO 8601 format.",
        status: 400,
      });
    }
    if (end && isNaN(Date.parse(end))) {
      return res.status(400).json({
        message: "Invalid end timestamp. Must be ISO 8601 format.",
        status: 400,
      });
    }

    const result = await machineService.getMachineSensors(unitId, {
      start,
      end,
      interval,
      limit,
      offset,
    });

    res.json(result);
  } catch (err) {
    console.error("Error getting machine sensors:", err.message);
    res.status(500).json({
      message: "Failed to retrieve sensor data",
      status: 500,
    });
  }
}

module.exports = {
  listMachines,
  getMachine,
  getMachineSensors,
};

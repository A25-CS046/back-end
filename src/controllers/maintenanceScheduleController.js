const maintenanceScheduleService = require("../services/maintenanceScheduleService");

const getMaintenanceSchedules = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;

    const result = await maintenanceScheduleService.getMaintenanceSchedules({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      search,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getMaintenanceScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule =
      await maintenanceScheduleService.getMaintenanceScheduleById(id);

    if (!schedule) {
      return res
        .status(404)
        .json({ message: "Maintenance schedule not found" });
    }

    res.status(200).json(schedule);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceSchedules,
  getMaintenanceScheduleById,
};

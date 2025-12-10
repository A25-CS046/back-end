const express = require("express");
const router = express.Router();
const maintenanceScheduleController = require("../controllers/maintenanceScheduleController");
const verifyToken = require("../middlewares/authMiddleware");

router.get(
  "/",
  verifyToken,
  maintenanceScheduleController.getMaintenanceSchedules
);
router.get(
  "/:id",
  verifyToken,
  maintenanceScheduleController.getMaintenanceScheduleById
);

module.exports = router;

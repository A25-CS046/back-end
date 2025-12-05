const express = require("express");
const router = express.Router();
const dataController = require("../controllers/dataController");

router.get("/dashboard/summary", dataController.getSummary);
router.get("/dashboard/machines", dataController.getMachines);
router.get("/telemetry", dataController.getTelemetry);
router.get(
  "/dashboard/machine/:unitId/telemetry",
  dataController.getMachineTimeseries
);
router.get("/dashboard/team-perf", dataController.getTeamPerf);
router.get("/ml/:filename", dataController.getMachineLearningData);

module.exports = router;

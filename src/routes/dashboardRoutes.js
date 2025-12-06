const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/active-tasks", dashboardController.getActiveTasks);
router.get("/team-members", dashboardController.getTeamMembers);
router.get("/team-perf", dashboardController.getTeamPerf);

module.exports = router;

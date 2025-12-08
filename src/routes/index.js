const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const dataRoutes = require("./dataRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const machineRoutes = require("./machineRoutes");
const copilotRoutes = require("./copilotRoutes");
const recommendationRoutes = require("./recommendationRoutes");

router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/machines", machineRoutes);
router.use("/copilot", copilotRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/", dataRoutes);

module.exports = router;

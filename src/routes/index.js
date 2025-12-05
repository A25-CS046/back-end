const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const dataRoutes = require("./dataRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const machineRoutes = require("./machineRoutes");

router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/machines", machineRoutes);
router.use("/", dataRoutes);

module.exports = router;

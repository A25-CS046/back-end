const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const copilotRoutes = require("./copilotRoutes");

router.use("/users", userRoutes);
router.use("/copilot", copilotRoutes);

module.exports = router;

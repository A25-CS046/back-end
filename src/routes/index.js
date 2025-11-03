const express = require("express");
const router = express.Router();

// Impor rute untuk setiap fitur
const userRoutes = require("./userRoutes");

// Gunakan rute untuk setiap fitur
router.use("/users", userRoutes);

module.exports = router;

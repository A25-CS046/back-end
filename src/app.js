const express = require("express");
const cors = require("cors");
const mainRouter = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// === Global Middlewares ===
app.use(cors()); // Mengizinkan Cross-Origin Requests
app.use(express.json()); // Mem-parsing body request JSON
app.use(express.urlencoded({ extended: true })); // Mem-parsing body request URL-encoded

// Semua rute akan memiliki prefix /api/v1
app.use("/api/v1", mainRouter);

// === Global Error Handler ===
app.use(errorHandler);

module.exports = app;

const express = require('express');
const cors = require('cors');
const mainRouter = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// === Global Middlewares ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// All routes under /api
app.use('/api', mainRouter);

// === Global Error Handler ===
app.use(errorHandler);

module.exports = app;

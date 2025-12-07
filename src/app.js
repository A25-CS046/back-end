const express = require('express');
const cors = require('cors');
const mainRouter = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// === CORS Configuration ===
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL // e.g., 'https://your-frontend.web.app'
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// === Global Middlewares ===
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// All routes under /api
app.use('/api', mainRouter);

// === Global Error Handler ===
app.use(errorHandler);

module.exports = app;

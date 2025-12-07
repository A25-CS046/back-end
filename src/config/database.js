/**
 * Centralized Database Configuration
 * Supports both Cloud SQL (Unix Socket) in production and TCP in development
 */
const { Pool } = require("pg");

/**
 * Get database configuration based on environment
 * - Production: Uses Cloud SQL Unix Socket
 * - Development: Uses standard TCP connection via DATABASE_URL
 */
const getDbConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Cloud SQL Unix Socket configuration for Google Cloud Run
    const socketPath = `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`;
    
    return {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: socketPath,
      // Additional production settings
      max: 10, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  // Development: Use DATABASE_URL or individual parameters
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    };
  }

  // Fallback to individual parameters for development
  return {
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "predictive_maintenance",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    max: 10,
    idleTimeoutMillis: 30000,
  };
};

// Create singleton pool instance
const pool = new Pool(getDbConfig());

// Log connection status (useful for debugging)
pool.on("connect", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Database connected successfully");
  }
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

module.exports = { pool, getDbConfig };

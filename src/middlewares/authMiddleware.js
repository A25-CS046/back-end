const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { pool } = require("../config/database");

dotenv.config();

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    );
    req.user = decoded;

    // Heartbeat: Update last_login to indicate presence
    await pool.query('UPDATE "users" SET last_login = NOW() WHERE id = $1', [
      decoded.id,
    ]);

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = verifyToken;

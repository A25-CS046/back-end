const userService = require("../services/userService");
const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const createUser = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const newUser = await userService.createUser({ email, password, name });

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if the user exists
    const userQuery = 'SELECT * FROM "users" WHERE email = $1';
    const result = await pool.query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update last_login and status to active
    await pool.query(
      'UPDATE "users" SET last_login = NOW(), status = \'active\' WHERE id = $1',
      [user.id]
    );

    // Generate JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Remove password from response
    delete user.password;
    // Update local user object status to reflect the DB change
    user.status = "active";

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Set status to inactive
    await pool.query('UPDATE "users" SET status = \'inactive\' WHERE id = $1', [
      userId,
    ]);

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Explicitly select columns to avoid returning password
    const query =
      'SELECT id, email, name, role, specialization, phone, status, last_login, created_at, updated_at FROM "users" WHERE id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }

    // Get current password hash
    const userQuery = 'SELECT password FROM "users" WHERE id = $1';
    const result = await pool.query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    const updateQuery =
      'UPDATE "users" SET password = $1, updated_at = NOW() WHERE id = $2';
    await pool.query(updateQuery, [hashedPassword, userId]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  login,
  logout,
  getProfile,
  changePassword,
};

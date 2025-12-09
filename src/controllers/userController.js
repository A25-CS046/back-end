const userService = require("../services/userService");
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

    // Authenticate user via service
    const user = await userService.validateLogin(email, password);

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

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    // Handle specific login errors (e.g., 401 Unauthorized)
    if (error.message === "Invalid email or password" || error.message === "Account is inactive") {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await userService.logout(userId);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userProfile = await userService.getUserProfile(userId);
    res.status(200).json(userProfile);
  }
  catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
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

    await userService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    if (error.message === "Incorrect current password") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
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

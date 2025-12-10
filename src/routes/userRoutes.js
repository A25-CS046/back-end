const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");

// Auth routes
router.post("/", userController.createUser);
router.post("/login", userController.login);
router.post("/logout", verifyToken, userController.logout);
router.get("/profile", verifyToken, userController.getProfile);
router.put("/change-password", verifyToken, userController.changePassword);
<<<<<<< HEAD
=======

// CRUD routes
router.get("/data", verifyToken, userController.getAllUsers);
router.get("/:id", verifyToken, userController.getUserById);
router.put("/:id", verifyToken, userController.updateUser);
router.delete("/:id", verifyToken, userController.deleteUser);
>>>>>>> origin/develop/leo

module.exports = router;

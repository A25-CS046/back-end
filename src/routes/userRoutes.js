const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");

router.post("/", userController.createUser);
router.post("/login", userController.login);
router.post("/logout", verifyToken, userController.logout);
router.get("/profile", verifyToken, userController.getProfile);
router.put("/change-password", verifyToken, userController.changePassword);

module.exports = router;

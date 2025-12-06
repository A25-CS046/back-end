const express = require("express");
const router = express.Router();
const { handleCopilotChat } = require("../controllers/copilotController");

router.post("/chat", handleCopilotChat);

module.exports = router;

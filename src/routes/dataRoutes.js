const express = require("express");
const router = express.Router();
const dataController = require("../controllers/dataController");

router.get("/:filename", dataController.getMachineLearningData);

module.exports = router;

const express = require("express");
const router = express.Router();
const machinesController = require("../controllers/machinesController");

router.get("/", machinesController.listMachines);
router.get("/:unitId", machinesController.getMachine);
router.get("/:unitId/sensors", machinesController.getMachineSensors);

module.exports = router;

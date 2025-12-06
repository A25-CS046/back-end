const dataService = require("../services/dataService");

const getMachineLearningData = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename.endsWith(".csv"))
      return res
        .status(400)
        .json({ error: "Hanya file CSV yang diperbolehkan" });
    const data = await dataService.readCsvData(filename);
    return res.status(200).json({ total_rows: data.length, data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const { asOf, window } = req.query;
    const summary = await dataService.getDashboardSummary({ asOf, window });
    res.set("Cache-Control", "public, max-age=30");
    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMachines = async (req, res) => {
  try {
    const { asOf, limit = 100, offset = 0 } = req.query;
    const { items, count } = await dataService.getMachinesLatest({
      asOf,
      limit: Number(limit),
      offset: Number(offset),
    });
    return res.json({
      meta: { count, limit: Number(limit), offset: Number(offset) },
      data: items,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getTelemetry = async (req, res) => {
  try {
    const {
      start,
      end,
      unitId,
      productId,
      limit = 100,
      offset = 0,
      aggregate = "raw",
    } = req.query;
    const resp = await dataService.getTelemetry({
      start,
      end,
      unitId,
      productId,
      limit: Number(limit),
      offset: Number(offset),
      aggregate,
    });
    return res.json(resp);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMachineTimeseries = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { start, end, interval = "1h" } = req.query;
    const series = await dataService.getMachineTimeseries(unitId, {
      start,
      end,
      interval,
    });
    return res.json({ unit_id: unitId, series });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getTeamPerf = async (req, res) => {
  // optional: relies on mapping table; return empty array if not present
  return res.json([]);
};

module.exports = {
  getMachineLearningData,
  getSummary,
  getMachines,
  getTelemetry,
  getMachineTimeseries,
  getTeamPerf,
};

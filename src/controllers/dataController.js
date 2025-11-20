const dataService = require("../services/dataService");

const getMachineLearningData = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename.endsWith(".csv")) {
      return res
        .status(400)
        .json({ error: "Hanya file CSV yang diperbolehkan" });
    }

    const data = await dataService.readCsvData(filename);

    res.status(200).json({
      total_rows: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = { getMachineLearningData };

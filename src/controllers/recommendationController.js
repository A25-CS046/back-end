const recommendationService = require("../services/recommendationService");

async function getRecommendations(req, res) {
  try {
    const filters = {
      product_id: req.query.product_id,
      unit_id: req.query.unit_id,
      status: req.query.status,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    };

    const recommendations = await recommendationService.getRecommendations(filters);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recommendations",
      error: error.message,
    });
  }
}

module.exports = {
  getRecommendations,
};

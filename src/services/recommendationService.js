const axios = require("axios");

/**
 * Fetch maintenance recommendations from the ML service
 * and transform them to match the frontend expectations.
 */
async function getRecommendations(filters = {}) {
  try {
    const response = await axios.get(`${process.env.ML_URL}/maintenance/schedule`, {
      params: filters,
    });

    const schedules = response.data.data || [];

    return schedules.map((s) => {
      // Parse reason string for Probability and RUL
      // Format example: "Failure probability: 99.11%, RUL: 44.4h"
      const reasonText = s.reason || "";
      let confidence = 0;
      let rulHours = 0;

      const probMatch = reasonText.match(/Failure probability:\s*([\d.]+)%/);
      if (probMatch) {
        confidence = parseFloat(probMatch[1]);
      } else {
        confidence = Math.round(s.risk_score * 100); // Fallback
      }

      const rulMatch = reasonText.match(/RUL:\s*([\d.]+)h/);
      if (rulMatch) {
        rulHours = parseFloat(rulMatch[1]);
      }

      // Calculate days from RUL hours if available, otherwise fallback to date diff
      let daysUntilFailure = 0;
      if (rulHours > 0) {
        daysUntilFailure = (rulHours / 24).toFixed(1);
      } else {
        const start = new Date(s.recommended_start);
        const now = new Date();
        const diffMs = start - now;
        daysUntilFailure = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
      
      // Calculate timeframe string
      let timeframe = "";
      if (daysUntilFailure < 0) timeframe = "Overdue";
      else if (daysUntilFailure < 1) timeframe = "< 1 day";
      else timeframe = `${Math.ceil(daysUntilFailure)} days`;

      // Map severity based on risk_score
      let severity = "low";
      if (s.risk_score >= 0.8) severity = "critical";
      else if (s.risk_score >= 0.5) severity = "high";
      else if (s.risk_score >= 0.2) severity = "medium";

      // Calculate Downtime (Duration in hours)
      const start = new Date(s.recommended_start);
      const end = new Date(s.recommended_end);
      const durationMs = end - start;
      const durationHours = Math.abs(durationMs / (1000 * 60 * 60)); 
      const estimatedDowntime = `${parseFloat(durationHours.toFixed(1))} hours`;

      return {
        id: `rec-${s.id}`,
        scheduleId: s.schedule_id,
        machineId: s.unit_id,
        machineType: s.product_id || "Equipment",
        severity,
        category: "predictive",
        prediction: `Mesin ${s.unit_id} kemungkinan mengalami kerusakan dalam ${daysUntilFailure} hari (${rulHours} jam)`,
        timeframe,
        confidence: Math.round(confidence),
        details: s.reason, // Removed constraints_applied
        recommendedActions: s.actions || [],
        estimatedDowntime,
        recommendedStart: s.recommended_start,
        recommendedEnd: s.recommended_end,
        status: s.status?.toLowerCase() || "new",
        createdAt: s.created_at,
        aiModel: s.model_version || "AI-Model",
      };
    });
  } catch (error) {
    console.error("Error fetching recommendations from ML service:", error.message);
    throw error;
  }
}

module.exports = {
  getRecommendations,
};

const dashboardService = require("../services/dashboardService");

/**
 * GET /api/dashboard/active-tasks
 * Returns counts of maintenance tasks grouped by status
 */
async function getActiveTasks(req, res, next) {
  try {
    const data = await dashboardService.getActiveTasks();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/team-members
 * Returns team member statistics
 */
async function getTeamMembers(req, res, next) {
  try {
    const data = await dashboardService.getTeamMembers();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/team-perf
 * Returns weekly team performance data
 * Query params: weeks (optional, default: 4)
 */
async function getTeamPerf(req, res, next) {
  try {
    const weeks = parseInt(req.query.weeks) || 4;
    const data = await dashboardService.getTeamPerf(weeks);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getActiveTasks,
  getTeamMembers,
  getTeamPerf,
};

const reportsService = require('../services/reports.service');

async function getSummary(req, res, next) {
  try {
    const result = await reportsService.getSummary(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getTopEquipments(req, res, next) {
  try {
    const result = await reportsService.getTopEquipments(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getIdleEquipments(req, res, next) {
  try {
    const result = await reportsService.getIdleEquipments(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getMonthlyTrend(req, res, next) {
  try {
    const result = await reportsService.getMonthlyTrend(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getTopEquipments,
  getIdleEquipments,
  getMonthlyTrend,
};


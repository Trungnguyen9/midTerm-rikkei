const express = require('express');
const reportsController = require('../controllers/reports.controller');
const validate = require('../middlewares/validate.middleware');
const {
  reportQuerySchema,
  topEquipmentsQuerySchema,
  idleEquipmentsQuerySchema,
  monthlyTrendQuerySchema,
} = require('../validators/reports.validator');

const router = express.Router();

router.get('/summary', validate({ query: reportQuerySchema }), reportsController.getSummary);
router.get('/top-equipments', validate({ query: topEquipmentsQuerySchema }), reportsController.getTopEquipments);
router.get('/idle-equipments', validate({ query: idleEquipmentsQuerySchema }), reportsController.getIdleEquipments);
router.get('/monthly-trend', validate({ query: monthlyTrendQuerySchema }), reportsController.getMonthlyTrend);

module.exports = router;


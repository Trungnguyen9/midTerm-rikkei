const express = require('express');
const equipmentRoutes = require('./equipment.routes');
const borrowingRoutes = require('./borrowing.routes');
const reportsRoutes = require('./reports.routes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/equipments', equipmentRoutes);
router.use('/borrowings', borrowingRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;


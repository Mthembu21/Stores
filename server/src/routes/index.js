const express = require('express');

const { authRoutes } = require('./authRoutes');
const { userRoutes } = require('./userRoutes');
const { toolRoutes } = require('./toolRoutes');
const { borrowRoutes } = require('./borrowRoutes');
const { returnRoutes } = require('./returnRoutes');
const { ppeRoutes } = require('./ppeRoutes');
const { dashboardRoutes } = require('./dashboardRoutes');
const { specialToolRoutes } = require('./specialToolRoutes');
const { sparePartRoutes } = require('./sparePartRoutes');
const { storeIssueRoutes } = require('./storeIssueRoutes');
const { partReturnRoutes } = require('./partReturnRoutes');
const { stockMovementRoutes } = require('./stockMovementRoutes');
const { partsDashboardRoutes } = require('./partsDashboardRoutes');
const { kpiEntryRoutes } = require('./kpiEntryRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: true });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tools', toolRoutes);
router.use('/borrow', borrowRoutes);
router.use('/return', returnRoutes);
router.use('/ppe', ppeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/special-tools', specialToolRoutes);
router.use('/spare-parts', sparePartRoutes);
router.use('/store-issues', storeIssueRoutes);
router.use('/part-returns', partReturnRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/parts-dashboard', partsDashboardRoutes);
router.use('/kpi-entries', kpiEntryRoutes);

module.exports = router;

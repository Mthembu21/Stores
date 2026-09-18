const express = require('express');

const { authRoutes } = require('./authRoutes');
const { userRoutes } = require('./userRoutes');
const { toolRoutes } = require('./toolRoutes');
const { borrowRoutes } = require('./borrowRoutes');
const { returnRoutes } = require('./returnRoutes');
const { consumablesRoutes } = require('./consumablesRoutes');
const { dashboardRoutes } = require('./dashboardRoutes');
const { specialToolRoutes } = require('./specialToolRoutes');
const { sparePartRoutes } = require('./sparePartRoutes');
const { storeIssueRoutes } = require('./storeIssueRoutes');
const { consumablePartIssueRoutes } = require('./consumablePartIssueRoutes');
const { partReturnRoutes } = require('./partReturnRoutes');
const { stockMovementRoutes } = require('./stockMovementRoutes');
const { partsDashboardRoutes } = require('./partsDashboardRoutes');
const { kpiEntryRoutes } = require('./kpiEntryRoutes');
const { partsPeopleRoutes } = require('./partsPeopleRoutes');
const { machineRoutes } = require('./machineRoutes');
const { partRequestRoutes } = require('./partRequestRoutes');
const { nonStockItemRoutes } = require('./nonStockItemRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: true });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tools', toolRoutes);
router.use('/borrow', borrowRoutes);
router.use('/return', returnRoutes);
router.use('/consumables', consumablesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/special-tools', specialToolRoutes);
router.use('/spare-parts', sparePartRoutes);
router.use('/store-issues', storeIssueRoutes);
router.use('/consumable-part-issues', consumablePartIssueRoutes);
router.use('/part-returns', partReturnRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/parts-dashboard', partsDashboardRoutes);
router.use('/kpi-entries', kpiEntryRoutes);
router.use('/parts-people', partsPeopleRoutes);
router.use('/machines', machineRoutes);
router.use('/part-requests', partRequestRoutes);
router.use('/non-stock-items', nonStockItemRoutes);

module.exports = router;

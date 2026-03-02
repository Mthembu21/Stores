const express = require('express');

const { authRoutes } = require('./authRoutes');
const { userRoutes } = require('./userRoutes');
const { toolRoutes } = require('./toolRoutes');
const { borrowRoutes } = require('./borrowRoutes');
const { returnRoutes } = require('./returnRoutes');
const { ppeRoutes } = require('./ppeRoutes');
const { dashboardRoutes } = require('./dashboardRoutes');

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

module.exports = router;

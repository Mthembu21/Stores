const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin));

router.get('/', getDashboard);

module.exports = { dashboardRoutes: router };

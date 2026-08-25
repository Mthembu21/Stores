const express = require('express');
const { getPartsDashboard } = require('../controllers/partsDashboardController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', getPartsDashboard);

module.exports = { partsDashboardRoutes: router };

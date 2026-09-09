const express = require('express');
const { takeConsumable, listConsumables, consumablesMonthlySummary } = require('../controllers/consumablesController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin));

router.get('/', listConsumables);
router.post('/', takeConsumable);
router.get('/monthly-summary', consumablesMonthlySummary);

module.exports = { consumablesRoutes: router };

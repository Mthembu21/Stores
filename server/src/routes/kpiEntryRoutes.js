const express = require('express');
const { upsertKpiEntry, listKpiEntries } = require('../controllers/kpiEntriesController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listKpiEntries);
router.post('/', upsertKpiEntry);

module.exports = { kpiEntryRoutes: router };

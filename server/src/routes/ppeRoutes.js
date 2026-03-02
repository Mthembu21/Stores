const express = require('express');
const { takePpe, listPpe, ppeMonthlySummary } = require('../controllers/ppeController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin));

router.get('/', listPpe);
router.post('/', takePpe);
router.get('/monthly-summary', ppeMonthlySummary);

module.exports = { ppeRoutes: router };

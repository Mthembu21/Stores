const express = require('express');
const {
  listDefinitions,
  updateDefinition,
  listEntries,
  saveEntries,
  getSummary,
} = require('../controllers/daaKpisController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.DAAWarehouse));

router.get('/definitions', listDefinitions);
// Clerks and Admin can both adjust targets; each change records who made it.
router.patch('/definitions/:id', updateDefinition);
router.get('/entries', listEntries);
router.post('/entries', saveEntries);
router.get('/summary', getSummary);

module.exports = { daaKpiRoutes: router };

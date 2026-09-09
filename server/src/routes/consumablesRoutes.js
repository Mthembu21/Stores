const express = require('express');
const {
  listConsumableItems,
  createConsumableItem,
  updateConsumableItem,
  restockConsumableItem,
  deleteConsumableItem,
  takeConsumable,
  listConsumables,
  consumablesMonthlySummary,
} = require('../controllers/consumablesController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.ToolsStoreman));

router.get('/items', listConsumableItems);
router.post('/items', createConsumableItem);
router.patch('/items/:id', updateConsumableItem);
router.post('/items/:id/restock', restockConsumableItem);
router.delete('/items/:id', deleteConsumableItem);

router.get('/', listConsumables);
router.post('/', takeConsumable);
router.get('/monthly-summary', consumablesMonthlySummary);

module.exports = { consumablesRoutes: router };

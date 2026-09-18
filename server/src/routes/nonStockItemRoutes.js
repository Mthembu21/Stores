const express = require('express');
const {
  listNonStockItems,
  bulkImportNonStockItems,
  deleteNonStockItem,
} = require('../controllers/nonStockItemsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listNonStockItems);
router.post('/bulk', bulkImportNonStockItems);
router.delete('/:id', deleteNonStockItem);

module.exports = { nonStockItemRoutes: router };

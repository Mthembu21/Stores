const express = require('express');
const {
  listSpareParts,
  getSparePart,
  createSparePart,
  updateSparePart,
  bulkCreateSpareParts,
  restockSparePart,
  getConsumablesTracking,
} = require('../controllers/sparePartsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listSpareParts);
router.get('/consumables', getConsumablesTracking);
router.get('/:id', getSparePart);
router.post('/', createSparePart);
router.post('/bulk', bulkCreateSpareParts);
router.post('/:id/restock', restockSparePart);
router.patch('/:id', updateSparePart);

module.exports = { sparePartRoutes: router };

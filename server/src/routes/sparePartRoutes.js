const express = require('express');
const {
  listSpareParts,
  getSparePart,
  createSparePart,
  updateSparePart,
} = require('../controllers/sparePartsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listSpareParts);
router.get('/:id', getSparePart);
router.post('/', createSparePart);
router.patch('/:id', updateSparePart);

module.exports = { sparePartRoutes: router };

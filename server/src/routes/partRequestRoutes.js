const express = require('express');
const {
  listPartRequests,
  createPartRequest,
  updatePartRequest,
  deletePartRequest,
} = require('../controllers/partRequestsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listPartRequests);
router.post('/', createPartRequest);
router.patch('/:id', updatePartRequest);
router.delete('/:id', deletePartRequest);

module.exports = { partRequestRoutes: router };

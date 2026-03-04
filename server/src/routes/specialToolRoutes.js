const express = require('express');
const {
  listSpecialTools,
  listDispatches,
  listAssignments,
  assignSpecialTool,
  dispatchSpecialTool,
  returnDispatch,
} = require('../controllers/specialToolsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin));

router.get('/', listSpecialTools);
router.get('/dispatches', listDispatches);
router.get('/assignments', listAssignments);
router.post('/:toolId/assign', assignSpecialTool);
router.post('/:toolId/dispatch', dispatchSpecialTool);
router.post('/dispatch/:dispatchId/return', returnDispatch);

module.exports = { specialToolRoutes: router };

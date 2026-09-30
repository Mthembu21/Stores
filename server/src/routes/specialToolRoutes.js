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
// SHEQ can view this page but not perform storeman actions (assign/dispatch/return).
router.use(requireRole(Roles.Admin, Roles.ToolsStoreman, Roles.SHEQ));

router.get('/', listSpecialTools);
router.get('/dispatches', listDispatches);
router.get('/assignments', listAssignments);
router.post('/:toolId/assign', requireRole(Roles.Admin, Roles.ToolsStoreman), assignSpecialTool);
router.post('/:toolId/dispatch', requireRole(Roles.Admin, Roles.ToolsStoreman), dispatchSpecialTool);
router.post('/dispatch/:dispatchId/return', requireRole(Roles.Admin, Roles.ToolsStoreman), returnDispatch);

module.exports = { specialToolRoutes: router };

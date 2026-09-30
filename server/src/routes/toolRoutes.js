const express = require('express');
const { listTools, createTool, updateTool, deleteTool } = require('../controllers/toolsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);

// SHEQ needs read access to Tools (the Special Tools page is built on this list)
// but should not create/edit/delete tools.
router.get('/', requireRole(Roles.Admin, Roles.ToolsStoreman, Roles.SHEQ), listTools);
router.post('/', requireRole(Roles.Admin, Roles.ToolsStoreman), createTool);
router.patch('/:id', requireRole(Roles.Admin, Roles.ToolsStoreman), updateTool);
router.delete('/:id', requireRole(Roles.Admin, Roles.ToolsStoreman), deleteTool);

module.exports = { toolRoutes: router };

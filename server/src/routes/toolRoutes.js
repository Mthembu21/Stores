const express = require('express');
const { listTools, createTool, updateTool, deleteTool } = require('../controllers/toolsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin));

router.get('/', listTools);
router.post('/', createTool);
router.patch('/:id', updateTool);
router.delete('/:id', deleteTool);

module.exports = { toolRoutes: router };

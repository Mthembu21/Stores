const express = require('express');
const { returnTool } = require('../controllers/returnController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin));

router.post('/', returnTool);

module.exports = { returnRoutes: router };

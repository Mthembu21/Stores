const express = require('express');
const { createPartReturn } = require('../controllers/partReturnsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.post('/', createPartReturn);

module.exports = { partReturnRoutes: router };

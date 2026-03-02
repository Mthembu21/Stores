const express = require('express');
const { borrowTool, listBorrowings } = require('../controllers/borrowController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin));

router.get('/', listBorrowings);
router.post('/', borrowTool);

module.exports = { borrowRoutes: router };

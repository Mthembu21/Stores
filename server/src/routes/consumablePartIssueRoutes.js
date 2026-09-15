const express = require('express');
const {
  createConsumablePartIssue,
  listConsumablePartIssues,
} = require('../controllers/consumablePartIssuesController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listConsumablePartIssues);
router.post('/', createConsumablePartIssue);

module.exports = { consumablePartIssueRoutes: router };

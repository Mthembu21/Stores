const express = require('express');
const {
  createStoreIssue,
  listStoreIssues,
  getStoreIssue,
} = require('../controllers/storeIssuesController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listStoreIssues);
router.get('/:id', getStoreIssue);
router.post('/', createStoreIssue);

module.exports = { storeIssueRoutes: router };

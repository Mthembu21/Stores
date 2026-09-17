const express = require('express');
const {
  createStoreIssue,
  listStoreIssues,
  getStoreIssue,
  updateStoreIssue,
  deleteStoreIssue,
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
router.patch('/:id', updateStoreIssue);
router.delete('/:id', deleteStoreIssue);

module.exports = { storeIssueRoutes: router };

const express = require('express');
const { listImsAudits, createImsAudit, updateImsAudit, deleteImsAudit } = require('../controllers/imsAuditsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.SHEQ));

router.get('/', listImsAudits);
router.post('/', createImsAudit);
router.patch('/:id', updateImsAudit);
router.delete('/:id', deleteImsAudit);

module.exports = { imsAuditRoutes: router };

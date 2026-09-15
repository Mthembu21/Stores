const express = require('express');
const { listPartsPeople, createPartsPerson, deletePartsPerson } = require('../controllers/partsPeopleController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listPartsPeople);
router.post('/', createPartsPerson);
router.delete('/:id', deletePartsPerson);

module.exports = { partsPeopleRoutes: router };

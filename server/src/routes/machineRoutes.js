const express = require('express');
const { listMachines, createMachine, updateMachine, deleteMachine } = require('../controllers/machinesController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.PartsStoreman, Roles.Supervisor));

router.get('/', listMachines);
router.post('/', createMachine);
router.patch('/:id', updateMachine);
router.delete('/:id', deleteMachine);

module.exports = { machineRoutes: router };

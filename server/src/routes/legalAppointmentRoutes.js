const express = require('express');
const {
  listLegalAppointments,
  createLegalAppointment,
  updateLegalAppointment,
  deleteLegalAppointment,
} = require('../controllers/legalAppointmentsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.SHEQ));

router.get('/', listLegalAppointments);
router.post('/', createLegalAppointment);
router.patch('/:id', updateLegalAppointment);
router.delete('/:id', deleteLegalAppointment);

module.exports = { legalAppointmentRoutes: router };

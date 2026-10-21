const express = require('express');
const {
  listLegalAppointments,
  createLegalAppointment,
  updateLegalAppointment,
  deleteLegalAppointment,
  uploadLegalAppointmentDocument,
  downloadLegalAppointmentDocument,
  deleteLegalAppointmentDocument,
} = require('../controllers/legalAppointmentsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { Roles } = require('../config/roles');

// Documents are stored in MongoDB, so stay well under its 16MB per-document cap.
const MAX_DOCUMENT_SIZE = '10mb';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(Roles.Admin, Roles.SHEQ));

router.get('/', listLegalAppointments);
router.post('/', createLegalAppointment);
router.patch('/:id', updateLegalAppointment);
router.delete('/:id', deleteLegalAppointment);

router.get('/:id/document', downloadLegalAppointmentDocument);
router.put(
  '/:id/document',
  express.raw({ type: () => true, limit: MAX_DOCUMENT_SIZE }),
  uploadLegalAppointmentDocument
);
router.delete('/:id/document', deleteLegalAppointmentDocument);

module.exports = { legalAppointmentRoutes: router };

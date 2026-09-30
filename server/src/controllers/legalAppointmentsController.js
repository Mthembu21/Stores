const { ApiError } = require('../utils/ApiError');
const { LegalAppointment, LEGAL_APPOINTMENT_TYPES } = require('../models/LegalAppointment');

async function listLegalAppointments(req, res) {
  const { search } = req.query;

  const filter = {};
  if (search) {
    const re = new RegExp(String(search).trim(), 'i');
    filter.$or = [{ employeeName: re }, { workshopArea: re }, { position: re }, { appointmentType: re }];
  }

  const appointments = await LegalAppointment.find(filter).sort({ employeeName: 1, appointmentType: 1 });
  res.json({ appointments, appointmentTypes: LEGAL_APPOINTMENT_TYPES });
}

async function createLegalAppointment(req, res) {
  const { employeeName, workshopArea, position, appointmentType, dueDate } = req.body;

  if (!employeeName || !appointmentType) {
    throw new ApiError(400, 'Employee name and appointment type are required');
  }
  if (!LEGAL_APPOINTMENT_TYPES.includes(appointmentType)) {
    throw new ApiError(400, 'Unknown appointment type');
  }

  const existing = await LegalAppointment.findOne({
    employeeName: String(employeeName).trim(),
    appointmentType,
  });
  if (existing) {
    throw new ApiError(409, 'This employee already has that appointment on record');
  }

  const appointment = await LegalAppointment.create({
    employeeName: String(employeeName).trim(),
    workshopArea: workshopArea ? String(workshopArea).trim() : '',
    position: position ? String(position).trim() : '',
    appointmentType,
    dueDate: dueDate ? new Date(dueDate) : null,
  });

  res.status(201).json({ appointment });
}

async function updateLegalAppointment(req, res) {
  const { id } = req.params;
  const { employeeName, workshopArea, position, dueDate } = req.body;

  const appointment = await LegalAppointment.findById(id);
  if (!appointment) {
    throw new ApiError(404, 'Legal appointment record not found');
  }

  if (employeeName !== undefined) appointment.employeeName = String(employeeName).trim();
  if (workshopArea !== undefined) appointment.workshopArea = String(workshopArea).trim();
  if (position !== undefined) appointment.position = String(position).trim();
  if (dueDate !== undefined) appointment.dueDate = dueDate ? new Date(dueDate) : null;

  await appointment.save();
  res.json({ appointment });
}

async function deleteLegalAppointment(req, res) {
  const { id } = req.params;
  const appointment = await LegalAppointment.findById(id);
  if (!appointment) {
    throw new ApiError(404, 'Legal appointment record not found');
  }
  await appointment.deleteOne();
  res.json({ ok: true });
}

module.exports = {
  listLegalAppointments,
  createLegalAppointment,
  updateLegalAppointment,
  deleteLegalAppointment,
};

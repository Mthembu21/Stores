const { ApiError } = require('../utils/ApiError');
const { LegalAppointment, LEGAL_APPOINTMENT_TYPES } = require('../models/LegalAppointment');
const { LegalAppointmentDocument } = require('../models/LegalAppointmentDocument');

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
  const { employeeName, workshopArea, position, appointmentType, dueDate, noExpiry } = req.body;

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

  const isNoExpiry = Boolean(noExpiry);

  const appointment = await LegalAppointment.create({
    employeeName: String(employeeName).trim(),
    workshopArea: workshopArea ? String(workshopArea).trim() : '',
    position: position ? String(position).trim() : '',
    appointmentType,
    dueDate: isNoExpiry ? null : dueDate ? new Date(dueDate) : null,
    noExpiry: isNoExpiry,
  });

  res.status(201).json({ appointment });
}

async function updateLegalAppointment(req, res) {
  const { id } = req.params;
  const { employeeName, workshopArea, position, dueDate, noExpiry } = req.body;

  const appointment = await LegalAppointment.findById(id);
  if (!appointment) {
    throw new ApiError(404, 'Legal appointment record not found');
  }

  if (employeeName !== undefined) appointment.employeeName = String(employeeName).trim();
  if (workshopArea !== undefined) appointment.workshopArea = String(workshopArea).trim();
  if (position !== undefined) appointment.position = String(position).trim();
  if (dueDate !== undefined) appointment.dueDate = dueDate ? new Date(dueDate) : null;
  if (noExpiry !== undefined) {
    appointment.noExpiry = Boolean(noExpiry);
    // A due date is meaningless once the appointment is marked as not expiring.
    if (appointment.noExpiry) appointment.dueDate = null;
  }

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
  await LegalAppointmentDocument.deleteOne({ appointment: appointment._id });
  res.json({ ok: true });
}

// The file arrives as the raw request body (see the route's express.raw parser);
// its name travels URI-encoded in the X-File-Name header and its real MIME type in
// X-File-Type (the request itself is sent as octet-stream so the global JSON parser
// never consumes it). Uploading again replaces the existing document.
async function uploadLegalAppointmentDocument(req, res) {
  const { id } = req.params;
  const appointment = await LegalAppointment.findById(id);
  if (!appointment) {
    throw new ApiError(404, 'Legal appointment record not found');
  }

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new ApiError(400, 'No file was uploaded');
  }

  let fileName = 'document';
  try {
    fileName = decodeURIComponent(req.get('X-File-Name') || '') || fileName;
  } catch {
    // Keep the fallback name if the header isn't valid URI encoding.
  }
  const mimeType = req.get('X-File-Type') || 'application/octet-stream';
  const size = req.body.length;

  await LegalAppointmentDocument.findOneAndUpdate(
    { appointment: appointment._id },
    { appointment: appointment._id, fileName, mimeType, size, data: req.body },
    { upsert: true, setDefaultsOnInsert: true }
  );

  appointment.document = { fileName, mimeType, size, uploadedAt: new Date() };
  await appointment.save();

  res.json({ appointment });
}

async function downloadLegalAppointmentDocument(req, res) {
  const { id } = req.params;
  const doc = await LegalAppointmentDocument.findOne({ appointment: id });
  if (!doc) {
    throw new ApiError(404, 'No document attached to this appointment');
  }

  res.set('Content-Type', doc.mimeType || 'application/octet-stream');
  res.set('Content-Length', String(doc.data.length));
  res.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`);
  res.send(doc.data);
}

async function deleteLegalAppointmentDocument(req, res) {
  const { id } = req.params;
  const appointment = await LegalAppointment.findById(id);
  if (!appointment) {
    throw new ApiError(404, 'Legal appointment record not found');
  }

  await LegalAppointmentDocument.deleteOne({ appointment: appointment._id });
  appointment.document = null;
  await appointment.save();

  res.json({ appointment });
}

module.exports = {
  listLegalAppointments,
  createLegalAppointment,
  updateLegalAppointment,
  deleteLegalAppointment,
  uploadLegalAppointmentDocument,
  downloadLegalAppointmentDocument,
  deleteLegalAppointmentDocument,
};

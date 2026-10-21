const mongoose = require('mongoose');

// The supporting document (certificate / signed appointment letter) attached to a
// legal appointment. Kept in its own collection so listing appointments never
// pulls file contents; the appointment itself only carries the file's metadata.
const legalAppointmentDocumentSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalAppointment', required: true, unique: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

const LegalAppointmentDocument = mongoose.model('LegalAppointmentDocument', legalAppointmentDocumentSchema);

module.exports = { LegalAppointmentDocument };

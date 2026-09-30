const mongoose = require('mongoose');

// The fixed set of legal appointment / competency types from the Epiroc SA
// Legal Appointment Matrix. One employee can hold several of these; each
// (employee, appointmentType) pair is tracked as its own row so a due date
// can be set per appointment.
const LEGAL_APPOINTMENT_TYPES = [
  '16.1 Appointment',
  '16.2 Appointment',
  'Crisis Management Committee',
  'Crisis Management Stand-by',
  'Information Officer & Assistant',
  'ERW 9 Emergency Controller',
  'ERW 9(1) Emergency Evacuation Coordinator',
  'GAR 9(2) Incident Investigator',
  'GAR (1) Recorder of Incidents',
  'GAR 8(1) Reporter of Incidents to the DoL',
  'Loss Prevention Standard',
  '19(5) Health & Safety Committee Chairman',
  '19(3) Health & Safety Committee Member',
  '17(1) Health and Safety Representative',
  'GSR (3) First Aid Coordinator',
  'ERW 9(2) Fire Fighter',
  'GMR 2(1) Supervisor of Machinery',
  'DMR 18(11) Driven Machinery - Forklifts',
  'DMR 18(11) Driven Machinery - Overhead Crane',
  'Conduct a Continuous Risk Assessment',
  'Medical Surveillance - Certificate of Fitness',
  'Machinery Maneuvering License',
  'Handling Hazardous Chemicals',
  'Dangerous Goods Handling',
  'Legal Accountability',
  'Noise Induced Hearing Loss',
  'Supervisor of Machinery (Site)',
];

const legalAppointmentSchema = new mongoose.Schema(
  {
    employeeName: { type: String, required: true, trim: true },
    workshopArea: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' },
    appointmentType: { type: String, required: true, trim: true, enum: LEGAL_APPOINTMENT_TYPES },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

legalAppointmentSchema.index({ employeeName: 1, appointmentType: 1 }, { unique: true });

const LegalAppointment = mongoose.model('LegalAppointment', legalAppointmentSchema);

module.exports = { LegalAppointment, LEGAL_APPOINTMENT_TYPES };

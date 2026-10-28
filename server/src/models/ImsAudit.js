const mongoose = require('mongoose');

// One row of the IMS Audit Programme: an area/process to be audited in a given
// year. Mirrors the "Audit programme" sheet of the IMS audit programme workbook.

const IMS_AUDIT_FOCUS_AREAS = [
  'Internal',
  'Branch',
  'Regional',
  'Contract sites',
  'Contractors',
  'Suppliers',
  'Compliance',
  'Outsourced processes',
];

// The workbook's colour legend, in workflow order.
const IMS_AUDIT_STATUSES = ['Planned', 'Invite Sent', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

const IMS_AUDIT_TYPES = ['External', 'Internal'];

// A month the audit is scheduled in, with that month's status. An audit that was
// postponed keeps its old month (as Cancelled) alongside the new one, so the
// rescheduling history stays visible, exactly as the spreadsheet shows it.
const scheduleEntrySchema = new mongoose.Schema(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    auditType: { type: String, enum: IMS_AUDIT_TYPES, default: 'External' },
    status: { type: String, enum: IMS_AUDIT_STATUSES, default: 'Planned' },
  },
  { _id: false }
);

const findingCountSchema = new mongoose.Schema(
  {
    raised: { type: Number, default: 0, min: 0 },
    closed: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const imsAuditSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    number: { type: Number, default: null },
    focusArea: { type: String, required: true, enum: IMS_AUDIT_FOCUS_AREAS },
    processArea: { type: String, required: true, trim: true },
    businessArea: { type: String, trim: true, default: '' },
    responsible: { type: String, trim: true, default: '' },
    schedule: { type: [scheduleEntrySchema], default: [] },
    // Free text, as on the sheet (e.g. "26 - 27 May, 19 June").
    auditDates: { type: String, trim: true, default: '' },
    reportSubmittedDate: { type: Date, default: null },
    auditor: { type: String, trim: true, default: '' },
    comments: { type: String, trim: true, default: '' },
    findings: {
      major: { type: findingCountSchema, default: () => ({}) },
      minor: { type: findingCountSchema, default: () => ({}) },
      observation: { type: findingCountSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

imsAuditSchema.index({ year: 1, focusArea: 1, processArea: 1 }, { unique: true });

const ImsAudit = mongoose.model('ImsAudit', imsAuditSchema);

module.exports = { ImsAudit, IMS_AUDIT_FOCUS_AREAS, IMS_AUDIT_STATUSES, IMS_AUDIT_TYPES };

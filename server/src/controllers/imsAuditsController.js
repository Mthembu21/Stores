const { ApiError } = require('../utils/ApiError');
const { ImsAudit, IMS_AUDIT_FOCUS_AREAS, IMS_AUDIT_STATUSES, IMS_AUDIT_TYPES } = require('../models/ImsAudit');

const EDITABLE_TEXT_FIELDS = ['processArea', 'businessArea', 'responsible', 'auditDates', 'auditor', 'comments'];
const FINDING_KINDS = ['major', 'minor', 'observation'];

function normalizeSchedule(schedule) {
  if (!Array.isArray(schedule)) {
    throw new ApiError(400, 'Schedule must be a list of months');
  }
  const byMonth = new Map();
  schedule.forEach((entry) => {
    const month = Number(entry?.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new ApiError(400, 'Schedule months must be between 1 and 12');
    }
    const auditType = entry.auditType || 'External';
    const status = entry.status || 'Planned';
    if (!IMS_AUDIT_TYPES.includes(auditType)) throw new ApiError(400, 'Unknown audit type');
    if (!IMS_AUDIT_STATUSES.includes(status)) throw new ApiError(400, 'Unknown audit status');
    byMonth.set(month, { month, auditType, status });
  });
  return Array.from(byMonth.values()).sort((a, b) => a.month - b.month);
}

// Closed can never exceed raised; open is always derived (raised - closed).
function normalizeFindings(findings) {
  const result = {};
  FINDING_KINDS.forEach((kind) => {
    const raised = Math.max(0, Number(findings?.[kind]?.raised) || 0);
    const closed = Math.min(raised, Math.max(0, Number(findings?.[kind]?.closed) || 0));
    result[kind] = { raised, closed };
  });
  return result;
}

function applyFields(audit, body) {
  EDITABLE_TEXT_FIELDS.forEach((field) => {
    if (body[field] !== undefined) audit[field] = String(body[field] ?? '').trim();
  });
  if (body.focusArea !== undefined) {
    if (!IMS_AUDIT_FOCUS_AREAS.includes(body.focusArea)) throw new ApiError(400, 'Unknown focus area');
    audit.focusArea = body.focusArea;
  }
  if (body.number !== undefined) {
    audit.number = body.number === '' || body.number === null ? null : Number(body.number);
  }
  if (body.reportSubmittedDate !== undefined) {
    audit.reportSubmittedDate = body.reportSubmittedDate ? new Date(body.reportSubmittedDate) : null;
  }
  if (body.schedule !== undefined) audit.schedule = normalizeSchedule(body.schedule);
  if (body.findings !== undefined) audit.findings = normalizeFindings(body.findings);
}

async function listImsAudits(req, res) {
  const year = Number(req.query.year) || new Date().getFullYear();
  const [audits, years] = await Promise.all([
    ImsAudit.find({ year }).sort({ number: 1, processArea: 1 }),
    ImsAudit.distinct('year'),
  ]);
  res.json({
    audits,
    years: years.sort((a, b) => a - b),
    focusAreas: IMS_AUDIT_FOCUS_AREAS,
    statuses: IMS_AUDIT_STATUSES,
    auditTypes: IMS_AUDIT_TYPES,
  });
}

async function createImsAudit(req, res) {
  const { year, focusArea, processArea } = req.body;
  if (!year || !focusArea || !String(processArea || '').trim()) {
    throw new ApiError(400, 'Year, focus area and process/area are required');
  }
  if (!IMS_AUDIT_FOCUS_AREAS.includes(focusArea)) {
    throw new ApiError(400, 'Unknown focus area');
  }

  const existing = await ImsAudit.findOne({ year: Number(year), focusArea, processArea: String(processArea).trim() });
  if (existing) {
    throw new ApiError(409, 'That process/area is already on the programme for this year');
  }

  const audit = new ImsAudit({ year: Number(year), focusArea, processArea: String(processArea).trim() });
  applyFields(audit, req.body);
  if (audit.number === null) {
    const last = await ImsAudit.findOne({ year: audit.year }).sort({ number: -1 });
    audit.number = (last?.number || 0) + 1;
  }
  await audit.save();

  res.status(201).json({ audit });
}

async function updateImsAudit(req, res) {
  const audit = await ImsAudit.findById(req.params.id);
  if (!audit) {
    throw new ApiError(404, 'Audit not found');
  }
  applyFields(audit, req.body);
  await audit.save();
  res.json({ audit });
}

async function deleteImsAudit(req, res) {
  const audit = await ImsAudit.findById(req.params.id);
  if (!audit) {
    throw new ApiError(404, 'Audit not found');
  }
  await audit.deleteOne();
  res.json({ ok: true });
}

module.exports = { listImsAudits, createImsAudit, updateImsAudit, deleteImsAudit };

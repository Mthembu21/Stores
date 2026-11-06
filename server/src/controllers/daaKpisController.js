const { ApiError } = require('../utils/ApiError');
const { DAA_KPI_DEFAULTS } = require('../config/daaKpiDefaults');
const { DaaKpiDefinition } = require('../models/DaaKpiDefinition');
const { DaaKpiEntry } = require('../models/DaaKpiEntry');
const { summarize, startOfMonth, startOfQuarter, addMonths, addDays } = require('../utils/daaKpiScoring');

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDay(day) {
  return typeof day === 'string' && DAY_RE.test(day) && !Number.isNaN(new Date(`${day}T00:00:00Z`).getTime());
}

function localToday() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// The client sends its own calendar day so "today" matches the warehouse, not the
// server's time zone.
function resolveToday(day) {
  return isValidDay(day) ? day : localToday();
}

// Creates any default KPI that isn't in the database yet (all of them on first use).
// Existing ones are never overwritten, so Admin's target changes stick.
async function ensureSeeded() {
  const existing = await DaaKpiDefinition.find({}).select('key').lean();
  const have = new Set(existing.map((d) => d.key));
  const missing = DAA_KPI_DEFAULTS.map((d, i) => ({ ...d, sortOrder: i })).filter((d) => !have.has(d.key));
  if (missing.length > 0) {
    await DaaKpiDefinition.insertMany(missing, { ordered: false }).catch((err) => {
      if (err.code !== 11000) throw err; // another request seeded the same key first
    });
  }
}

async function loadDefinitions({ includeInactive = false } = {}) {
  await ensureSeeded();
  const filter = includeInactive ? {} : { active: true };
  return DaaKpiDefinition.find(filter).sort({ sortOrder: 1 }).lean();
}

async function listDefinitions(req, res) {
  const definitions = await loadDefinitions({ includeInactive: req.query.includeInactive === 'true' });
  res.json({ definitions });
}

async function updateDefinition(req, res) {
  const def = await DaaKpiDefinition.findById(req.params.id);
  if (!def) {
    throw new ApiError(404, 'KPI not found');
  }

  const textFields = ['label', 'description', 'responsible', 'numeratorLabel', 'denominatorLabel', 'unit'];
  for (const field of textFields) {
    if (req.body[field] !== undefined) def[field] = String(req.body[field] ?? '').trim();
  }
  if (!def.label) {
    throw new ApiError(400, 'KPI name is required');
  }

  for (const field of ['target', 'progressBase']) {
    if (req.body[field] !== undefined) {
      const raw = req.body[field];
      if (raw === null || raw === '') {
        def[field] = null;
      } else {
        const n = Number(raw);
        if (Number.isNaN(n) || (field === 'progressBase' && n <= 0)) {
          throw new ApiError(400, field === 'target' ? 'Target must be a number' : 'Total bin locations must be above 0');
        }
        def[field] = n;
      }
    }
  }
  if (req.body.targetDirection !== undefined) {
    if (!['min', 'max'].includes(req.body.targetDirection)) {
      throw new ApiError(400, 'Invalid target direction');
    }
    def.targetDirection = req.body.targetDirection;
  }
  if (req.body.active !== undefined) def.active = Boolean(req.body.active);

  if (def.isModified()) {
    def.lastChangedByName = req.user.fullName || '';
    def.lastChangedAt = new Date();
  }
  await def.save();
  res.json({ definition: def });
}

// Entries for one capture day: that day's daily KPIs plus the month's monthly ones.
async function listEntries(req, res) {
  const { day } = req.query;
  if (!isValidDay(day)) {
    throw new ApiError(400, 'Provide a valid day');
  }
  const entries = await DaaKpiEntry.find({ day: { $in: [day, startOfMonth(day)] } }).lean();
  res.json({ entries });
}

function toWholeNumber(raw, label) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new ApiError(400, `${label} must be a whole number of 0 or more`);
  }
  return n;
}

// Saves one capture day's KPIs in one go. A KPI sent back completely blank removes
// that KPI's entry, so a mistaken capture can be cleared.
async function saveEntries(req, res) {
  const { day, today: clientToday, entries: input } = req.body;
  if (!isValidDay(day)) {
    throw new ApiError(400, 'Provide a valid day');
  }
  if (day > resolveToday(clientToday)) {
    throw new ApiError(400, "KPIs can't be captured for a future date");
  }
  if (!Array.isArray(input) || input.length === 0) {
    throw new ApiError(400, 'Nothing to save');
  }

  const definitions = await loadDefinitions();
  const defsByKey = new Map(definitions.map((d) => [d.key, d]));

  // Validate everything first so a bad line doesn't leave half the day saved.
  const ops = [];
  for (const raw of input) {
    const def = defsByKey.get(raw?.kpiKey);
    if (!def) {
      throw new ApiError(400, `Unknown KPI: ${raw?.kpiKey}`);
    }
    const entryDay = def.frequency === 'monthly' ? startOfMonth(day) : day;
    const fields = { numerator: null, denominator: null, count: null, value: null, checks: [] };

    if (def.captureType === 'ratio') {
      fields.numerator = toWholeNumber(raw.numerator, def.numeratorLabel || 'Value');
      fields.denominator = toWholeNumber(raw.denominator, def.denominatorLabel || 'Total');
      if ((fields.numerator === null) !== (fields.denominator === null)) {
        throw new ApiError(400, `${def.label}: fill in both numbers or neither`);
      }
      if (fields.numerator !== null && fields.numerator > fields.denominator) {
        throw new ApiError(400, `${def.label}: ${fields.numerator} can't be more than ${fields.denominator}`);
      }
    } else if (def.captureType === 'checklist') {
      const checks = Array.isArray(raw.checks) ? raw.checks : [];
      if (checks.length > def.checklistItems.length || checks.some((c) => typeof c !== 'boolean' && c !== null)) {
        throw new ApiError(400, `${def.label}: invalid checklist`);
      }
      // Unanswered items (null) are dropped from the score rather than counted as "no".
      fields.checks = checks.length && checks.every((c) => c === null) ? [] : checks;
      if (fields.checks.some((c) => c === null)) {
        throw new ApiError(400, `${def.label}: answer every checklist item or none`);
      }
    } else if (def.captureType === 'count' || def.captureType === 'progress') {
      fields.count = toWholeNumber(raw.count, def.numeratorLabel || def.label);
    } else if (def.captureType === 'value') {
      if (raw.value !== null && raw.value !== undefined && raw.value !== '') {
        const n = Number(raw.value);
        if (Number.isNaN(n)) throw new ApiError(400, `${def.label} must be a number`);
        fields.value = n;
      }
    }

    const comment = raw.comment ? String(raw.comment).trim() : '';
    const isBlank =
      fields.numerator === null && fields.count === null && fields.value === null && fields.checks.length === 0 && !comment;
    ops.push({ def, entryDay, fields, comment, isBlank });
  }

  for (const op of ops) {
    const filter = { kpiKey: op.def.key, day: op.entryDay };
    if (op.isBlank) {
      await DaaKpiEntry.deleteOne(filter);
    } else {
      await DaaKpiEntry.findOneAndUpdate(
        filter,
        {
          ...op.fields,
          comment: op.comment,
          capturedBy: req.user._id,
          capturedByName: req.user.fullName || '',
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }
  }

  const entries = await DaaKpiEntry.find({ day: { $in: [day, startOfMonth(day)] } }).lean();
  res.json({ entries });
}

const PERIOD_COUNTS = { week: 12, month: 12, quarter: 4 };

async function getSummary(req, res) {
  const period = PERIOD_COUNTS[req.query.period] ? req.query.period : 'week';
  const count = PERIOD_COUNTS[period];
  const today = resolveToday(req.query.today);

  const definitions = await loadDefinitions();

  // Earliest day any period can reach back to — a quarter start, because cycle count
  // progress is measured quarter-to-date.
  let earliest;
  if (period === 'week') earliest = addDays(today, -7 * count);
  else if (period === 'month') earliest = addMonths(today, -(count - 1));
  else earliest = addMonths(startOfQuarter(today), -3 * (count - 1));
  earliest = startOfQuarter(earliest);

  const entries = await DaaKpiEntry.find({ day: { $gte: earliest, $lte: today } })
    .select('kpiKey day numerator denominator count value checks comment capturedByName')
    .lean();

  const periods = summarize(definitions, entries, period, today, count);

  // Latest comment per KPI within the current period — the "Comments/Actions" column.
  const current = periods[periods.length - 1];
  const latestComments = {};
  for (const e of entries) {
    if (!e.comment || e.day < current.start) continue;
    const prev = latestComments[e.kpiKey];
    if (!prev || e.day >= prev.day) latestComments[e.kpiKey] = { day: e.day, comment: e.comment, by: e.capturedByName };
  }

  res.json({ period, today, definitions, periods, latestComments });
}

module.exports = { listDefinitions, updateDefinition, listEntries, saveEntries, getSummary };

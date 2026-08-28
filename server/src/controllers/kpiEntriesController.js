const { ApiError } = require('../utils/ApiError');
const { KpiEntry } = require('../models/KpiEntry');
const { KPI_DEFINITIONS } = require('../config/kpiDefinitions');

const KPI_KEYS = KPI_DEFINITIONS.map((def) => def.key);

function startOfDay(input) {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function upsertKpiEntry(req, res) {
  const { date, values } = req.body;

  if (!values || typeof values !== 'object') {
    throw new ApiError(400, 'Missing KPI values');
  }

  const day = startOfDay(date || new Date());

  const setFields = { recordedBy: req.user._id };
  for (const key of KPI_KEYS) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      const raw = values[key];
      setFields[`values.${key}`] = raw === '' || raw === null || raw === undefined ? null : Number(raw);
    }
  }

  const entry = await KpiEntry.findOneAndUpdate(
    { date: day },
    { $set: setFields, $setOnInsert: { date: day } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('recordedBy');

  res.status(200).json({ entry });
}

async function listKpiEntries(req, res) {
  const { limit } = req.query;
  const cappedLimit = Math.min(Number(limit) || 30, 366);

  const entries = await KpiEntry.find({})
    .sort({ date: -1 })
    .limit(cappedLimit)
    .populate('recordedBy');

  res.json({ entries });
}

module.exports = { upsertKpiEntry, listKpiEntries };

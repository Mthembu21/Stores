const { ApiError } = require('../utils/ApiError');
const { KpiEntry } = require('../models/KpiEntry');
const { KPI_MEASURES } = require('../config/kpiDefinitions');

const MEASURE_KEYS = new Set(KPI_MEASURES.map((def) => def.key));

function startOfDay(input) {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toNullableNumber(v) {
  return v === '' || v === null || v === undefined ? null : Number(v);
}

async function upsertKpiEntry(req, res) {
  const { date, measures } = req.body;

  if (!measures || typeof measures !== 'object') {
    throw new ApiError(400, 'Missing KPI measures');
  }

  const day = startOfDay(date || new Date());

  const setFields = { recordedBy: req.user._id };
  for (const [key, data] of Object.entries(measures)) {
    if (!MEASURE_KEYS.has(key) || !data || typeof data !== 'object') continue;
    if (Object.prototype.hasOwnProperty.call(data, 'confirmed')) {
      setFields[`measures.${key}.confirmed`] = data.confirmed === null || data.confirmed === undefined ? null : Boolean(data.confirmed);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'numerator')) {
      setFields[`measures.${key}.numerator`] = toNullableNumber(data.numerator);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'denominator')) {
      setFields[`measures.${key}.denominator`] = toNullableNumber(data.denominator);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'count')) {
      setFields[`measures.${key}.count`] = toNullableNumber(data.count);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'comment')) {
      setFields[`measures.${key}.comment`] = data.comment || '';
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

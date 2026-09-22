const mongoose = require('mongoose');
const { KPI_MEASURES } = require('../config/kpiDefinitions');

const measureFields = {};
KPI_MEASURES.forEach((def) => {
  measureFields[def.key] = {
    confirmed: { type: Boolean, default: null }, // 'check' measures
    numerator: { type: Number, default: null }, // 'ratio' measures
    denominator: { type: Number, default: null }, // 'ratio' measures
    count: { type: Number, default: null }, // 'count' measures
    comment: { type: String, trim: true, default: '' },
  };
});

const kpiEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    measures: measureFields,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const KpiEntry = mongoose.model('KpiEntry', kpiEntrySchema);

module.exports = { KpiEntry };

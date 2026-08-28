const mongoose = require('mongoose');
const { KPI_DEFINITIONS } = require('../config/kpiDefinitions');

const valuesFields = {};
KPI_DEFINITIONS.forEach((def) => {
  valuesFields[def.key] = { type: Number, default: null };
});

const kpiEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    values: valuesFields,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const KpiEntry = mongoose.model('KpiEntry', kpiEntrySchema);

module.exports = { KpiEntry };

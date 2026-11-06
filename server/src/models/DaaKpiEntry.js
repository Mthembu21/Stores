const mongoose = require('mongoose');

// One KPI's figures for one day (or, for monthly KPIs, one month). Kept per KPI
// rather than one document per day so two clerks can capture different KPIs on the
// same day, and each records who captured it.
const daaKpiEntrySchema = new mongoose.Schema(
  {
    kpiKey: { type: String, required: true, trim: true },
    // 'YYYY-MM-DD' (a plain string so the warehouse's calendar day never shifts with
    // time zones). Monthly KPIs always use the 1st of the month.
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    numerator: { type: Number, default: null },
    denominator: { type: Number, default: null },
    count: { type: Number, default: null },
    value: { type: Number, default: null },
    checks: { type: [Boolean], default: [] },
    comment: { type: String, trim: true, default: '' },
    capturedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    capturedByName: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

daaKpiEntrySchema.index({ kpiKey: 1, day: 1 }, { unique: true });
daaKpiEntrySchema.index({ day: 1 });

const DaaKpiEntry = mongoose.model('DaaKpiEntry', daaKpiEntrySchema);

module.exports = { DaaKpiEntry };

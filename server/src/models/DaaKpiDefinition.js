const mongoose = require('mongoose');

const CAPTURE_TYPES = ['ratio', 'checklist', 'count', 'progress', 'value'];

// One DAA warehouse KPI. Seeded from config/daaKpiDefaults.js; Admin can edit the
// target and wording later. captureType/frequency are fixed once seeded, because
// changing them would make the KPI's existing daily entries meaningless.
const daaKpiDefinitionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    responsible: { type: String, trim: true, default: '' },
    captureType: { type: String, required: true, enum: CAPTURE_TYPES },
    frequency: { type: String, required: true, enum: ['daily', 'monthly'], default: 'daily' },
    numeratorLabel: { type: String, trim: true, default: '' },
    denominatorLabel: { type: String, trim: true, default: '' },
    checklistItems: { type: [String], default: [] },
    progressBase: { type: Number, min: 0, default: null },
    target: { type: Number, default: null },
    targetDirection: { type: String, required: true, enum: ['min', 'max'], default: 'min' },
    unit: { type: String, trim: true, default: '' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    // Clerks can change targets too, so keep who last did.
    lastChangedByName: { type: String, trim: true, default: '' },
    lastChangedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const DaaKpiDefinition = mongoose.model('DaaKpiDefinition', daaKpiDefinitionSchema);

module.exports = { DaaKpiDefinition, CAPTURE_TYPES };

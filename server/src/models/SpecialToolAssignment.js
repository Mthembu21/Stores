const mongoose = require('mongoose');

const pausePeriodSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ['Calibration', 'Inspection'] },
    startAt: { type: Date, required: true },
    endAt: { type: Date, default: null },
  },
  { _id: false }
);

const specialToolAssignmentSchema = new mongoose.Schema(
  {
    toolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true, index: true },
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startAt: { type: Date, required: true },
    plannedDurationDays: { type: Number, required: true, min: 1, max: 365 },
    plannedEndAt: { type: Date, required: true },
    currentEndAt: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'PausedCalibration', 'PausedInspection', 'Completed', 'Cancelled'],
      default: 'Active',
    },
    totalPausedMs: { type: Number, required: true, default: 0, min: 0 },
    pausePeriods: { type: [pausePeriodSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const SpecialToolAssignment = mongoose.model('SpecialToolAssignment', specialToolAssignmentSchema);

module.exports = { SpecialToolAssignment };

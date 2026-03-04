const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema(
  {
    toolName: { type: String, required: true, trim: true },
    toolCode: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Hand Tools', 'Power Tools', 'Equipment'],
    },
    quantityTotal: { type: Number, required: true, min: 0 },
    quantityAvailable: { type: Number, required: true, min: 0 },
    isSpecialTool: { type: Boolean, required: true, default: false },
    specialStatus: {
      type: String,
      required: true,
      enum: [
        'None',
        'Assigned',
        'Paused',
        'Under Calibration',
        'Under Inspection',
        'Overdue',
      ],
      default: 'None',
    },
    assignedToTechnicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    currentAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpecialToolAssignment', default: null },
    assignmentStartAt: { type: Date, default: null },
    assignmentEndAt: { type: Date, default: null },
    assignmentPausedAt: { type: Date, default: null },
    calibrationEnabled: { type: Boolean, required: true, default: false },
    calibrationIntervalDays: { type: Number, default: null, min: 1 },
    lastCalibrationAt: { type: Date, default: null },
    nextCalibrationDueAt: { type: Date, default: null },
    inspectionEnabled: { type: Boolean, required: true, default: false },
    inspectionIntervalDays: { type: Number, default: null, min: 1 },
    lastInspectionAt: { type: Date, default: null },
    nextInspectionDueAt: { type: Date, default: null },
    lastReturnCondition: {
      type: String,
      enum: ['Good', 'Fair', 'Damaged', 'Missing'],
      default: null,
    },
    lastReturnedAt: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: ['Available', 'Borrowed', 'Under Repair'],
      default: 'Available',
    },
    flag: {
      type: String,
      required: true,
      enum: ['None', 'Damaged', 'Missing'],
      default: 'None',
    },
  },
  { timestamps: true }
);

const Tool = mongoose.model('Tool', toolSchema);

module.exports = { Tool };

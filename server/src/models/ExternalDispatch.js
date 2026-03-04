const mongoose = require('mongoose');

const externalDispatchSchema = new mongoose.Schema(
  {
    toolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpecialToolAssignment', default: null, index: true },
    type: { type: String, required: true, enum: ['Calibration', 'Inspection'] },
    status: { type: String, required: true, enum: ['Open', 'Returned'], default: 'Open' },
    sentAt: { type: Date, required: true },
    expectedReturnAt: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    reference: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const ExternalDispatch = mongoose.model('ExternalDispatch', externalDispatchSchema);

module.exports = { ExternalDispatch };

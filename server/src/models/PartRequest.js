const mongoose = require('mongoose');

// A storeman-flagged "we need this part" note — separate from SparePart because the
// daily bulk-replace import deletes and recreates every returnable SparePart from
// scratch, so anything living on that record wouldn't survive a day. Keyed by part
// number (a durable identifier) rather than a SparePart ref, so a request made before
// today's import still makes sense after it.
const partRequestSchema = new mongoose.Schema(
  {
    partNumber: { type: String, required: true, trim: true },
    partDescription: { type: String, required: true, trim: true },
    quantityRequested: { type: Number, required: true, min: 1 },
    machineNumber: { type: String, trim: true, default: '' },
    requestorName: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      required: true,
      enum: ['Open', 'Received', 'Cancelled'],
      default: 'Open',
    },
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const PartRequest = mongoose.model('PartRequest', partRequestSchema);

module.exports = { PartRequest };

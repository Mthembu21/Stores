const mongoose = require('mongoose');

const RETURN_CONDITIONS = ['Good', 'Damaged', 'Faulty'];

const partReturnItemSchema = new mongoose.Schema(
  {
    // The StoreIssue item line this return is booked against.
    storeIssueItem: { type: mongoose.Schema.Types.ObjectId, required: true },
    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', default: null },
    partNumber: { type: String, required: true, trim: true },
    partDescription: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    // Good goes back into bookable stock; Damaged/Faulty is counted as physically in
    // the store (SparePart.damagedStock) but can't be issued.
    condition: { type: String, required: true, enum: RETURN_CONDITIONS },
    serialNumber: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const partReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true, trim: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },

    // One return always belongs to exactly one issue slip.
    storeIssue: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIssue', required: true, index: true },
    issueNumber: { type: String, required: true, trim: true },
    machineNumber: { type: String, trim: true, default: '' },
    machineType: { type: String, trim: true, default: '' },
    serviceOrderNumber: { type: String, trim: true, default: '' },

    items: {
      type: [partReturnItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one returned part is required',
      },
    },

    reason: { type: String, required: true, trim: true },

    returnedByName: { type: String, required: true, trim: true },
    returnedByZNumber: { type: String, trim: true, default: '' },

    // Auto-filled server-side from the logged-in Storeman, not client-supplied.
    receivedByName: { type: String, trim: true, default: '' },
    receivedByZNumber: { type: String, trim: true, default: '' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    returnDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

const PartReturn = mongoose.model('PartReturn', partReturnSchema);

module.exports = { PartReturn, RETURN_CONDITIONS };

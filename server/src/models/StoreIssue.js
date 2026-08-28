const mongoose = require('mongoose');

const storeIssueItemSchema = new mongoose.Schema(
  {
    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', required: true },
    partNumber: { type: String, required: true, trim: true },
    partDescription: { type: String, required: true, trim: true },
    componentPartNumber: { type: String, trim: true, default: '' },
    componentDescription: { type: String, trim: true, default: '' },
    functionalSystem: { type: String, trim: true, default: '' },
    subSystem: { type: String, trim: true, default: '' },
    serialNumber: { type: String, trim: true, default: '' },

    quantityRequested: { type: Number, required: true, min: 0 },
    quantityIssued: { type: Number, required: true, min: 0, default: 0 },
    quantityToOrder: { type: Number, required: true, min: 0, default: 0 },
    quantityReturned: { type: Number, required: true, min: 0, default: 0 },

    status: {
      type: String,
      required: true,
      enum: ['Issued', 'Partially Issued', 'Awaiting Order', 'Returned'],
      default: 'Awaiting Order',
    },
  },
  { timestamps: true }
);

const laborEntrySchema = new mongoose.Schema(
  {
    clockNumber: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    surname: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' },
    totalHours: { type: Number, default: null },
  },
  { _id: false }
);

const storeIssueSchema = new mongoose.Schema(
  {
    issueNumber: { type: String, required: true, unique: true, trim: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },

    machineNumber: { type: String, trim: true, default: '' },
    machineType: { type: String, trim: true, default: '' },
    serviceOrderNumber: { type: String, trim: true, default: '' },
    workOrderNumber: { type: String, trim: true, default: '' },
    riskAssessmentNumber: { type: String, trim: true, default: '' },

    location: { type: String, trim: true, default: '' },
    section: { type: String, trim: true, default: '' },
    workplace: { type: String, trim: true, default: '' },
    responsibleForeman: { type: String, trim: true, default: '' },

    // Maintenance executed (Technical)
    dateStarted: { type: Date, default: null },
    dateCompleted: { type: Date, default: null },
    timeStarted: { type: String, trim: true, default: '' },
    timeCompleted: { type: String, trim: true, default: '' },

    // Hour meter readings (Technical)
    engineHours: { type: Number, default: null },
    powerPackHours: { type: Number, default: null },
    percussionHours: { type: Number, default: null },
    extraHours: { type: Number, default: null },

    // Nature of downtime (Technical)
    natureOfDowntime: {
      damage: { type: Boolean, default: false },
      breakdown: { type: Boolean, default: false },
      warranty: { type: Boolean, default: false },
      inspection: { type: Boolean, default: false },
    },
    possibleCausesOfFailure: { type: String, trim: true, default: '' },
    workPerformed: { type: String, trim: true, default: '' },

    // Component / equipment information (single block, as on the paper form)
    subSystem: { type: String, trim: true, default: '' },
    functionalSystem: { type: String, trim: true, default: '' },
    componentDescription: { type: String, trim: true, default: '' },
    componentPartNumber: { type: String, trim: true, default: '' },
    serialNumberIssued: { type: String, trim: true, default: '' },
    serialNumberReturned: { type: String, trim: true, default: '' },

    items: {
      type: [storeIssueItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one part line is required',
      },
    },

    // Labour (Technical - artisans who performed the work)
    laborEntries: { type: [laborEntrySchema], default: [] },

    requestorName: { type: String, required: true, trim: true },
    requestorSurname: { type: String, required: true, trim: true },
    requestorClockNumber: { type: String, trim: true, default: '' },
    requestorContactNumber: { type: String, trim: true, default: '' },

    justification: { type: String, trim: true, default: '' },

    foremanName: { type: String, trim: true, default: '' },
    foremanSurname: { type: String, trim: true, default: '' },
    foremanSignature: { type: String, default: '' },

    storemanName: { type: String, trim: true, default: '' },
    storemanSurname: { type: String, trim: true, default: '' },
    storemanSignature: { type: String, default: '' },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    issueDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: ['Issued', 'Partially Issued', 'Awaiting Order', 'Returned', 'Closed'],
      default: 'Awaiting Order',
    },
  },
  { timestamps: true }
);

const StoreIssue = mongoose.model('StoreIssue', storeIssueSchema);

module.exports = { StoreIssue };

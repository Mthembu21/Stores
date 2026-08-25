const mongoose = require('mongoose');

const storeIssueSchema = new mongoose.Schema(
  {
    issueNumber: { type: String, required: true, unique: true, trim: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },

    machineNumber: { type: String, trim: true, default: '' },
    machineType: { type: String, trim: true, default: '' },
    serviceOrderNumber: { type: String, trim: true, default: '' },
    workOrderNumber: { type: String, trim: true, default: '' },

    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', required: true },
    partNumber: { type: String, required: true, trim: true },
    partDescription: { type: String, required: true, trim: true },
    componentPartNumber: { type: String, trim: true, default: '' },
    componentDescription: { type: String, trim: true, default: '' },
    functionalSystem: { type: String, trim: true, default: '' },
    subSystem: { type: String, trim: true, default: '' },
    serialNumber: { type: String, trim: true, default: '' },

    requestorName: { type: String, required: true, trim: true },
    requestorSurname: { type: String, required: true, trim: true },
    requestorEmployeeNumber: { type: String, trim: true, default: '' },
    requestorContactNumber: { type: String, trim: true, default: '' },

    quantityRequested: { type: Number, required: true, min: 0 },
    quantityIssued: { type: Number, required: true, min: 0, default: 0 },
    quantityToOrder: { type: Number, required: true, min: 0, default: 0 },
    quantityReturned: { type: Number, required: true, min: 0, default: 0 },

    foremanName: { type: String, trim: true, default: '' },
    foremanSurname: { type: String, trim: true, default: '' },
    foremanSignature: { type: String, default: '' },
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

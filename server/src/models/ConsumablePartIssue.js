const mongoose = require('mongoose');

const consumablePartIssueSchema = new mongoose.Schema(
  {
    issueNumber: { type: String, required: true, unique: true, trim: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },

    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', required: true },
    partNumber: { type: String, required: true, trim: true },
    partDescription: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },

    personName: { type: String, required: true, trim: true },
    zNumber: { type: String, required: true, trim: true },
    foremanName: { type: String, required: true, trim: true },

    issueDate: { type: Date, required: true, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const ConsumablePartIssue = mongoose.model('ConsumablePartIssue', consumablePartIssueSchema);

module.exports = { ConsumablePartIssue };

const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema(
  {
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobNumber: { type: String, trim: true, default: '' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    borrowedAt: { type: Date, required: true, default: Date.now },
    expectedReturnAt: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    returnCondition: {
      type: String,
      enum: ['Good', 'Fair', 'Damaged', 'Missing'],
      default: null,
    },
  },
  { timestamps: true }
);

borrowRecordSchema.virtual('isOverdue').get(function isOverdue() {
  if (this.returnedAt) return false;
  if (!this.expectedReturnAt) return false;
  return Date.now() > new Date(this.expectedReturnAt).getTime();
});

borrowRecordSchema.set('toJSON', { virtuals: true });
borrowRecordSchema.set('toObject', { virtuals: true });

const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);

module.exports = { BorrowRecord };

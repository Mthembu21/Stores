const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    movementId: { type: String, required: true, unique: true, trim: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', required: true },
    partNumber: { type: String, required: true, trim: true },
    movementType: {
      type: String,
      required: true,
      enum: ['Issue', 'Return', 'Receipt', 'Adjustment'],
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    storeIssue: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIssue', default: null },
    serviceOrderNumber: { type: String, trim: true, default: '' },
    workOrderNumber: { type: String, trim: true, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

module.exports = { StockMovement };

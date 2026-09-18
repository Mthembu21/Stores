const mongoose = require('mongoose');

// A reference catalog of items the ERP knows about but that aren't normally kept in
// stock — most have 0 quantity and are only ordered on demand. Kept entirely separate
// from SparePart: the daily "replace inventory" import wipes and rebuilds every
// Returnable SparePart from scratch, and this catalog must survive that untouched.
const nonStockItemSchema = new mongoose.Schema(
  {
    partNumber: { type: String, required: true, unique: true, trim: true },
    partDescription: { type: String, required: true, trim: true },
    supplier: { type: String, trim: true, default: '' },
    leadTimeDays: { type: Number, default: null },
    unitCost: { type: Number, default: null },
    storageLocation: { type: String, trim: true, default: '' },
    pickClass: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const NonStockItem = mongoose.model('NonStockItem', nonStockItemSchema);

module.exports = { NonStockItem };

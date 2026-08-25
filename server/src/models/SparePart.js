const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema(
  {
    partNumber: { type: String, required: true, unique: true, trim: true },
    partDescription: { type: String, required: true, trim: true },
    componentPartNumber: { type: String, trim: true, default: '' },
    componentDescription: { type: String, trim: true, default: '' },
    functionalSystem: { type: String, trim: true, default: '' },
    subSystem: { type: String, trim: true, default: '' },
    machineType: { type: String, trim: true, default: '' },
    serialNumber: { type: String, trim: true, default: '' },
    stockOnHand: { type: Number, required: true, min: 0, default: 0 },
    minimumStockLevel: { type: Number, required: true, min: 0, default: 0 },
    unitOfMeasure: { type: String, required: true, trim: true, default: 'EA' },
    storageLocation: { type: String, trim: true, default: '' },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Obsolete'],
      default: 'Active',
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  },
  { timestamps: true }
);

sparePartSchema.virtual('stockStatus').get(function stockStatus() {
  if (this.stockOnHand <= 0) return 'Out';
  if (this.stockOnHand <= this.minimumStockLevel) return 'Low';
  return 'OK';
});

sparePartSchema.set('toJSON', { virtuals: true });
sparePartSchema.set('toObject', { virtuals: true });

const SparePart = mongoose.model('SparePart', sparePartSchema);

module.exports = { SparePart };

const mongoose = require('mongoose');

const consumableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    unitOfMeasure: { type: String, required: true, trim: true, default: 'EA' },
    stockOnHand: { type: Number, required: true, min: 0, default: 0 },
    minimumStockLevel: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

consumableSchema.virtual('stockStatus').get(function stockStatus() {
  if (this.stockOnHand <= 0) return 'Out';
  if (this.stockOnHand <= this.minimumStockLevel) return 'Low';
  return 'OK';
});

consumableSchema.set('toJSON', { virtuals: true });
consumableSchema.set('toObject', { virtuals: true });

const Consumable = mongoose.model('Consumable', consumableSchema);

module.exports = { Consumable };

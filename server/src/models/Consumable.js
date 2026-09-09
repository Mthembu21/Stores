const mongoose = require('mongoose');

const consumableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    unitOfMeasure: { type: String, required: true, trim: true, default: 'EA' },
    stockOnHand: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

const Consumable = mongoose.model('Consumable', consumableSchema);

module.exports = { Consumable };

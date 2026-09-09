const mongoose = require('mongoose');

const consumableRecordSchema = new mongoose.Schema(
  {
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    consumable: { type: mongoose.Schema.Types.ObjectId, ref: 'Consumable', required: true },
    consumableName: { type: String, required: true, trim: true },
    unitOfMeasure: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    takenAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

const ConsumableRecord = mongoose.model('ConsumableRecord', consumableRecordSchema, 'ppeRecords');

module.exports = { ConsumableRecord };

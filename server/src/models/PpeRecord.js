const mongoose = require('mongoose');

const ppeRecordSchema = new mongoose.Schema(
  {
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ppeName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    takenAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

const PpeRecord = mongoose.model('PpeRecord', ppeRecordSchema);

module.exports = { PpeRecord };

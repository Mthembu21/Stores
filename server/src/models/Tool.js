const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema(
  {
    toolName: { type: String, required: true, trim: true },
    toolCode: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Hand Tools', 'Power Tools', 'Equipment'],
    },
    quantityTotal: { type: Number, required: true, min: 0 },
    quantityAvailable: { type: Number, required: true, min: 0 },
    lastReturnCondition: {
      type: String,
      enum: ['Good', 'Fair', 'Damaged', 'Missing'],
      default: null,
    },
    lastReturnedAt: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: ['Available', 'Borrowed', 'Under Repair'],
      default: 'Available',
    },
    flag: {
      type: String,
      required: true,
      enum: ['None', 'Damaged', 'Missing'],
      default: 'None',
    },
  },
  { timestamps: true }
);

const Tool = mongoose.model('Tool', toolSchema);

module.exports = { Tool };

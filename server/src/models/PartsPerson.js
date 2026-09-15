const mongoose = require('mongoose');

const partsPersonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    zNumber: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['Foreman', 'Storeman'],
    },
  },
  { timestamps: true }
);

const PartsPerson = mongoose.model('PartsPerson', partsPersonSchema);

module.exports = { PartsPerson };

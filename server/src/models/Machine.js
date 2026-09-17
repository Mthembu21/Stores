const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
  {
    machineNumber: { type: String, required: true, unique: true, trim: true },
    machineType: { type: String, required: true, trim: true },
    // Machines on contract don't need their issue slips sent out for signature.
    onContract: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Machine = mongoose.model('Machine', machineSchema);

module.exports = { Machine };

const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
  {
    machineNumber: { type: String, required: true, unique: true, trim: true },
    // Optional: some machine records are auto-created from historical store issues
    // that predate this directory, and may not carry a known type.
    machineType: { type: String, trim: true, default: '' },
    // Current service order for this machine; prefills the Issue Parts form when the
    // machine is selected, and can be edited from there.
    serviceOrderNumber: { type: String, trim: true, default: '' },
    // Machines on contract don't need their issue slips sent out for signature.
    onContract: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Machine = mongoose.model('Machine', machineSchema);

module.exports = { Machine };

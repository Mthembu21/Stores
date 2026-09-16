const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
  {
    machineNumber: { type: String, required: true, unique: true, trim: true },
    machineType: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Machine = mongoose.model('Machine', machineSchema);

module.exports = { Machine };

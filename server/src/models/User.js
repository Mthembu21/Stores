const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Roles } = require('../config/roles');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    employeeNumber: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: [Roles.Admin, Roles.Technician, Roles.Apprentice, Roles.Intern],
    },
    department: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.methods.verifyPassword = async function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    fullName: this.fullName,
    employeeNumber: this.employeeNumber,
    role: this.role,
    department: this.department,
    contactNumber: this.contactNumber,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = { User };

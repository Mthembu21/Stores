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
      enum: [
        Roles.Admin,
        Roles.Technician,
        Roles.Apprentice,
        Roles.Intern,
        Roles.ToolsStoreman,
        Roles.PartsStoreman,
        Roles.Supervisor,
      ],
    },
    department: { type: String, trim: true, default: '' },
    contactNumber: { type: String, trim: true, default: '' },
    zNumber: { type: String, trim: true, default: '' },
    // When non-empty, this user's access is restricted to exactly these page keys,
    // overriding the normal role-based page set. Empty means "use role defaults".
    allowedPages: { type: [String], default: [] },
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
    zNumber: this.zNumber,
    allowedPages: this.allowedPages,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = { User };

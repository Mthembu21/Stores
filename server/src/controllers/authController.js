const bcrypt = require('bcryptjs');
const { ApiError } = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const { User } = require('../models/User');
const { Roles } = require('../config/roles');

async function login(req, res) {
  const { employeeNumber, password } = req.body;

  if (!employeeNumber || !password) {
    throw new ApiError(400, 'Employee Number and password are required');
  }

  const user = await User.findOne({ employeeNumber: String(employeeNumber).trim() });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const ok = await user.verifyPassword(password);
  if (!ok) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = signToken({ sub: user._id.toString(), role: user.role });
  res.json({ token, user: user.toSafeJSON() });
}

async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

async function bootstrapAdmin(req, res) {
  const key = req.headers['x-bootstrap-key'];
  if (!process.env.BOOTSTRAP_KEY || key !== process.env.BOOTSTRAP_KEY) {
    throw new ApiError(403, 'Forbidden');
  }

  const { fullName, employeeNumber, department, contactNumber, password } = req.body;
  if (!fullName || !employeeNumber || !department || !contactNumber || !password) {
    throw new ApiError(400, 'Missing required fields');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const normalizedEmployeeNumber = String(employeeNumber).trim();
  const exists = await User.findOne({ employeeNumber: normalizedEmployeeNumber });
  if (exists) {
    exists.fullName = fullName;
    exists.department = department;
    exists.contactNumber = contactNumber;
    exists.role = Roles.Admin;
    exists.passwordHash = passwordHash;
    await exists.save();
    return res.json({ user: exists.toSafeJSON() });
  }

  const user = await User.create({
    fullName,
    employeeNumber: normalizedEmployeeNumber,
    role: Roles.Admin,
    department,
    contactNumber,
    passwordHash,
  });

  return res.status(201).json({ user: user.toSafeJSON() });
}

module.exports = { login, me, bootstrapAdmin };

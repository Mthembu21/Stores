const bcrypt = require('bcryptjs');
const { ApiError } = require('../utils/ApiError');
const { User } = require('../models/User');
const { Roles } = require('../config/roles');

async function listUsers(req, res) {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
}

async function createUser(req, res) {
  const { fullName, employeeNumber, role, department, contactNumber, password } = req.body;

  if (!fullName || !employeeNumber || !role || !department || !contactNumber || !password) {
    throw new ApiError(400, 'Missing required fields');
  }

  if (![Roles.Technician, Roles.Apprentice, Roles.Intern, Roles.Admin].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const exists = await User.findOne({ employeeNumber: String(employeeNumber).trim() });
  if (exists) {
    throw new ApiError(409, 'Employee Number already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    employeeNumber: String(employeeNumber).trim(),
    role,
    department,
    contactNumber,
    passwordHash,
  });

  res.status(201).json({ user: user.toSafeJSON() });
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { fullName, role, department, contactNumber } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (role && ![Roles.Technician, Roles.Apprentice, Roles.Intern, Roles.Admin].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (role !== undefined) user.role = role;
  if (department !== undefined) user.department = department;
  if (contactNumber !== undefined) user.contactNumber = contactNumber;

  await user.save();
  res.json({ user: user.toSafeJSON() });
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await user.deleteOne();
  res.json({ ok: true });
}

module.exports = { listUsers, createUser, updateUser, deleteUser };

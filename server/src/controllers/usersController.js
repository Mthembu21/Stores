const bcrypt = require('bcryptjs');
const { ApiError } = require('../utils/ApiError');
const { User } = require('../models/User');
const { Roles } = require('../config/roles');
const { PARTS_PAGE_KEYS } = require('../config/partsPages');

const ASSIGNABLE_ROLES = [
  Roles.Technician,
  Roles.Apprentice,
  Roles.Intern,
  Roles.Admin,
  Roles.ToolsStoreman,
  Roles.PartsStoreman,
  Roles.Supervisor,
];

async function listUsers(req, res) {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
}

function validateAllowedPages(allowedPages) {
  if (allowedPages === undefined) return undefined;
  if (!Array.isArray(allowedPages)) {
    throw new ApiError(400, 'allowedPages must be a list');
  }
  const cleaned = allowedPages.map((p) => String(p).trim()).filter(Boolean);
  const invalid = cleaned.filter((p) => !PARTS_PAGE_KEYS.includes(p));
  if (invalid.length > 0) {
    throw new ApiError(400, `Invalid page key(s): ${invalid.join(', ')}`);
  }
  return cleaned;
}

async function createUser(req, res) {
  const { fullName, employeeNumber, role, department, contactNumber, zNumber, allowedPages, password } = req.body;

  if (!fullName || !employeeNumber || !role || !password) {
    throw new ApiError(400, 'Missing required fields');
  }

  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const cleanedAllowedPages = validateAllowedPages(allowedPages);

  const exists = await User.findOne({ employeeNumber: String(employeeNumber).trim() });
  if (exists) {
    throw new ApiError(409, 'Employee Number already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    employeeNumber: String(employeeNumber).trim(),
    role,
    department: department || '',
    contactNumber: contactNumber || '',
    zNumber: zNumber || '',
    allowedPages: cleanedAllowedPages || [],
    passwordHash,
  });

  res.status(201).json({ user: user.toSafeJSON() });
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { fullName, role, department, contactNumber, zNumber, allowedPages } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (role && !ASSIGNABLE_ROLES.includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const cleanedAllowedPages = validateAllowedPages(allowedPages);

  if (fullName !== undefined) user.fullName = fullName;
  if (role !== undefined) user.role = role;
  if (department !== undefined) user.department = department;
  if (contactNumber !== undefined) user.contactNumber = contactNumber;
  if (zNumber !== undefined) user.zNumber = zNumber;
  if (cleanedAllowedPages !== undefined) user.allowedPages = cleanedAllowedPages;

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

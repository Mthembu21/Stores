const { ApiError } = require('../utils/ApiError');
const { PartsPerson } = require('../models/PartsPerson');

async function listPartsPeople(req, res) {
  const { role } = req.query;
  const filter = {};
  if (role) filter.role = role;
  const people = await PartsPerson.find(filter).sort({ name: 1 });
  res.json({ people });
}

async function createPartsPerson(req, res) {
  const { name, zNumber, role } = req.body;

  if (!name || !zNumber || !role) {
    throw new ApiError(400, 'Missing required fields');
  }
  if (!['Foreman', 'Storeman', 'Requestor'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const finalZNumber = String(zNumber).trim();
  const existing = await PartsPerson.findOne({ zNumber: finalZNumber });
  if (existing) {
    throw new ApiError(409, 'A person with that Z Number already exists');
  }

  const person = await PartsPerson.create({
    name: String(name).trim(),
    zNumber: finalZNumber,
    role,
  });

  res.status(201).json({ person });
}

async function updatePartsPerson(req, res) {
  const { id } = req.params;
  const { name, zNumber } = req.body;

  const person = await PartsPerson.findById(id);
  if (!person) {
    throw new ApiError(404, 'Person not found');
  }

  if (name !== undefined) {
    if (!String(name).trim()) {
      throw new ApiError(400, 'Name cannot be empty');
    }
    person.name = String(name).trim();
  }

  if (zNumber !== undefined) {
    const finalZNumber = String(zNumber).trim();
    if (!finalZNumber) {
      throw new ApiError(400, 'Z Number cannot be empty');
    }
    const existing = await PartsPerson.findOne({ zNumber: finalZNumber, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(409, 'A person with that Z Number already exists');
    }
    person.zNumber = finalZNumber;
  }

  await person.save();
  res.json({ person });
}

async function deletePartsPerson(req, res) {
  const { id } = req.params;
  const person = await PartsPerson.findById(id);
  if (!person) {
    throw new ApiError(404, 'Person not found');
  }
  await person.deleteOne();
  res.json({ ok: true });
}

module.exports = { listPartsPeople, createPartsPerson, updatePartsPerson, deletePartsPerson };

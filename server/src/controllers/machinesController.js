const { ApiError } = require('../utils/ApiError');
const { Machine } = require('../models/Machine');

async function listMachines(req, res) {
  const machines = await Machine.find({}).sort({ machineNumber: 1 });
  res.json({ machines });
}

async function createMachine(req, res) {
  const { machineNumber, machineType, onContract } = req.body;

  if (!machineNumber) {
    throw new ApiError(400, 'Missing required fields');
  }

  const finalMachineNumber = String(machineNumber).trim();
  const existing = await Machine.findOne({ machineNumber: finalMachineNumber });
  if (existing) {
    throw new ApiError(409, 'A machine with that number already exists');
  }

  const machine = await Machine.create({
    machineNumber: finalMachineNumber,
    machineType: machineType ? String(machineType).trim() : '',
    onContract: Boolean(onContract),
  });

  res.status(201).json({ machine });
}

async function updateMachine(req, res) {
  const { id } = req.params;
  const { onContract } = req.body;

  const machine = await Machine.findById(id);
  if (!machine) {
    throw new ApiError(404, 'Machine not found');
  }

  if (onContract !== undefined) {
    machine.onContract = Boolean(onContract);
  }

  await machine.save();
  res.json({ machine });
}

async function deleteMachine(req, res) {
  const { id } = req.params;
  const machine = await Machine.findById(id);
  if (!machine) {
    throw new ApiError(404, 'Machine not found');
  }
  await machine.deleteOne();
  res.json({ ok: true });
}

module.exports = { listMachines, createMachine, updateMachine, deleteMachine };

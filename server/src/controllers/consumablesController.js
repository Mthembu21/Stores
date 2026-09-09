const { ApiError } = require('../utils/ApiError');
const { Consumable } = require('../models/Consumable');
const { ConsumableRecord } = require('../models/ConsumableRecord');
const { User } = require('../models/User');

function monthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}

async function listConsumableItems(req, res) {
  const items = await Consumable.find({}).sort({ name: 1 });
  res.json({ items });
}

async function createConsumableItem(req, res) {
  const { name, unitOfMeasure, stockOnHand } = req.body;

  if (!name || !unitOfMeasure) {
    throw new ApiError(400, 'Missing required fields');
  }

  const qty = stockOnHand === undefined || stockOnHand === '' ? 0 : Number(stockOnHand);
  if (Number.isNaN(qty) || qty < 0) {
    throw new ApiError(400, 'Invalid quantity');
  }

  const existing = await Consumable.findOne({ name: name.trim() });
  if (existing) {
    throw new ApiError(409, 'A consumable with that name already exists');
  }

  const item = await Consumable.create({
    name: name.trim(),
    unitOfMeasure: unitOfMeasure.trim(),
    stockOnHand: qty,
  });
  res.status(201).json({ item });
}

async function updateConsumableItem(req, res) {
  const { id } = req.params;
  const { name, unitOfMeasure } = req.body;

  const item = await Consumable.findById(id);
  if (!item) {
    throw new ApiError(404, 'Consumable not found');
  }

  if (name !== undefined) item.name = name.trim();
  if (unitOfMeasure !== undefined) item.unitOfMeasure = unitOfMeasure.trim();

  await item.save();
  res.json({ item });
}

async function restockConsumableItem(req, res) {
  const { id } = req.params;
  const { quantity } = req.body;

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    throw new ApiError(400, 'Invalid quantity');
  }

  const item = await Consumable.findById(id);
  if (!item) {
    throw new ApiError(404, 'Consumable not found');
  }

  item.stockOnHand += qty;
  await item.save();
  res.json({ item });
}

async function deleteConsumableItem(req, res) {
  const { id } = req.params;
  const item = await Consumable.findByIdAndDelete(id);
  if (!item) {
    throw new ApiError(404, 'Consumable not found');
  }
  res.json({ ok: true });
}

async function takeConsumable(req, res) {
  const { technicianId, consumableId, quantity, takenAt } = req.body;

  if (!technicianId || !consumableId || !quantity) {
    throw new ApiError(400, 'Missing required fields');
  }

  const tech = await User.findById(technicianId);
  if (!tech) {
    throw new ApiError(404, 'Technician not found');
  }

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    throw new ApiError(400, 'Invalid quantity');
  }

  const item = await Consumable.findById(consumableId);
  if (!item) {
    throw new ApiError(404, 'Consumable not found');
  }

  if (item.stockOnHand < qty) {
    throw new ApiError(400, `Insufficient stock: only ${item.stockOnHand} ${item.unitOfMeasure} available`);
  }

  item.stockOnHand -= qty;
  await item.save();

  const rec = await ConsumableRecord.create({
    technician: tech._id,
    consumable: item._id,
    consumableName: item.name,
    unitOfMeasure: item.unitOfMeasure,
    quantity: qty,
    takenAt: takenAt ? new Date(takenAt) : new Date(),
  });

  const populated = await ConsumableRecord.findById(rec._id).populate('technician');
  res.status(201).json({ record: populated, item });
}

async function listConsumables(req, res) {
  const records = await ConsumableRecord.find({})
    .sort({ takenAt: -1 })
    .limit(500)
    .populate('technician');
  res.json({ records });
}

async function consumablesMonthlySummary(req, res) {
  const year = Number(req.query.year);
  const month = Number(req.query.month);

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    throw new ApiError(400, 'year and month query params are required');
  }

  const { start, end } = monthRange(year, month);

  const rows = await ConsumableRecord.aggregate([
    { $match: { takenAt: { $gte: start, $lt: end } } },
    { $group: { _id: '$technician', total: { $sum: '$quantity' } } },
    { $sort: { total: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'technician',
      },
    },
    { $unwind: '$technician' },
    {
      $project: {
        technicianId: '$_id',
        total: 1,
        fullName: '$technician.fullName',
        employeeNumber: '$technician.employeeNumber',
        role: '$technician.role',
      },
    },
  ]);

  const totalThisMonth = rows.reduce((acc, r) => acc + (r.total || 0), 0);

  res.json({ year, month, totalThisMonth, perTechnician: rows });
}

module.exports = {
  listConsumableItems,
  createConsumableItem,
  updateConsumableItem,
  restockConsumableItem,
  deleteConsumableItem,
  takeConsumable,
  listConsumables,
  consumablesMonthlySummary,
};

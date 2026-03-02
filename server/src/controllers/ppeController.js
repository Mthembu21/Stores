const { ApiError } = require('../utils/ApiError');
const { PpeRecord } = require('../models/PpeRecord');
const { User } = require('../models/User');

function monthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}

async function takePpe(req, res) {
  const { technicianId, ppeName, quantity, takenAt } = req.body;

  if (!technicianId || !ppeName || !quantity) {
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

  const rec = await PpeRecord.create({
    technician: tech._id,
    ppeName,
    quantity: qty,
    takenAt: takenAt ? new Date(takenAt) : new Date(),
  });

  const populated = await PpeRecord.findById(rec._id).populate('technician');
  res.status(201).json({ record: populated });
}

async function listPpe(req, res) {
  const records = await PpeRecord.find({})
    .sort({ takenAt: -1 })
    .limit(500)
    .populate('technician');
  res.json({ records });
}

async function ppeMonthlySummary(req, res) {
  const year = Number(req.query.year);
  const month = Number(req.query.month);

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    throw new ApiError(400, 'year and month query params are required');
  }

  const { start, end } = monthRange(year, month);

  const rows = await PpeRecord.aggregate([
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

module.exports = { takePpe, listPpe, ppeMonthlySummary };

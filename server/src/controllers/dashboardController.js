const { Tool } = require('../models/Tool');
const { BorrowRecord } = require('../models/BorrowRecord');
const { ConsumableRecord } = require('../models/ConsumableRecord');

const DAY_MS = 24 * 60 * 60 * 1000;

function utcMonthRange(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
  return { start, end, year, month: month + 1 };
}

function addUtcMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 0, 0, 0));
}

async function getDashboard(req, res) {
  const now = new Date();
  const { start, end, year, month } = utcMonthRange(now);

  const trendStart = addUtcMonths(now, -5);
  const trendEnd = addUtcMonths(now, 1);
  const dueSoonEnd = new Date(now.getTime() + 30 * DAY_MS);

  const [
    totalNormalTools,
    totalSpecialTools,
    specialToolsDueSoon,
    borrowedTools,
    damagedTools,
    missingTools,
    openBorrowings,
    recentBorrowings,
    consumablesAgg,
    borrowTrendAgg,
  ] = await Promise.all([
    Tool.countDocuments({ isSpecialTool: false }),
    Tool.countDocuments({ isSpecialTool: true }),
    Tool.countDocuments({
      isSpecialTool: true,
      $or: [
        { nextCalibrationDueAt: { $gte: now, $lte: dueSoonEnd } },
        { nextInspectionDueAt: { $gte: now, $lte: dueSoonEnd } },
      ],
    }),
    BorrowRecord.countDocuments({ returnedAt: null }),
    Tool.countDocuments({ flag: 'Damaged' }),
    Tool.countDocuments({ flag: 'Missing' }),
    BorrowRecord.find({ returnedAt: null }).populate('tool').populate('borrower'),
    BorrowRecord.find({}).sort({ borrowedAt: -1 }).limit(10).populate('tool').populate('borrower'),
    ConsumableRecord.aggregate([
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
        },
      },
    ]),
    BorrowRecord.aggregate([
      { $match: { borrowedAt: { $gte: trendStart, $lt: trendEnd } } },
      {
        $group: {
          _id: {
            year: { $year: '$borrowedAt' },
            month: { $month: '$borrowedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
        },
      },
    ]),
  ]);

  const overdue = openBorrowings.filter((r) => r.isOverdue);

  const consumablesThisMonth = consumablesAgg.reduce((acc, r) => acc + (r.total || 0), 0);

  res.json({
    cards: {
      totalNormalTools,
      totalSpecialTools,
      specialToolsDueSoon,
      borrowedTools,
      overdueTools: overdue.length,
      damagedTools,
      missingTools,
      consumablesTakenThisMonth: consumablesThisMonth,
    },
    tables: {
      overdueTools: overdue.slice(0, 10),
      damagedTools: await Tool.find({ flag: 'Damaged' }).sort({ updatedAt: -1 }).limit(10),
      missingTools: await Tool.find({ flag: 'Missing' }).sort({ updatedAt: -1 }).limit(10),
      recentBorrowings,
    },
    charts: {
      consumablesUsagePerTechnician: consumablesAgg,
      monthlyBorrowingTrends: borrowTrendAgg,
    },
    meta: {
      month,
      year,
    },
  });
}

module.exports = { getDashboard };

const { SparePart } = require('../models/SparePart');
const { StoreIssue } = require('../models/StoreIssue');
const { StockMovement } = require('../models/StockMovement');

function utcDayRange(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function utcMonthRange(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
  return { start, end };
}

async function getPartsDashboard(req, res) {
  const now = new Date();
  const { start: dayStart, end: dayEnd } = utcDayRange(now);
  const { start: monthStart, end: monthEnd } = utcMonthRange(now);

  const [
    totalParts,
    activeParts,
    lowStockParts,
    outOfStockParts,
    issuedTodayAgg,
    issuedThisMonthAgg,
    partsAwaitingOrder,
    partsReturnedAgg,
    lowStockTable,
    recentIssues,
  ] = await Promise.all([
    SparePart.countDocuments({}),
    SparePart.countDocuments({ status: 'Active' }),
    SparePart.countDocuments({
      $expr: { $and: [{ $lte: ['$stockOnHand', '$minimumStockLevel'] }, { $gt: ['$stockOnHand', 0] }] },
    }),
    SparePart.countDocuments({ stockOnHand: { $lte: 0 } }),
    StockMovement.aggregate([
      { $match: { movementType: 'Issue', createdAt: { $gte: dayStart, $lt: dayEnd } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]),
    StockMovement.aggregate([
      { $match: { movementType: 'Issue', createdAt: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]),
    StoreIssue.countDocuments({ quantityToOrder: { $gt: 0 }, status: { $ne: 'Closed' } }),
    StockMovement.aggregate([
      { $match: { movementType: 'Return' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]),
    SparePart.find({
      $expr: { $lte: ['$stockOnHand', '$minimumStockLevel'] },
    })
      .sort({ stockOnHand: 1 })
      .limit(10),
    StoreIssue.find({})
      .sort({ issueDate: -1 })
      .limit(10)
      .populate('sparePart')
      .populate('issuedBy'),
  ]);

  res.json({
    cards: {
      totalParts,
      activeParts,
      lowStockParts,
      outOfStockParts,
      partsIssuedToday: issuedTodayAgg[0]?.total || 0,
      partsIssuedThisMonth: issuedThisMonthAgg[0]?.total || 0,
      partsAwaitingOrder,
      partsReturned: partsReturnedAgg[0]?.total || 0,
    },
    tables: {
      lowStockParts: lowStockTable,
      recentIssues,
    },
  });
}

module.exports = { getPartsDashboard };

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

function lowStockFilter(partType) {
  return {
    partType,
    $expr: { $and: [{ $lte: ['$stockOnHand', '$minimumStockLevel'] }, { $gt: ['$stockOnHand', 0] }] },
  };
}

// Consumables are issued all-or-nothing (no partial "quantity to order" per
// transaction like returnable parts get), so "awaiting order" for a consumable
// means its stock has dropped to or below its reorder point, full stop.
function needsReorderFilter(partType) {
  return {
    partType,
    $expr: { $lte: ['$stockOnHand', '$minimumStockLevel'] },
  };
}

// Store Issue (returnable parts) always stamps its movements with a storeIssue id;
// Consumable issues never do — that split is what separates "Parts" from
// "Consumables" in the Issued Today / This Month aggregates below.
function issuedAgg(range, isPart) {
  return StockMovement.aggregate([
    {
      $match: {
        movementType: 'Issue',
        storeIssue: isPart ? { $ne: null } : null,
        createdAt: { $gte: range.start, $lt: range.end },
      },
    },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
}

async function getPartsDashboard(req, res) {
  const now = new Date();
  const dayRange = utcDayRange(now);
  const monthRange = utcMonthRange(now);

  const [
    totalParts,
    totalConsumables,
    activeParts,
    activeConsumables,
    lowStockParts,
    lowStockConsumables,
    outOfStockParts,
    outOfStockConsumables,
    partsIssuedTodayAgg,
    consumablesIssuedTodayAgg,
    partsIssuedThisMonthAgg,
    consumablesIssuedThisMonthAgg,
    partsAwaitingOrder,
    consumablesAwaitingOrder,
    partsReturnedAgg,
    lowStockTable,
    recentIssues,
  ] = await Promise.all([
    SparePart.countDocuments({ partType: 'Returnable' }),
    SparePart.countDocuments({ partType: 'Consumable' }),
    SparePart.countDocuments({ partType: 'Returnable', status: 'Active' }),
    SparePart.countDocuments({ partType: 'Consumable', status: 'Active' }),
    SparePart.countDocuments(lowStockFilter('Returnable')),
    SparePart.countDocuments(lowStockFilter('Consumable')),
    SparePart.countDocuments({ partType: 'Returnable', stockOnHand: { $lte: 0 } }),
    SparePart.countDocuments({ partType: 'Consumable', stockOnHand: { $lte: 0 } }),
    issuedAgg(dayRange, true),
    issuedAgg(dayRange, false),
    issuedAgg(monthRange, true),
    issuedAgg(monthRange, false),
    StoreIssue.countDocuments({ 'items.quantityToOrder': { $gt: 0 }, status: { $ne: 'Closed' } }),
    SparePart.countDocuments(needsReorderFilter('Consumable')),
    StockMovement.aggregate([
      { $match: { movementType: 'Return' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]),
    SparePart.find({
      partType: 'Returnable',
      $expr: { $lte: ['$stockOnHand', '$minimumStockLevel'] },
    })
      .sort({ stockOnHand: 1 })
      .limit(10),
    StoreIssue.find({})
      .sort({ issueDate: -1 })
      .limit(10)
      .populate('items.sparePart')
      .populate('issuedBy'),
  ]);

  res.json({
    cards: {
      totalParts,
      totalConsumables,
      activeParts,
      activeConsumables,
      lowStockParts,
      lowStockConsumables,
      outOfStockParts,
      outOfStockConsumables,
      partsIssuedToday: partsIssuedTodayAgg[0]?.total || 0,
      consumablesIssuedToday: consumablesIssuedTodayAgg[0]?.total || 0,
      partsIssuedThisMonth: partsIssuedThisMonthAgg[0]?.total || 0,
      consumablesIssuedThisMonth: consumablesIssuedThisMonthAgg[0]?.total || 0,
      partsAwaitingOrder,
      consumablesAwaitingOrder,
      partsReturned: partsReturnedAgg[0]?.total || 0,
    },
    tables: {
      lowStockParts: lowStockTable,
      recentIssues,
    },
  });
}

module.exports = { getPartsDashboard };

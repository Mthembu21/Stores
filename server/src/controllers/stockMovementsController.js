const { StockMovement } = require('../models/StockMovement');

async function listStockMovements(req, res) {
  const { sparePartId, movementType } = req.query;
  const filter = {};
  if (sparePartId) filter.sparePart = sparePartId;
  if (movementType) filter.movementType = movementType;

  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .limit(300)
    .populate('sparePart')
    .populate('user')
    .populate('storeIssue');

  res.json({ movements });
}

module.exports = { listStockMovements };

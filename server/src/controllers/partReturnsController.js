const { ApiError } = require('../utils/ApiError');
const { StoreIssue } = require('../models/StoreIssue');
const { SparePart } = require('../models/SparePart');
const { StockMovement } = require('../models/StockMovement');
const { getNextSequence } = require('../utils/sequence');
const { getDefaultStoreId } = require('../utils/defaultStore');

async function createPartReturn(req, res) {
  const { storeIssueId, quantity, reason } = req.body;

  if (!storeIssueId || !quantity) {
    throw new ApiError(400, 'Missing required fields');
  }

  const returnQty = Number(quantity);
  if (!(returnQty > 0)) {
    throw new ApiError(400, 'Return quantity must be greater than 0');
  }

  const issue = await StoreIssue.findById(storeIssueId);
  if (!issue) {
    throw new ApiError(404, 'Store issue not found');
  }

  const outstanding = issue.quantityIssued - issue.quantityReturned;
  if (returnQty > outstanding) {
    throw new ApiError(400, `Cannot return more than the outstanding quantity (${outstanding})`);
  }

  const part = await SparePart.findById(issue.sparePart);
  if (!part) {
    throw new ApiError(404, 'Spare part not found');
  }

  const previousStock = part.stockOnHand;
  part.stockOnHand += returnQty;
  await part.save();

  issue.quantityReturned += returnQty;
  if (issue.quantityReturned >= issue.quantityIssued) {
    issue.status = 'Returned';
  }
  await issue.save();

  const store = await getDefaultStoreId();

  await StockMovement.create({
    movementId: await getNextSequence('stockMovementId', 'MV'),
    store,
    sparePart: part._id,
    partNumber: part.partNumber,
    movementType: 'Return',
    quantity: returnQty,
    previousStock,
    newStock: part.stockOnHand,
    storeIssue: issue._id,
    serviceOrderNumber: issue.serviceOrderNumber,
    workOrderNumber: issue.workOrderNumber,
    user: req.user._id,
    reason: reason || 'Part return',
  });

  const populated = await StoreIssue.findById(issue._id).populate('sparePart').populate('issuedBy');
  res.status(201).json({ issue: populated });
}

module.exports = { createPartReturn };

const { ApiError } = require('../utils/ApiError');
const { SparePart } = require('../models/SparePart');
const { ConsumablePartIssue } = require('../models/ConsumablePartIssue');
const { StockMovement } = require('../models/StockMovement');
const { getNextSequence } = require('../utils/sequence');
const { getDefaultStoreId } = require('../utils/defaultStore');

async function createConsumablePartIssue(req, res) {
  const { sparePartId, quantity, personName, zNumber, foremanName, issueDate } = req.body;

  if (!sparePartId || !quantity || !personName || !zNumber || !foremanName) {
    throw new ApiError(400, 'Missing required fields');
  }

  const part = await SparePart.findById(sparePartId);
  if (!part) {
    throw new ApiError(404, 'Consumable part not found');
  }
  if (part.partType !== 'Consumable') {
    throw new ApiError(400, 'Selected part is not a consumable');
  }

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    throw new ApiError(400, 'Invalid quantity');
  }
  if (qty > part.stockOnHand) {
    throw new ApiError(400, `Insufficient stock: only ${part.stockOnHand} available`);
  }

  const previousStock = part.stockOnHand;
  part.stockOnHand -= qty;
  await part.save();

  const store = await getDefaultStoreId();
  const issueNumber = await getNextSequence('consumablePartIssueNumber', 'CI');

  const issue = await ConsumablePartIssue.create({
    issueNumber,
    store,
    sparePart: part._id,
    partNumber: part.partNumber,
    partDescription: part.partDescription,
    quantity: qty,
    personName: String(personName).trim(),
    zNumber: String(zNumber).trim(),
    foremanName: String(foremanName).trim(),
    issueDate: issueDate ? new Date(issueDate) : new Date(),
    issuedBy: req.user?._id || null,
  });

  await StockMovement.create({
    movementId: await getNextSequence('stockMovementId', 'MV'),
    store,
    sparePart: part._id,
    partNumber: part.partNumber,
    movementType: 'Issue',
    quantity: qty,
    previousStock,
    newStock: part.stockOnHand,
    storeIssue: null,
    user: req.user?._id || null,
    reason: 'Consumable issue',
  });

  const populated = await ConsumablePartIssue.findById(issue._id)
    .populate('sparePart')
    .populate('issuedBy');
  res.status(201).json({ issue: populated });
}

async function listConsumablePartIssues(req, res) {
  const issues = await ConsumablePartIssue.find({})
    .sort({ issueDate: -1 })
    .limit(300)
    .populate('sparePart')
    .populate('issuedBy');
  res.json({ issues });
}

module.exports = { createConsumablePartIssue, listConsumablePartIssues };

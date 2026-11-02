const { ApiError } = require('../utils/ApiError');
const { StoreIssue } = require('../models/StoreIssue');
const { SparePart } = require('../models/SparePart');
const { StockMovement } = require('../models/StockMovement');
const { PartReturn, RETURN_CONDITIONS } = require('../models/PartReturn');
const { getNextSequence } = require('../utils/sequence');
const { getDefaultStoreId } = require('../utils/defaultStore');
const { deriveItemStatus, deriveOverallStatus } = require('../utils/storeIssueStatus');

// Records one return against one issue slip, covering one or more of its part lines.
// Everything is validated (including the PartReturn doc itself) before any stock or
// issue is touched, so a bad request can't leave stock half-updated.
async function createPartReturn(req, res) {
  const { storeIssueId, items: itemsInput, reason, returnedByName, returnedByZNumber } = req.body;

  if (!storeIssueId || !Array.isArray(itemsInput) || itemsInput.length === 0) {
    throw new ApiError(400, 'Select an issue slip and at least one part to return');
  }
  if (!reason || !String(reason).trim()) {
    throw new ApiError(400, 'Provide a reason for the return');
  }
  if (!returnedByName || !String(returnedByName).trim()) {
    throw new ApiError(400, 'Provide who is returning the parts');
  }

  const issue = await StoreIssue.findById(storeIssueId);
  if (!issue) {
    throw new ApiError(404, 'Store issue not found');
  }

  const seenItemIds = new Set();
  const partsById = new Map();
  const lines = [];

  for (const raw of itemsInput) {
    const { itemId, quantity, condition, serialNumber } = raw || {};

    const item = itemId ? issue.items.id(itemId) : null;
    if (!item) {
      throw new ApiError(404, 'Store issue part line not found');
    }
    if (seenItemIds.has(String(item._id))) {
      throw new ApiError(400, `${item.partNumber} is listed more than once`);
    }
    seenItemIds.add(String(item._id));

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new ApiError(400, `Return quantity must be a whole number above 0 for ${item.partNumber}`);
    }
    const outstanding = item.quantityIssued - item.quantityReturned;
    if (qty > outstanding) {
      throw new ApiError(400, `Cannot return more than the ${outstanding} still out for ${item.partNumber}`);
    }
    if (!RETURN_CONDITIONS.includes(condition)) {
      throw new ApiError(400, `Select the condition for ${item.partNumber}`);
    }

    // A full inventory replace re-creates every part with a new ID, so an older issue
    // can point at a part that no longer exists — fall back to the part number.
    let part = item.sparePart ? partsById.get(String(item.sparePart)) : null;
    if (!part) {
      part = (item.sparePart && (await SparePart.findById(item.sparePart))) || (await SparePart.findOne({ partNumber: item.partNumber }));
      if (!part) {
        throw new ApiError(404, `${item.partNumber} is no longer in the parts inventory, so it can't be returned to stock`);
      }
      // Reuse the same doc if two lines resolve to the same part, so neither update is lost.
      part = partsById.get(String(part._id)) || part;
      partsById.set(String(part._id), part);
      if (item.sparePart) partsById.set(String(item.sparePart), part);
    }

    lines.push({ item, part, qty, condition, serialNumber: serialNumber ? String(serialNumber).trim() : '' });
  }

  const store = await getDefaultStoreId();
  const partReturn = new PartReturn({
    returnNumber: 'pending',
    store,
    storeIssue: issue._id,
    issueNumber: issue.issueNumber,
    machineNumber: issue.machineNumber,
    machineType: issue.machineType,
    serviceOrderNumber: issue.serviceOrderNumber,
    items: lines.map((l) => ({
      storeIssueItem: l.item._id,
      sparePart: l.part._id,
      partNumber: l.item.partNumber,
      partDescription: l.item.partDescription,
      quantity: l.qty,
      condition: l.condition,
      serialNumber: l.serialNumber,
    })),
    reason: String(reason).trim(),
    returnedByName: String(returnedByName).trim(),
    returnedByZNumber: returnedByZNumber ? String(returnedByZNumber).trim() : '',
    // Storeman is whoever is logged in and receiving this — never client-supplied.
    receivedByName: req.user.fullName || '',
    receivedByZNumber: req.user.zNumber || req.user.employeeNumber || '',
    receivedBy: req.user._id,
    returnDate: new Date(),
  });
  await partReturn.validate();
  partReturn.returnNumber = await getNextSequence('partReturnNumber', 'RT');

  const movementPlans = [];
  for (const line of lines) {
    const { part, qty, condition } = line;
    const previousStock = part.stockOnHand;
    part.stockOnHand = previousStock + qty;
    if (condition === 'Good') {
      const allocatable = part.allocatableStock === null || part.allocatableStock === undefined ? previousStock : part.allocatableStock;
      part.allocatableStock = allocatable + qty;
    } else {
      part.damagedStock = (part.damagedStock || 0) + qty;
    }
    movementPlans.push({ part, qty, condition, previousStock, newStock: part.stockOnHand });

    line.item.quantityReturned += qty;
    line.item.status = deriveItemStatus(line.item.quantityRequested, line.item.quantityIssued, line.item.quantityReturned);
  }

  for (const part of new Set(partsById.values())) {
    await part.save();
  }
  issue.status = deriveOverallStatus(issue.items);
  await issue.save();
  await partReturn.save();

  for (const plan of movementPlans) {
    await StockMovement.create({
      movementId: await getNextSequence('stockMovementId', 'MV'),
      store,
      sparePart: plan.part._id,
      partNumber: plan.part.partNumber,
      movementType: 'Return',
      quantity: plan.qty,
      previousStock: plan.previousStock,
      newStock: plan.newStock,
      storeIssue: issue._id,
      serviceOrderNumber: issue.serviceOrderNumber,
      workOrderNumber: issue.workOrderNumber,
      user: req.user._id,
      reason: `${partReturn.returnNumber} (${plan.condition}): ${partReturn.reason}`,
    });
  }

  res.status(201).json({ partReturn });
}

async function listPartReturns(req, res) {
  const filter = {};
  if (req.query.storeIssue) filter.storeIssue = req.query.storeIssue;
  const partReturns = await PartReturn.find(filter).sort({ returnDate: -1 }).limit(300);
  res.json({ partReturns });
}

async function getPartReturn(req, res) {
  const partReturn = await PartReturn.findById(req.params.id);
  if (!partReturn) {
    throw new ApiError(404, 'Return not found');
  }
  res.json({ partReturn });
}

module.exports = { createPartReturn, listPartReturns, getPartReturn };

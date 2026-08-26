const { ApiError } = require('../utils/ApiError');
const { StoreIssue } = require('../models/StoreIssue');
const { SparePart } = require('../models/SparePart');
const { StockMovement } = require('../models/StockMovement');
const { getNextSequence } = require('../utils/sequence');
const { getDefaultStoreId } = require('../utils/defaultStore');

function deriveStatus(quantityRequested, quantityIssued) {
  if (quantityIssued <= 0) return 'Awaiting Order';
  if (quantityIssued >= quantityRequested) return 'Issued';
  return 'Partially Issued';
}

async function createStoreIssue(req, res) {
  const {
    machineNumber,
    machineType,
    serviceOrderNumber,
    workOrderNumber,
    sparePartId,
    requestorName,
    requestorSurname,
    requestorClockNumber,
    requestorContactNumber,
    justification,
    quantityRequested,
    quantityIssued: quantityIssuedInput,
    quantityToOrder: quantityToOrderInput,
    quantityReturned: quantityReturnedInput,
    foremanName,
    foremanSurname,
  } = req.body;

  if (!sparePartId || !requestorName || !requestorSurname || !quantityRequested || !justification) {
    throw new ApiError(400, 'Missing required fields');
  }

  const part = await SparePart.findById(sparePartId);
  if (!part) {
    throw new ApiError(404, 'Spare part not found');
  }

  const requested = Number(quantityRequested);
  if (!(requested > 0)) {
    throw new ApiError(400, 'Quantity requested must be greater than 0');
  }

  const autoIssued = Math.min(part.stockOnHand, requested);
  const autoToOrder = Math.max(0, requested - part.stockOnHand);

  const quantityIssued =
    quantityIssuedInput !== undefined && quantityIssuedInput !== null
      ? Number(quantityIssuedInput)
      : autoIssued;
  const quantityToOrder =
    quantityToOrderInput !== undefined && quantityToOrderInput !== null
      ? Number(quantityToOrderInput)
      : autoToOrder;

  if (quantityIssued < 0 || quantityIssued > part.stockOnHand || quantityIssued > requested) {
    throw new ApiError(400, 'Quantity issued is invalid for current stock / quantity requested');
  }

  const quantityReturned =
    quantityReturnedInput !== undefined && quantityReturnedInput !== null ? Number(quantityReturnedInput) : 0;
  if (quantityReturned < 0 || quantityReturned > quantityIssued) {
    throw new ApiError(400, 'Quantity returned cannot exceed quantity issued');
  }

  const previousStock = part.stockOnHand;
  const afterIssueStock = previousStock - quantityIssued;
  const finalStock = afterIssueStock + quantityReturned;
  part.stockOnHand = finalStock;
  await part.save();

  const store = await getDefaultStoreId();
  const issueNumber = await getNextSequence('storeIssueNumber', 'SI');

  let status = deriveStatus(requested, quantityIssued);
  if (quantityIssued > 0 && quantityReturned >= quantityIssued) {
    status = 'Returned';
  }

  const issue = await StoreIssue.create({
    issueNumber,
    store,
    machineNumber,
    machineType,
    serviceOrderNumber,
    workOrderNumber,
    sparePart: part._id,
    partNumber: part.partNumber,
    partDescription: part.partDescription,
    componentPartNumber: part.componentPartNumber,
    componentDescription: part.componentDescription,
    functionalSystem: part.functionalSystem,
    subSystem: part.subSystem,
    serialNumber: part.serialNumber,
    requestorName,
    requestorSurname,
    requestorClockNumber,
    requestorContactNumber,
    justification,
    quantityRequested: requested,
    quantityIssued,
    quantityToOrder,
    quantityReturned,
    foremanName,
    foremanSurname,
    issuedBy: req.user._id,
    issueDate: new Date(),
    status,
  });

  if (quantityIssued > 0) {
    await StockMovement.create({
      movementId: await getNextSequence('stockMovementId', 'MV'),
      store,
      sparePart: part._id,
      partNumber: part.partNumber,
      movementType: 'Issue',
      quantity: quantityIssued,
      previousStock,
      newStock: afterIssueStock,
      storeIssue: issue._id,
      serviceOrderNumber,
      workOrderNumber,
      user: req.user._id,
      reason: 'Store issue',
    });
  }

  if (quantityReturned > 0) {
    await StockMovement.create({
      movementId: await getNextSequence('stockMovementId', 'MV'),
      store,
      sparePart: part._id,
      partNumber: part.partNumber,
      movementType: 'Return',
      quantity: quantityReturned,
      previousStock: afterIssueStock,
      newStock: finalStock,
      storeIssue: issue._id,
      serviceOrderNumber,
      workOrderNumber,
      user: req.user._id,
      reason: 'Returned at time of issue',
    });
  }

  const populated = await StoreIssue.findById(issue._id).populate('sparePart').populate('issuedBy');
  res.status(201).json({ issue: populated });
}

async function listStoreIssues(req, res) {
  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(String(search).trim(), 'i');
    filter.$or = [{ issueNumber: re }, { partNumber: re }, { partDescription: re }];
  }

  const issues = await StoreIssue.find(filter)
    .sort({ issueDate: -1 })
    .limit(300)
    .populate('sparePart')
    .populate('issuedBy');

  res.json({ issues });
}

async function getStoreIssue(req, res) {
  const issue = await StoreIssue.findById(req.params.id).populate('sparePart').populate('issuedBy');
  if (!issue) {
    throw new ApiError(404, 'Store issue not found');
  }
  res.json({ issue });
}

module.exports = { createStoreIssue, listStoreIssues, getStoreIssue };

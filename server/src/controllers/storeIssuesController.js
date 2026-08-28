const { ApiError } = require('../utils/ApiError');
const { StoreIssue } = require('../models/StoreIssue');
const { SparePart } = require('../models/SparePart');
const { StockMovement } = require('../models/StockMovement');
const { getNextSequence } = require('../utils/sequence');
const { getDefaultStoreId } = require('../utils/defaultStore');
const { deriveItemStatus, deriveOverallStatus } = require('../utils/storeIssueStatus');

async function createStoreIssue(req, res) {
  const {
    machineNumber,
    machineType,
    serviceOrderNumber,
    workOrderNumber,
    riskAssessmentNumber,
    location,
    section,
    workplace,
    responsibleForeman,
    dateStarted,
    dateCompleted,
    timeStarted,
    timeCompleted,
    engineHours,
    powerPackHours,
    percussionHours,
    extraHours,
    natureOfDowntime,
    possibleCausesOfFailure,
    workPerformed,
    subSystem,
    functionalSystem,
    componentDescription,
    componentPartNumber,
    serialNumberIssued,
    serialNumberReturned,
    items: itemsInput,
    laborEntries: laborEntriesInput,
    requestorName,
    requestorSurname,
    requestorClockNumber,
    requestorContactNumber,
    justification,
    foremanName,
    foremanSurname,
    storemanName,
    storemanSurname,
  } = req.body;

  const toNullableNumber = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
  const toNullableDate = (v) => (v === undefined || v === null || v === '' ? null : new Date(v));

  const laborEntries = Array.isArray(laborEntriesInput)
    ? laborEntriesInput
        .filter((l) => l && (l.name || l.surname || l.clockNumber || l.position || l.totalHours))
        .map((l) => ({
          clockNumber: l.clockNumber || '',
          name: l.name || '',
          surname: l.surname || '',
          position: l.position || '',
          totalHours: toNullableNumber(l.totalHours),
        }))
    : [];

  if (
    !requestorName ||
    !requestorSurname ||
    !justification ||
    !Array.isArray(itemsInput) ||
    itemsInput.length === 0
  ) {
    throw new ApiError(400, 'Missing required fields');
  }

  const items = [];
  const movementPlans = [];

  for (const raw of itemsInput) {
    const {
      sparePartId,
      quantityRequested,
      quantityIssued: quantityIssuedInput,
      quantityToOrder: quantityToOrderInput,
      quantityReturned: quantityReturnedInput,
    } = raw || {};

    if (!sparePartId || !quantityRequested) {
      throw new ApiError(400, 'Each part line requires a part and a requested quantity');
    }

    const part = await SparePart.findById(sparePartId);
    if (!part) {
      throw new ApiError(404, `Spare part not found: ${sparePartId}`);
    }

    const requested = Number(quantityRequested);
    if (!(requested > 0)) {
      throw new ApiError(400, `Quantity requested must be greater than 0 for ${part.partNumber}`);
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
      throw new ApiError(400, `Quantity issued is invalid for ${part.partNumber}`);
    }

    const quantityReturned =
      quantityReturnedInput !== undefined && quantityReturnedInput !== null
        ? Number(quantityReturnedInput)
        : 0;
    if (quantityReturned < 0 || quantityReturned > quantityIssued) {
      throw new ApiError(400, `Quantity returned cannot exceed quantity issued for ${part.partNumber}`);
    }

    const previousStock = part.stockOnHand;
    const afterIssueStock = previousStock - quantityIssued;
    const finalStock = afterIssueStock + quantityReturned;
    part.stockOnHand = finalStock;
    await part.save();

    const status = deriveItemStatus(requested, quantityIssued, quantityReturned);

    items.push({
      sparePart: part._id,
      partNumber: part.partNumber,
      partDescription: part.partDescription,
      componentPartNumber: part.componentPartNumber,
      componentDescription: part.componentDescription,
      functionalSystem: part.functionalSystem,
      subSystem: part.subSystem,
      serialNumber: part.serialNumber,
      quantityRequested: requested,
      quantityIssued,
      quantityToOrder,
      quantityReturned,
      status,
    });

    movementPlans.push({ part, previousStock, afterIssueStock, finalStock, quantityIssued, quantityReturned });
  }

  const store = await getDefaultStoreId();
  const issueNumber = await getNextSequence('storeIssueNumber', 'SI');
  const status = deriveOverallStatus(items);

  const issue = await StoreIssue.create({
    issueNumber,
    store,
    machineNumber,
    machineType,
    serviceOrderNumber,
    workOrderNumber,
    riskAssessmentNumber,
    location,
    section,
    workplace,
    responsibleForeman,
    dateStarted: toNullableDate(dateStarted),
    dateCompleted: toNullableDate(dateCompleted),
    timeStarted,
    timeCompleted,
    engineHours: toNullableNumber(engineHours),
    powerPackHours: toNullableNumber(powerPackHours),
    percussionHours: toNullableNumber(percussionHours),
    extraHours: toNullableNumber(extraHours),
    natureOfDowntime: {
      damage: Boolean(natureOfDowntime?.damage),
      breakdown: Boolean(natureOfDowntime?.breakdown),
      warranty: Boolean(natureOfDowntime?.warranty),
      inspection: Boolean(natureOfDowntime?.inspection),
    },
    possibleCausesOfFailure,
    workPerformed,
    subSystem,
    functionalSystem,
    componentDescription,
    componentPartNumber,
    serialNumberIssued,
    serialNumberReturned,
    items,
    laborEntries,
    requestorName,
    requestorSurname,
    requestorClockNumber,
    requestorContactNumber,
    justification,
    foremanName,
    foremanSurname,
    storemanName,
    storemanSurname,
    issuedBy: req.user._id,
    issueDate: new Date(),
    status,
  });

  for (const plan of movementPlans) {
    if (plan.quantityIssued > 0) {
      await StockMovement.create({
        movementId: await getNextSequence('stockMovementId', 'MV'),
        store,
        sparePart: plan.part._id,
        partNumber: plan.part.partNumber,
        movementType: 'Issue',
        quantity: plan.quantityIssued,
        previousStock: plan.previousStock,
        newStock: plan.afterIssueStock,
        storeIssue: issue._id,
        serviceOrderNumber,
        workOrderNumber,
        user: req.user._id,
        reason: 'Store issue',
      });
    }

    if (plan.quantityReturned > 0) {
      await StockMovement.create({
        movementId: await getNextSequence('stockMovementId', 'MV'),
        store,
        sparePart: plan.part._id,
        partNumber: plan.part.partNumber,
        movementType: 'Return',
        quantity: plan.quantityReturned,
        previousStock: plan.afterIssueStock,
        newStock: plan.finalStock,
        storeIssue: issue._id,
        serviceOrderNumber,
        workOrderNumber,
        user: req.user._id,
        reason: 'Returned at time of issue',
      });
    }
  }

  const populated = await StoreIssue.findById(issue._id).populate('items.sparePart').populate('issuedBy');
  res.status(201).json({ issue: populated });
}

async function listStoreIssues(req, res) {
  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(String(search).trim(), 'i');
    filter.$or = [{ issueNumber: re }, { 'items.partNumber': re }, { 'items.partDescription': re }];
  }

  const issues = await StoreIssue.find(filter)
    .sort({ issueDate: -1 })
    .limit(300)
    .populate('items.sparePart')
    .populate('issuedBy');

  res.json({ issues });
}

async function getStoreIssue(req, res) {
  const issue = await StoreIssue.findById(req.params.id).populate('items.sparePart').populate('issuedBy');
  if (!issue) {
    throw new ApiError(404, 'Store issue not found');
  }
  res.json({ issue });
}

module.exports = { createStoreIssue, listStoreIssues, getStoreIssue };

const { ApiError } = require('../utils/ApiError');
const { PartRequest } = require('../models/PartRequest');

async function listPartRequests(req, res) {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const requests = await PartRequest.find(filter).sort({ createdAt: -1 }).limit(1000);
  res.json({ requests });
}

async function createPartRequest(req, res) {
  const { partNumber, partDescription, quantityRequested, machineNumber, requestorName, notes } = req.body;

  if (!partNumber || !partDescription || !quantityRequested) {
    throw new ApiError(400, 'Missing required fields');
  }

  const quantity = Number(quantityRequested);
  if (Number.isNaN(quantity) || quantity <= 0) {
    throw new ApiError(400, 'Quantity requested must be greater than 0');
  }

  const request = await PartRequest.create({
    partNumber: String(partNumber).trim(),
    partDescription: String(partDescription).trim(),
    quantityRequested: quantity,
    machineNumber: machineNumber || '',
    requestorName: requestorName || '',
    notes: notes || '',
    flaggedBy: req.user._id,
  });

  res.status(201).json({ request });
}

async function updatePartRequest(req, res) {
  const { id } = req.params;
  const { status, quantityRequested, notes } = req.body;

  const request = await PartRequest.findById(id);
  if (!request) {
    throw new ApiError(404, 'Part request not found');
  }

  if (quantityRequested !== undefined) {
    const quantity = Number(quantityRequested);
    if (Number.isNaN(quantity) || quantity <= 0) {
      throw new ApiError(400, 'Quantity requested must be greater than 0');
    }
    request.quantityRequested = quantity;
  }

  if (notes !== undefined) {
    request.notes = notes;
  }

  if (status !== undefined) {
    if (!['Open', 'Received', 'Cancelled'].includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }
    request.status = status;
    request.resolvedAt = status === 'Open' ? null : new Date();
  }

  await request.save();
  res.json({ request });
}

async function deletePartRequest(req, res) {
  const { id } = req.params;
  const request = await PartRequest.findById(id);
  if (!request) {
    throw new ApiError(404, 'Part request not found');
  }
  await request.deleteOne();
  res.json({ ok: true });
}

module.exports = { listPartRequests, createPartRequest, updatePartRequest, deletePartRequest };

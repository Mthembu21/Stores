const { ApiError } = require('../utils/ApiError');
const { Tool } = require('../models/Tool');
const { BorrowRecord } = require('../models/BorrowRecord');
const { User } = require('../models/User');

async function borrowTool(req, res) {
  const { toolId, borrowerId, expectedReturnAt, jobNumber } = req.body;

  if (!toolId || !borrowerId || !expectedReturnAt || !jobNumber) {
    throw new ApiError(400, 'Missing required fields');
  }

  const tool = await Tool.findById(toolId);
  if (!tool) {
    throw new ApiError(404, 'Tool not found');
  }

  if (tool.flag !== 'None') {
    throw new ApiError(400, 'Tool is not available');
  }

  if (tool.quantityAvailable <= 0) {
    throw new ApiError(400, 'No available quantity for this tool');
  }

  const borrower = await User.findById(borrowerId);
  if (!borrower) {
    throw new ApiError(404, 'Borrower not found');
  }

  tool.quantityAvailable -= 1;
  tool.status = tool.quantityAvailable > 0 ? 'Available' : 'Borrowed';
  await tool.save();

  const record = await BorrowRecord.create({
    tool: tool._id,
    borrower: borrower._id,
    jobNumber: String(jobNumber).trim(),
    processedBy: req.user._id,
    borrowedAt: new Date(),
    expectedReturnAt: new Date(expectedReturnAt),
  });

  const populated = await BorrowRecord.findById(record._id)
    .populate('tool')
    .populate('borrower')
    .populate('processedBy');

  res.status(201).json({ record: populated });
}

async function listBorrowings(req, res) {
  const { status } = req.query;

  const filter = {};
  if (status === 'open') filter.returnedAt = null;
  if (status === 'returned') filter.returnedAt = { $ne: null };

  const records = await BorrowRecord.find(filter)
    .sort({ borrowedAt: -1 })
    .limit(200)
    .populate('tool')
    .populate('borrower')
    .populate('processedBy');

  res.json({ records });
}

module.exports = { borrowTool, listBorrowings };

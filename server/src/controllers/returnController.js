const { ApiError } = require('../utils/ApiError');
const { BorrowRecord } = require('../models/BorrowRecord');
const { Tool } = require('../models/Tool');

async function returnTool(req, res) {
  const { recordId, condition } = req.body;

  if (!recordId || !condition) {
    throw new ApiError(400, 'Missing required fields');
  }

  const record = await BorrowRecord.findById(recordId);
  if (!record) {
    throw new ApiError(404, 'Borrow record not found');
  }

  if (record.returnedAt) {
    throw new ApiError(400, 'Tool already returned');
  }

  if (!['Good', 'Fair', 'Damaged', 'Missing'].includes(condition)) {
    throw new ApiError(400, 'Invalid condition');
  }

  const tool = await Tool.findById(record.tool);
  if (!tool) {
    throw new ApiError(404, 'Tool not found');
  }

  record.returnedAt = new Date();
  record.returnCondition = condition;
  await record.save();

  tool.lastReturnCondition = condition;
  tool.lastReturnedAt = record.returnedAt;

  if (condition === 'Good' || condition === 'Fair') {
    tool.quantityAvailable = Math.min(tool.quantityAvailable + 1, tool.quantityTotal);
    if (tool.flag !== 'Missing') {
      tool.flag = 'None';
    }
  }

  if (condition === 'Damaged') {
    tool.flag = 'Damaged';
    tool.status = 'Under Repair';
  }

  if (condition === 'Missing') {
    tool.flag = 'Missing';
  }

  tool.status = tool.quantityAvailable > 0 ? 'Available' : 'Borrowed';
  if (tool.flag === 'Damaged') tool.status = 'Under Repair';

  await tool.save();

  const populated = await BorrowRecord.findById(record._id)
    .populate('tool')
    .populate('borrower');

  res.json({ record: populated });
}

module.exports = { returnTool };

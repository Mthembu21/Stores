const { ApiError } = require('../utils/ApiError');
const { Tool } = require('../models/Tool');

const DAY_MS = 24 * 60 * 60 * 1000;

async function listTools(req, res) {
  const tools = await Tool.find({}).sort({ createdAt: -1 });
  res.json({ tools });
}

async function createTool(req, res) {
  const {
    toolName,
    toolCode,
    category,
    quantityTotal,
    quantityAvailable,
    status,
  } = req.body;

  if (!toolName || !toolCode || !category || quantityTotal === undefined) {
    throw new ApiError(400, 'Missing required fields');
  }

  const exists = await Tool.findOne({ toolCode: String(toolCode).trim() });
  if (exists) {
    throw new ApiError(409, 'Tool Code already exists');
  }

  const qtyTotalNum = Number(quantityTotal);
  const qtyAvailNum = quantityAvailable === undefined ? qtyTotalNum : Number(quantityAvailable);

  if (Number.isNaN(qtyTotalNum) || qtyTotalNum < 0) {
    throw new ApiError(400, 'Invalid Quantity Total');
  }
  if (Number.isNaN(qtyAvailNum) || qtyAvailNum < 0 || qtyAvailNum > qtyTotalNum) {
    throw new ApiError(400, 'Invalid Quantity Available');
  }

  const tool = await Tool.create({
    toolName,
    toolCode: String(toolCode).trim(),
    category,
    quantityTotal: qtyTotalNum,
    quantityAvailable: qtyAvailNum,
    status: status || (qtyAvailNum > 0 ? 'Available' : 'Borrowed'),
  });

  res.status(201).json({ tool });
}

async function updateTool(req, res) {
  const { id } = req.params;
  const tool = await Tool.findById(id);
  if (!tool) {
    throw new ApiError(404, 'Tool not found');
  }

  const {
    toolName,
    toolCode,
    category,
    quantityTotal,
    quantityAvailable,
    status,
    flag,
    isSpecialTool,
    calibrationEnabled,
    calibrationIntervalDays,
    lastCalibrationAt,
    inspectionEnabled,
    inspectionIntervalDays,
    lastInspectionAt,
  } = req.body;

  if (toolCode && String(toolCode).trim() !== tool.toolCode) {
    const exists = await Tool.findOne({ toolCode: String(toolCode).trim() });
    if (exists) {
      throw new ApiError(409, 'Tool Code already exists');
    }
    tool.toolCode = String(toolCode).trim();
  }

  if (toolName !== undefined) tool.toolName = toolName;
  if (category !== undefined) tool.category = category;
  if (status !== undefined) tool.status = status;
  if (flag !== undefined) tool.flag = flag;

  if (isSpecialTool !== undefined) {
    tool.isSpecialTool = Boolean(isSpecialTool);
    if (!tool.isSpecialTool) {
      tool.specialStatus = 'None';
      tool.assignedToTechnicianId = null;
      tool.currentAssignmentId = null;
      tool.assignmentStartAt = null;
      tool.assignmentEndAt = null;
      tool.assignmentPausedAt = null;
    }
  }

  if (calibrationEnabled !== undefined) tool.calibrationEnabled = Boolean(calibrationEnabled);
  if (calibrationIntervalDays !== undefined) {
    const v = calibrationIntervalDays === null ? null : Number(calibrationIntervalDays);
    if (v !== null && (Number.isNaN(v) || v < 1)) throw new ApiError(400, 'Invalid Calibration Interval');
    tool.calibrationIntervalDays = v;
  }

  if (lastCalibrationAt !== undefined) {
    tool.lastCalibrationAt = lastCalibrationAt === null ? null : new Date(lastCalibrationAt);
  }

  if (inspectionEnabled !== undefined) tool.inspectionEnabled = Boolean(inspectionEnabled);
  if (inspectionIntervalDays !== undefined) {
    const v = inspectionIntervalDays === null ? null : Number(inspectionIntervalDays);
    if (v !== null && (Number.isNaN(v) || v < 1)) throw new ApiError(400, 'Invalid Inspection Interval');
    tool.inspectionIntervalDays = v;
  }

  if (lastInspectionAt !== undefined) {
    tool.lastInspectionAt = lastInspectionAt === null ? null : new Date(lastInspectionAt);
  }

  if (tool.calibrationEnabled && tool.calibrationIntervalDays && tool.lastCalibrationAt) {
    tool.nextCalibrationDueAt = new Date(new Date(tool.lastCalibrationAt).getTime() + Number(tool.calibrationIntervalDays) * DAY_MS);
  } else {
    tool.nextCalibrationDueAt = null;
  }

  if (tool.inspectionEnabled && tool.inspectionIntervalDays && tool.lastInspectionAt) {
    tool.nextInspectionDueAt = new Date(new Date(tool.lastInspectionAt).getTime() + Number(tool.inspectionIntervalDays) * DAY_MS);
  } else {
    tool.nextInspectionDueAt = null;
  }

  if (quantityTotal !== undefined) {
    const q = Number(quantityTotal);
    if (Number.isNaN(q) || q < 0) throw new ApiError(400, 'Invalid Quantity Total');
    tool.quantityTotal = q;
    if (tool.quantityAvailable > q) {
      tool.quantityAvailable = q;
    }
  }

  if (quantityAvailable !== undefined) {
    const a = Number(quantityAvailable);
    if (Number.isNaN(a) || a < 0 || a > tool.quantityTotal) {
      throw new ApiError(400, 'Invalid Quantity Available');
    }
    tool.quantityAvailable = a;
  }

  if (tool.quantityAvailable === 0 && tool.status === 'Available') {
    tool.status = 'Borrowed';
  }
  if (tool.quantityAvailable > 0 && tool.status === 'Borrowed') {
    tool.status = 'Available';
  }

  await tool.save();
  res.json({ tool });
}

async function deleteTool(req, res) {
  const { id } = req.params;
  const tool = await Tool.findById(id);
  if (!tool) {
    throw new ApiError(404, 'Tool not found');
  }
  await tool.deleteOne();
  res.json({ ok: true });
}

module.exports = { listTools, createTool, updateTool, deleteTool };

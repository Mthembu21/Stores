const { ApiError } = require('../utils/ApiError');
const { Tool } = require('../models/Tool');
const { User } = require('../models/User');
const { SpecialToolAssignment } = require('../models/SpecialToolAssignment');
const { ExternalDispatch } = require('../models/ExternalDispatch');

const DAY_MS = 24 * 60 * 60 * 1000;

function calcPlannedEnd(startAt, durationDays) {
  return new Date(new Date(startAt).getTime() + durationDays * DAY_MS);
}

async function listSpecialTools(req, res) {
  const tools = await Tool.find({ isSpecialTool: true })
    .sort({ createdAt: -1 })
    .populate('assignedToTechnicianId')
    .populate('currentAssignmentId');
  res.json({ tools });
}

async function listDispatches(req, res) {
  const { status } = req.query;
  const q = {};
  if (status) q.status = status;
  const dispatches = await ExternalDispatch.find(q)
    .sort({ createdAt: -1 })
    .populate('toolId')
    .populate('assignmentId');
  res.json({ dispatches });
}

async function listAssignments(req, res) {
  const { status } = req.query;
  const q = {};
  if (status) q.status = status;
  const assignments = await SpecialToolAssignment.find(q)
    .sort({ createdAt: -1 })
    .populate('toolId')
    .populate('technicianId');
  res.json({ assignments });
}

async function assignSpecialTool(req, res) {
  const { toolId } = req.params;
  const { technicianId, startAt, durationDays } = req.body;

  if (!technicianId) throw new ApiError(400, 'Missing required fields');

  const tool = await Tool.findById(toolId);
  if (!tool) throw new ApiError(404, 'Tool not found');
  if (!tool.isSpecialTool) throw new ApiError(400, 'Tool is not marked as Special Tool');
  if (tool.currentAssignmentId) throw new ApiError(409, 'Tool already has an active assignment');

  const tech = await User.findById(technicianId);
  if (!tech) throw new ApiError(404, 'Technician not found');

  const start = startAt ? new Date(startAt) : new Date();
  const dur = durationDays === undefined ? 365 : Number(durationDays);
  if (Number.isNaN(dur) || dur < 1 || dur > 365) throw new ApiError(400, 'Invalid assignment duration');

  const plannedEndAt = calcPlannedEnd(start, dur);

  const assignment = await SpecialToolAssignment.create({
    toolId: tool._id,
    technicianId: tech._id,
    startAt: start,
    plannedDurationDays: dur,
    plannedEndAt,
    currentEndAt: plannedEndAt,
    status: 'Active',
    totalPausedMs: 0,
    pausePeriods: [],
    createdBy: req.user?._id || null,
    updatedBy: req.user?._id || null,
  });

  tool.currentAssignmentId = assignment._id;
  tool.assignedToTechnicianId = tech._id;
  tool.assignmentStartAt = start;
  tool.assignmentEndAt = assignment.currentEndAt;
  tool.assignmentPausedAt = null;
  tool.specialStatus = 'Assigned';
  await tool.save();

  res.status(201).json({ assignment, tool });
}

async function dispatchSpecialTool(req, res) {
  const { toolId } = req.params;
  const { type, sentAt, expectedReturnAt, reference } = req.body;

  if (!type || !sentAt || !expectedReturnAt) throw new ApiError(400, 'Missing required fields');
  if (!['Calibration', 'Inspection'].includes(type)) throw new ApiError(400, 'Invalid dispatch type');

  const tool = await Tool.findById(toolId);
  if (!tool) throw new ApiError(404, 'Tool not found');
  if (!tool.isSpecialTool) throw new ApiError(400, 'Tool is not marked as Special Tool');

  const existingOpen = await ExternalDispatch.findOne({ toolId: tool._id, status: 'Open' });
  if (existingOpen) throw new ApiError(409, 'Tool already has an open dispatch');

  let assignment = null;
  if (tool.currentAssignmentId) {
    assignment = await SpecialToolAssignment.findById(tool.currentAssignmentId);
    if (!assignment) throw new ApiError(400, 'Assignment not found');
    if (assignment.status !== 'Active') throw new ApiError(409, 'Assignment is not active');

    assignment.status = type === 'Calibration' ? 'PausedCalibration' : 'PausedInspection';
    assignment.pausePeriods.push({ type, startAt: new Date(sentAt), endAt: null });
    assignment.updatedBy = req.user?._id || null;
    await assignment.save();

    tool.assignmentPausedAt = new Date(sentAt);
    tool.specialStatus = type === 'Calibration' ? 'Under Calibration' : 'Under Inspection';
  } else {
    tool.specialStatus = type === 'Calibration' ? 'Under Calibration' : 'Under Inspection';
  }

  const dispatch = await ExternalDispatch.create({
    toolId: tool._id,
    assignmentId: assignment ? assignment._id : null,
    type,
    status: 'Open',
    sentAt: new Date(sentAt),
    expectedReturnAt: new Date(expectedReturnAt),
    returnedAt: null,
    reference: reference || '',
    createdBy: req.user?._id || null,
  });

  await tool.save();

  res.status(201).json({ dispatch, assignment, tool });
}

async function returnDispatch(req, res) {
  const { dispatchId } = req.params;
  const { returnedAt, reference } = req.body;

  if (!returnedAt) throw new ApiError(400, 'Missing required fields');

  const dispatch = await ExternalDispatch.findById(dispatchId);
  if (!dispatch) throw new ApiError(404, 'Dispatch not found');
  if (dispatch.status !== 'Open') throw new ApiError(400, 'Dispatch already returned');

  const tool = await Tool.findById(dispatch.toolId);
  if (!tool) throw new ApiError(404, 'Tool not found');

  dispatch.status = 'Returned';
  dispatch.returnedAt = new Date(returnedAt);
  if (reference !== undefined) dispatch.reference = reference;
  await dispatch.save();

  let assignment = null;
  if (dispatch.assignmentId) {
    assignment = await SpecialToolAssignment.findById(dispatch.assignmentId);
    if (!assignment) throw new ApiError(400, 'Assignment not found');

    const idx = assignment.pausePeriods
      .map((p, i) => ({ p, i }))
      .reverse()
      .find((x) => x.p.endAt === null)?.i;

    if (idx === undefined) throw new ApiError(400, 'No open pause period');

    const pause = assignment.pausePeriods[idx];
    pause.endAt = dispatch.returnedAt;

    const pausedMs = Math.max(0, dispatch.returnedAt.getTime() - new Date(pause.startAt).getTime());
    assignment.totalPausedMs += pausedMs;
    assignment.currentEndAt = new Date(new Date(assignment.plannedEndAt).getTime() + assignment.totalPausedMs);
    assignment.status = 'Active';
    assignment.updatedBy = req.user?._id || null;
    await assignment.save();

    tool.specialStatus = 'Assigned';
    tool.assignmentPausedAt = null;
    tool.assignmentEndAt = assignment.currentEndAt;
  } else {
    tool.specialStatus = 'None';
  }

  if (dispatch.type === 'Calibration') {
    tool.lastCalibrationAt = dispatch.returnedAt;
    if (tool.calibrationEnabled && tool.calibrationIntervalDays) {
      tool.nextCalibrationDueAt = new Date(dispatch.returnedAt.getTime() + Number(tool.calibrationIntervalDays) * DAY_MS);
    }
  }

  if (dispatch.type === 'Inspection') {
    tool.lastInspectionAt = dispatch.returnedAt;
    if (tool.inspectionEnabled && tool.inspectionIntervalDays) {
      tool.nextInspectionDueAt = new Date(dispatch.returnedAt.getTime() + Number(tool.inspectionIntervalDays) * DAY_MS);
    }
  }

  await tool.save();

  res.json({ dispatch, assignment, tool });
}

module.exports = {
  listSpecialTools,
  listDispatches,
  listAssignments,
  assignSpecialTool,
  dispatchSpecialTool,
  returnDispatch,
};

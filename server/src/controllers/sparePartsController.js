const { ApiError } = require('../utils/ApiError');
const { SparePart } = require('../models/SparePart');
const { getNextSequence } = require('../utils/sequence');
const { getDefaultStoreId } = require('../utils/defaultStore');

async function listSpareParts(req, res) {
  const { search, functionalSystem, subSystem, machineType, status, storageLocation, stock } = req.query;

  const filter = {};

  if (search) {
    const re = new RegExp(String(search).trim(), 'i');
    filter.$or = [{ partNumber: re }, { partDescription: re }, { componentPartNumber: re }];
  }

  if (functionalSystem) filter.functionalSystem = functionalSystem;
  if (subSystem) filter.subSystem = subSystem;
  if (machineType) filter.machineType = machineType;
  if (status) filter.status = status;
  if (storageLocation) filter.storageLocation = storageLocation;

  if (stock === 'low') {
    filter.$expr = { $and: [{ $lte: ['$stockOnHand', '$minimumStockLevel'] }, { $gt: ['$stockOnHand', 0] }] };
  } else if (stock === 'out') {
    filter.stockOnHand = { $lte: 0 };
  }

  const parts = await SparePart.find(filter).sort({ partNumber: 1 }).limit(500);
  res.json({ parts });
}

async function getSparePart(req, res) {
  const part = await SparePart.findById(req.params.id);
  if (!part) {
    throw new ApiError(404, 'Spare part not found');
  }
  res.json({ part });
}

async function createSparePart(req, res) {
  const {
    partNumber,
    partDescription,
    componentPartNumber,
    componentDescription,
    functionalSystem,
    subSystem,
    machineType,
    serialNumber,
    stockOnHand,
    minimumStockLevel,
    unitOfMeasure,
    storageLocation,
    status,
  } = req.body;

  if (!partDescription || stockOnHand === undefined || stockOnHand === null) {
    throw new ApiError(400, 'Missing required fields');
  }

  let finalPartNumber = partNumber ? String(partNumber).trim() : '';

  if (finalPartNumber) {
    const exists = await SparePart.findOne({ partNumber: finalPartNumber });
    if (exists) {
      throw new ApiError(409, 'Part number already exists');
    }
  } else {
    finalPartNumber = await getNextSequence('sparePartNumber', 'SP');
  }

  const store = await getDefaultStoreId();

  const part = await SparePart.create({
    partNumber: finalPartNumber,
    partDescription,
    componentPartNumber,
    componentDescription,
    functionalSystem,
    subSystem,
    machineType,
    serialNumber,
    stockOnHand,
    minimumStockLevel: minimumStockLevel || 0,
    unitOfMeasure: unitOfMeasure || 'EA',
    storageLocation,
    status: status || 'Active',
    store,
  });

  res.status(201).json({ part });
}

async function updateSparePart(req, res) {
  const { id } = req.params;
  const part = await SparePart.findById(id);
  if (!part) {
    throw new ApiError(404, 'Spare part not found');
  }

  const fields = [
    'partDescription',
    'componentPartNumber',
    'componentDescription',
    'functionalSystem',
    'subSystem',
    'machineType',
    'serialNumber',
    'stockOnHand',
    'minimumStockLevel',
    'unitOfMeasure',
    'storageLocation',
    'status',
  ];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      part[field] = req.body[field];
    }
  }

  await part.save();
  res.json({ part });
}

module.exports = { listSpareParts, getSparePart, createSparePart, updateSparePart };

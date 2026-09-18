const { ApiError } = require('../utils/ApiError');
const { SparePart } = require('../models/SparePart');
const { StockMovement } = require('../models/StockMovement');
const { getNextSequence } = require('../utils/sequence');
const { getDefaultStoreId } = require('../utils/defaultStore');

async function listSpareParts(req, res) {
  const { search, functionalSystem, subSystem, machineType, status, storageLocation, stock, partType } = req.query;

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
  if (partType) filter.partType = partType;

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
    partType,
    componentPartNumber,
    componentDescription,
    functionalSystem,
    subSystem,
    machineType,
    serialNumber,
    stockOnHand,
    allocatableStock,
    minimumStockLevel,
    maximumStockLevel,
    unitOfMeasure,
    storageLocation,
    status,
  } = req.body;

  if (!partDescription || stockOnHand === undefined || stockOnHand === null) {
    throw new ApiError(400, 'Missing required fields');
  }

  // Allocatable (bookable) stock can never exceed physical On Hand; default to
  // fully allocatable when not specified.
  const finalAllocatable = allocatableStock === undefined || allocatableStock === null || allocatableStock === ''
    ? Number(stockOnHand)
    : Number(allocatableStock);
  if (Number.isNaN(finalAllocatable) || finalAllocatable < 0 || finalAllocatable > Number(stockOnHand)) {
    throw new ApiError(400, 'Allocatable stock must be between 0 and Stock On Hand');
  }

  let finalPartNumber = partNumber ? String(partNumber).trim() : '';

  if (finalPartNumber) {
    const exists = await SparePart.findOne({ partNumber: finalPartNumber, storageLocation: storageLocation || '' });
    if (exists) {
      throw new ApiError(409, 'That part number already has a record at this storage location');
    }
  } else {
    finalPartNumber = await getNextSequence('sparePartNumber', 'SP');
  }

  const store = await getDefaultStoreId();

  const part = await SparePart.create({
    partNumber: finalPartNumber,
    partDescription,
    partType: ['Returnable', 'Consumable'].includes(partType) ? partType : 'Returnable',
    componentPartNumber,
    componentDescription,
    functionalSystem,
    subSystem,
    machineType,
    serialNumber,
    stockOnHand,
    allocatableStock: finalAllocatable,
    minimumStockLevel: minimumStockLevel || 0,
    maximumStockLevel: maximumStockLevel || 0,
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
    'partType',
    'componentPartNumber',
    'componentDescription',
    'functionalSystem',
    'subSystem',
    'machineType',
    'serialNumber',
    'stockOnHand',
    'allocatableStock',
    'minimumStockLevel',
    'maximumStockLevel',
    'unitOfMeasure',
    'storageLocation',
    'status',
  ];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      part[field] = req.body[field];
    }
  }

  // Allocatable can never exceed physical On Hand.
  if (part.allocatableStock !== null && part.allocatableStock !== undefined && part.allocatableStock > part.stockOnHand) {
    part.allocatableStock = part.stockOnHand;
  }

  try {
    await part.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'That part number already has a record at this storage location');
    }
    throw err;
  }
  res.json({ part });
}

async function deleteSparePart(req, res) {
  const { id } = req.params;
  const part = await SparePart.findById(id);
  if (!part) {
    throw new ApiError(404, 'Spare part not found');
  }
  await part.deleteOne();
  res.json({ ok: true });
}

function partLocationKey(partNumber, storageLocation) {
  return `${partNumber}|${String(storageLocation || '').trim().toLowerCase()}`;
}

// Shared by the additive and replace bulk-import endpoints: validate every row in
// memory (no DB calls) and build the doc to insert, or collect a per-row error.
function validateBulkRows(rows, store) {
  // Same part number is fine on multiple rows as long as each is a different
  // storage location — that's a separate stock record per bin, not a duplicate.
  const seenPartNumberLocations = new Set();
  const errors = [];
  const prepared = []; // { rowNum, explicitPartNumber, doc }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || {};
    const rowNum = i + 1;

    try {
      const partDescription = String(row.partDescription || '').trim();
      if (!partDescription) {
        throw new Error('Missing part description');
      }

      const stockOnHand = row.stockOnHand === '' || row.stockOnHand === undefined || row.stockOnHand === null
        ? 0
        : Number(row.stockOnHand);
      if (Number.isNaN(stockOnHand) || stockOnHand < 0) {
        throw new Error('Invalid stock on hand');
      }

      const minimumStockLevel = row.minimumStockLevel === '' || row.minimumStockLevel === undefined || row.minimumStockLevel === null
        ? 0
        : Number(row.minimumStockLevel);
      if (Number.isNaN(minimumStockLevel) || minimumStockLevel < 0) {
        throw new Error('Invalid minimum stock level');
      }

      const maximumStockLevel = row.maximumStockLevel === '' || row.maximumStockLevel === undefined || row.maximumStockLevel === null
        ? 0
        : Number(row.maximumStockLevel);
      if (Number.isNaN(maximumStockLevel) || maximumStockLevel < 0) {
        throw new Error('Invalid maximum stock level');
      }

      const allocatableStock = row.allocatableStock === '' || row.allocatableStock === undefined || row.allocatableStock === null
        ? stockOnHand
        : Number(row.allocatableStock);
      if (Number.isNaN(allocatableStock) || allocatableStock < 0 || allocatableStock > stockOnHand) {
        throw new Error('Allocatable stock must be between 0 and Stock On Hand');
      }

      const explicitPartNumber = row.partNumber ? String(row.partNumber).trim() : '';
      const rowLocation = String(row.storageLocation || '').trim().toLowerCase();
      if (explicitPartNumber) {
        const key = partLocationKey(explicitPartNumber, rowLocation);
        if (seenPartNumberLocations.has(key)) {
          throw new Error(`Duplicate part number + location in file: ${explicitPartNumber} @ ${rowLocation || '(none)'}`);
        }
        seenPartNumberLocations.add(key);
      }

      const status = ['Active', 'Obsolete'].includes(row.status) ? row.status : 'Active';
      const rowPartType = ['Returnable', 'Consumable'].includes(row.partType) ? row.partType : 'Returnable';

      prepared.push({
        rowNum,
        explicitPartNumber,
        doc: {
          partDescription,
          partType: rowPartType,
          componentPartNumber: row.componentPartNumber || '',
          componentDescription: row.componentDescription || '',
          functionalSystem: row.functionalSystem || '',
          subSystem: row.subSystem || '',
          machineType: row.machineType || '',
          serialNumber: row.serialNumber || '',
          stockOnHand,
          allocatableStock,
          minimumStockLevel,
          maximumStockLevel,
          unitOfMeasure: row.unitOfMeasure || 'EA',
          storageLocation: row.storageLocation || '',
          status,
          store,
        },
      });
    } catch (err) {
      errors.push({ row: rowNum, partNumber: row.partNumber || '', message: err.message || 'Could not create part' });
    }
  }

  return { prepared, errors };
}

async function bulkCreateSpareParts(req, res) {
  const rows = Array.isArray(req.body.parts) ? req.body.parts : [];

  if (rows.length === 0) {
    throw new ApiError(400, 'No parts provided');
  }
  if (rows.length > 2000) {
    throw new ApiError(400, 'Too many rows in one batch (max 2000)');
  }

  const store = await getDefaultStoreId();
  const { prepared, errors } = validateBulkRows(rows, store);

  // Pass 2: one query to find any (part number, location) pairs that already exist,
  // instead of one per row.
  const explicitNumbers = prepared.map((p) => p.explicitPartNumber).filter(Boolean);
  const existing = explicitNumbers.length
    ? await SparePart.find({ partNumber: { $in: explicitNumbers } }).select('partNumber storageLocation').lean()
    : [];
  const existingSet = new Set(existing.map((e) => partLocationKey(e.partNumber, e.storageLocation)));

  // Pass 3: assign part numbers (auto-sequence only where needed) and build the insert list.
  const toInsert = [];
  for (const p of prepared) {
    if (p.explicitPartNumber) {
      if (existingSet.has(partLocationKey(p.explicitPartNumber, p.doc.storageLocation))) {
        errors.push({ row: p.rowNum, partNumber: p.explicitPartNumber, message: `Part number already exists at this location: ${p.explicitPartNumber}` });
        continue;
      }
      p.doc.partNumber = p.explicitPartNumber;
    } else {
      p.doc.partNumber = await getNextSequence('sparePartNumber', 'SP');
    }
    toInsert.push(p.doc);
  }

  // Pass 4: one bulk insert instead of one create() per row.
  let created = [];
  if (toInsert.length > 0) {
    try {
      created = await SparePart.insertMany(toInsert, { ordered: false });
    } catch (bulkErr) {
      created = Array.isArray(bulkErr.insertedDocs) ? bulkErr.insertedDocs : [];
      const failedCount = toInsert.length - created.length;
      if (failedCount > 0) {
        errors.push({ row: 0, partNumber: '', message: `${failedCount} row(s) failed to save: ${bulkErr.message}` });
      }
    }
  }

  res.status(errors.length > 0 && created.length === 0 ? 400 : 201).json({
    created,
    errors,
    createdCount: created.length,
    errorCount: errors.length,
  });
}

// Full daily-refresh import: the uploaded file is treated as the complete, current
// state of whichever part type(s) it contains (e.g. the ERP's full Returnable-parts
// balance report) — so existing parts of those same type(s) are cleared first and
// replaced with exactly what's in this upload, rather than merged in alongside them.
async function bulkReplaceSpareParts(req, res) {
  const rows = Array.isArray(req.body.parts) ? req.body.parts : [];

  if (rows.length === 0) {
    throw new ApiError(400, 'No parts provided');
  }
  if (rows.length > 2000) {
    throw new ApiError(400, 'Too many rows in one batch (max 2000)');
  }

  const store = await getDefaultStoreId();
  const { prepared, errors } = validateBulkRows(rows, store);

  if (prepared.length === 0) {
    // Nothing valid to replace the inventory with — leave existing data untouched
    // rather than wiping it out for nothing.
    return res.status(400).json({ created: [], errors, createdCount: 0, errorCount: errors.length });
  }

  const partTypesInFile = [...new Set(prepared.map((p) => p.doc.partType))];
  await SparePart.deleteMany({ partType: { $in: partTypesInFile } });

  // Everything of these type(s) was just cleared, so only guard against an explicit
  // (part number, location) pair colliding with a surviving part of the *other* type.
  const explicitNumbers = prepared.map((p) => p.explicitPartNumber).filter(Boolean);
  const existing = explicitNumbers.length
    ? await SparePart.find({ partNumber: { $in: explicitNumbers } }).select('partNumber storageLocation').lean()
    : [];
  const existingSet = new Set(existing.map((e) => partLocationKey(e.partNumber, e.storageLocation)));

  const toInsert = [];
  for (const p of prepared) {
    if (p.explicitPartNumber) {
      if (existingSet.has(partLocationKey(p.explicitPartNumber, p.doc.storageLocation))) {
        errors.push({ row: p.rowNum, partNumber: p.explicitPartNumber, message: `Part number already exists at this location: ${p.explicitPartNumber}` });
        continue;
      }
      p.doc.partNumber = p.explicitPartNumber;
    } else {
      p.doc.partNumber = await getNextSequence('sparePartNumber', 'SP');
    }
    toInsert.push(p.doc);
  }

  let created = [];
  if (toInsert.length > 0) {
    try {
      created = await SparePart.insertMany(toInsert, { ordered: false });
    } catch (bulkErr) {
      created = Array.isArray(bulkErr.insertedDocs) ? bulkErr.insertedDocs : [];
      const failedCount = toInsert.length - created.length;
      if (failedCount > 0) {
        errors.push({ row: 0, partNumber: '', message: `${failedCount} row(s) failed to save: ${bulkErr.message}` });
      }
    }
  }

  res.status(201).json({
    created,
    errors,
    createdCount: created.length,
    errorCount: errors.length,
    replacedTypes: partTypesInFile,
  });
}

async function restockSparePart(req, res) {
  const { id } = req.params;
  const part = await SparePart.findById(id);
  if (!part) {
    throw new ApiError(404, 'Spare part not found');
  }

  const quantity = Number(req.body.quantity);
  if (!(quantity > 0)) {
    throw new ApiError(400, 'Restock quantity must be greater than 0');
  }

  const previousStock = part.stockOnHand;
  const previousAllocatable = part.allocatableStock === null || part.allocatableStock === undefined ? previousStock : part.allocatableStock;
  part.stockOnHand += quantity;
  part.allocatableStock = previousAllocatable + quantity;
  part.lastRestockedAt = new Date();
  part.lastRestockedQuantity = quantity;
  await part.save();

  const store = await getDefaultStoreId();
  await StockMovement.create({
    movementId: await getNextSequence('stockMovementId', 'MV'),
    store,
    sparePart: part._id,
    partNumber: part.partNumber,
    movementType: 'Receipt',
    quantity,
    previousStock,
    newStock: part.stockOnHand,
    user: req.user._id,
    reason: req.body.reason || 'Restock',
  });

  res.json({ part });
}

async function getConsumablesTracking(req, res) {
  const parts = await SparePart.aggregate([
    { $match: { partType: 'Consumable' } },
    {
      $lookup: {
        from: 'stockmovements',
        let: { partId: '$_id', since: '$lastRestockedAt' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$sparePart', '$$partId'] },
                  { $eq: ['$movementType', 'Issue'] },
                  { $gte: ['$createdAt', { $ifNull: ['$$since', new Date(0)] }] },
                ],
              },
            },
          },
          { $group: { _id: null, total: { $sum: '$quantity' } } },
        ],
        as: 'issuedSince',
      },
    },
    {
      $addFields: {
        issuedSinceRestock: { $ifNull: [{ $arrayElemAt: ['$issuedSince.total', 0] }, 0] },
      },
    },
    { $project: { issuedSince: 0 } },
    { $sort: { partNumber: 1 } },
  ]);

  const now = Date.now();
  const consumables = parts.map((p) => ({
    ...p,
    daysSinceRestock: p.lastRestockedAt ? Math.floor((now - new Date(p.lastRestockedAt).getTime()) / 86400000) : null,
  }));

  res.json({ consumables });
}

module.exports = {
  listSpareParts,
  getSparePart,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  bulkCreateSpareParts,
  bulkReplaceSpareParts,
  restockSparePart,
  getConsumablesTracking,
};

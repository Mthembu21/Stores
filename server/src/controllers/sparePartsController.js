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
    partType: ['Returnable', 'Consumable'].includes(partType) ? partType : 'Returnable',
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
    'partType',
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

async function bulkCreateSpareParts(req, res) {
  const rows = Array.isArray(req.body.parts) ? req.body.parts : [];

  if (rows.length === 0) {
    throw new ApiError(400, 'No parts provided');
  }
  if (rows.length > 1000) {
    throw new ApiError(400, 'Too many rows in one batch (max 1000)');
  }

  const store = await getDefaultStoreId();
  const seenPartNumbers = new Set();
  const created = [];
  const errors = [];

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

      let finalPartNumber = row.partNumber ? String(row.partNumber).trim() : '';

      if (finalPartNumber) {
        if (seenPartNumbers.has(finalPartNumber)) {
          throw new Error(`Duplicate part number in file: ${finalPartNumber}`);
        }
        const exists = await SparePart.findOne({ partNumber: finalPartNumber });
        if (exists) {
          throw new Error(`Part number already exists: ${finalPartNumber}`);
        }
      } else {
        finalPartNumber = await getNextSequence('sparePartNumber', 'SP');
      }
      seenPartNumbers.add(finalPartNumber);

      const status = ['Active', 'Obsolete'].includes(row.status) ? row.status : 'Active';
      const rowPartType = ['Returnable', 'Consumable'].includes(row.partType) ? row.partType : 'Returnable';

      const part = await SparePart.create({
        partNumber: finalPartNumber,
        partDescription,
        partType: rowPartType,
        componentPartNumber: row.componentPartNumber || '',
        componentDescription: row.componentDescription || '',
        functionalSystem: row.functionalSystem || '',
        subSystem: row.subSystem || '',
        machineType: row.machineType || '',
        serialNumber: row.serialNumber || '',
        stockOnHand,
        minimumStockLevel,
        unitOfMeasure: row.unitOfMeasure || 'EA',
        storageLocation: row.storageLocation || '',
        status,
        store,
      });

      created.push(part);
    } catch (err) {
      errors.push({ row: rowNum, partNumber: row.partNumber || '', message: err.message || 'Could not create part' });
    }
  }

  res.status(errors.length > 0 && created.length === 0 ? 400 : 201).json({
    created,
    errors,
    createdCount: created.length,
    errorCount: errors.length,
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
  part.stockOnHand += quantity;
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
  bulkCreateSpareParts,
  restockSparePart,
  getConsumablesTracking,
};

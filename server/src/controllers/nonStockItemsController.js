const { ApiError } = require('../utils/ApiError');
const { NonStockItem } = require('../models/NonStockItem');

async function listNonStockItems(req, res) {
  const { search } = req.query;
  const filter = {};
  if (search) {
    const re = new RegExp(String(search).trim(), 'i');
    filter.$or = [{ partNumber: re }, { partDescription: re }];
  }
  // No hard cap below the realistic catalog size — this list gets loaded in full for
  // client-side search on Parts To Order, same lesson learned from listSpareParts.
  const items = await NonStockItem.find(filter).sort({ partNumber: 1 }).limit(10000);
  res.json({ items });
}

// Upsert by part number: unlike the daily Spare Parts balance import, this catalog
// isn't a physical count of what's on the floor today — it's a reference list that
// just grows/updates as the ERP export changes, so re-importing a refreshed file
// updates existing entries and adds new ones without deleting anything.
async function bulkImportNonStockItems(req, res) {
  const rows = Array.isArray(req.body.items) ? req.body.items : [];

  if (rows.length === 0) {
    throw new ApiError(400, 'No items provided');
  }
  if (rows.length > 5000) {
    throw new ApiError(400, 'Too many rows in one batch (max 5000)');
  }

  const errors = [];
  const operations = [];

  rows.forEach((row, i) => {
    const rowNum = i + 1;
    const partNumber = row.partNumber ? String(row.partNumber).trim() : '';
    const partDescription = row.partDescription ? String(row.partDescription).trim() : '';

    if (!partNumber || !partDescription) {
      errors.push({ row: rowNum, partNumber, message: 'Missing part number or description' });
      return;
    }

    const leadTimeDays = row.leadTimeDays === '' || row.leadTimeDays === undefined || row.leadTimeDays === null
      ? null
      : Number(row.leadTimeDays);
    const unitCost = row.unitCost === '' || row.unitCost === undefined || row.unitCost === null
      ? null
      : Number(row.unitCost);

    operations.push({
      updateOne: {
        filter: { partNumber },
        update: {
          $set: {
            partDescription,
            supplier: row.supplier || '',
            leadTimeDays: Number.isNaN(leadTimeDays) ? null : leadTimeDays,
            unitCost: Number.isNaN(unitCost) ? null : unitCost,
            storageLocation: row.storageLocation || '',
            pickClass: row.pickClass || '',
          },
        },
        upsert: true,
      },
    });
  });

  let upsertedCount = 0;
  let modifiedCount = 0;
  if (operations.length > 0) {
    const result = await NonStockItem.bulkWrite(operations, { ordered: false });
    upsertedCount = result.upsertedCount || 0;
    modifiedCount = result.modifiedCount || 0;
  }

  res.status(201).json({
    upsertedCount,
    modifiedCount,
    errors,
    errorCount: errors.length,
  });
}

async function deleteNonStockItem(req, res) {
  const { id } = req.params;
  const item = await NonStockItem.findById(id);
  if (!item) {
    throw new ApiError(404, 'Item not found');
  }
  await item.deleteOne();
  res.json({ ok: true });
}

module.exports = { listNonStockItems, bulkImportNonStockItems, deleteNonStockItem };

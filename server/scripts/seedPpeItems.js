require('dotenv').config();
const mongoose = require('mongoose');
const { SparePart } = require('../src/models/SparePart');
const { getNextSequence } = require('../src/utils/sequence');
const { getDefaultStoreId } = require('../src/utils/defaultStore');
const { CATEGORIES, FOOTWEAR_CATEGORIES } = require('./ppeItemsData');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const store = await getDefaultStoreId();

  let createdCount = 0;
  let skippedCount = 0;

  for (const category of CATEGORIES) {
    const unitOfMeasure = FOOTWEAR_CATEGORIES.has(category.name) ? 'Pair' : 'EA';

    for (const [size, min, max] of category.sizes) {
      const partDescription = `${category.name} - ${size}`;

      const existing = await SparePart.findOne({ partDescription, partType: 'Consumable' });
      if (existing) {
        console.log(`Skip (already exists): ${partDescription}`);
        skippedCount += 1;
        continue;
      }

      const partNumber = await getNextSequence('sparePartNumber', 'SP');

      await SparePart.create({
        partNumber,
        partDescription,
        partType: 'Consumable',
        stockOnHand: 0,
        minimumStockLevel: min,
        maximumStockLevel: max,
        unitOfMeasure,
        status: 'Active',
        store,
      });

      console.log(`Created ${partNumber}: ${partDescription} (min ${min}, max ${max}, ${unitOfMeasure})`);
      createdCount += 1;
    }
  }

  console.log(`\nDone. Created ${createdCount}, skipped ${skippedCount} (already existed).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

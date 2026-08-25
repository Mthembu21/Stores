const { Store } = require('../models/Store');

let cachedStoreId = null;

async function ensureDefaultStore() {
  const store = await Store.findOneAndUpdate(
    { code: 'MAIN' },
    { $setOnInsert: { name: 'Main Store', code: 'MAIN', isActive: true } },
    { upsert: true, new: true }
  );
  cachedStoreId = store._id;
  return store;
}

async function getDefaultStoreId() {
  if (cachedStoreId) return cachedStoreId;
  const store = await ensureDefaultStore();
  return store._id;
}

module.exports = { ensureDefaultStore, getDefaultStoreId };

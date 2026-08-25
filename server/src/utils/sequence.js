const { Counter } = require('../models/Counter');

async function getNextSequence(name, prefix, pad = 5) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `${prefix}-${String(counter.seq).padStart(pad, '0')}`;
}

module.exports = { getNextSequence };

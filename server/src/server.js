require('dotenv').config();
require('express-async-errors');

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI env var');
  }

  await mongoose.connect(process.env.MONGO_URI);

  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

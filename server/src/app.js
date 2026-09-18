const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOriginsFromEnv = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// CORS must run before body parsing — otherwise a request body-parser rejects (e.g.
// too large) errors out before CORS headers are ever attached, and the browser
// misreports the real error as a CORS failure instead of the actual cause.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOriginsFromEnv.length > 0) {
        return callback(null, allowedOriginsFromEnv.includes(origin));
      }

      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      return callback(null, isLocalhost);
    },
    credentials: true,
  })
);

// Bulk import endpoints (spare parts, non-stock items) can post thousands of rows as
// JSON — well above Express's 100kb default.
app.use(express.json({ limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'epiroc-workshop-api' });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

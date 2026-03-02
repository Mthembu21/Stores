const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/ApiError');
const { User } = require('../models/User');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Unauthorized');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET env var');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (e) {
    throw new ApiError(401, 'Invalid token');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };

const { ApiError } = require('../utils/ApiError');

function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      throw new ApiError(403, 'Forbidden');
    }
    next();
  };
}

module.exports = { requireRole };

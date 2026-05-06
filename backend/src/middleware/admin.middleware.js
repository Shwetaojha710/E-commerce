const ApiError = require('../utils/ApiError');

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  throw new ApiError(403, 'Access denied. Admins only.');
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(403, `Role '${req.user?.role}' is not authorized for this action.`);
    }
    next();
  };
};

module.exports = { adminOnly, authorize };

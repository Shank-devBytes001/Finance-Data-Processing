import { AppError } from '../utils/apiError.js';

// Factory that creates middleware enforcing that the current user has one of the allowed roles
/** @param {...import('@prisma/client').Role} roles */
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions for this action'));
    }
    next();
  };
}

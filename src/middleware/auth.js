import { AppError } from '../utils/apiError.js';
import { verifyToken } from '../utils/jwt.js';

// Decode and verify a Bearer JWT, attaching the user identity to req.user
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or invalid Authorization header'));
  }
  const token = header.slice(7);
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
  if (typeof decoded.sub !== 'string' || !decoded.role) {
    return next(new AppError(401, 'Invalid token payload'));
  }
  req.user = {
    id: decoded.sub,
    role: decoded.role,
    email: typeof decoded.email === 'string' ? decoded.email : '',
  };
  next();
}

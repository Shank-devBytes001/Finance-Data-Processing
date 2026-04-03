import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/apiError.js';
import { comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';

// Remove password before returning user details to callers
function sanitizeUser(user) {
  const { password: _p, ...rest } = user;
  return rest;
}

// Resolve the current user's profile from the database, enforcing "active" status
export async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new AppError(401, 'User no longer exists');
  }
  if (!user.isActive) {
    throw new AppError(403, 'Account is inactive');
  }
  return user;
}

// Verify credentials and return a signed JWT plus a safe user payload
export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new AppError(403, 'Account is inactive');
  }
  const ok = await comparePassword(password, user.password);
  if (!ok) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
}

import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/apiError.js';
import { hashPassword } from '../utils/hash.js';

// Strip sensitive fields from user objects before returning them from services
function sanitizeUser(user) {
  const { password: _p, ...rest } = user;
  return rest;
}

// Return a paginated list of users (for admin screens)
export async function listUsers({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count(),
  ]);
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

// Look up a user by id with a limited public-safe projection
export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
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
    throw new AppError(404, 'User not found');
  }
  return user;
}

// Create a new user with hashed password and optional role/active flags
export async function createUser(data) {
  const email = data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw new AppError(409, 'Email already registered');
  }
  const password = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email,
      password,
      role: data.role ?? 'VIEWER',
      isActive: data.isActive ?? true,
    },
  });
  return sanitizeUser(user);
}

// Update user attributes, including email uniqueness and optional password change
export async function updateUser(id, data) {
  await getUserById(id);
  const update = {};
  if (data.email !== undefined) {
    update.email = data.email.toLowerCase();
    const clash = await prisma.user.findFirst({
      where: { email: update.email, NOT: { id } },
    });
    if (clash) {
      throw new AppError(409, 'Email already in use');
    }
  }
  if (data.password !== undefined) {
    update.password = await hashPassword(data.password);
  }
  if (data.role !== undefined) update.role = data.role;
  if (data.isActive !== undefined) update.isActive = data.isActive;

  const user = await prisma.user.update({
    where: { id },
    data: update,
  });
  return sanitizeUser(user);
}

// Permanently delete a user only when there are no linked financial records
export async function deleteUser(id) {
  await getUserById(id);
  const recordCount = await prisma.record.count({ where: { userId: id } });
  if (recordCount > 0) {
    throw new AppError(
      409,
      'Cannot delete user while financial records are still linked to this account',
    );
  }
  await prisma.user.delete({ where: { id } });
}

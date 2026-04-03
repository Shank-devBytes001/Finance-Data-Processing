import { z } from 'zod';

const roleEnum = z.enum(['VIEWER', 'ANALYST', 'ADMIN']);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: roleEnum.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

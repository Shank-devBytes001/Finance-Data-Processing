import { z } from 'zod';

const recordType = z.enum(['INCOME', 'EXPENSE']);

export const createRecordSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: recordType,
  category: z.string().min(1).max(120),
  date: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
  /** Admin can assign record to another user */
  userId: z.string().uuid().optional(),
});

export const updateRecordSchema = z
  .object({
    amount: z.number().positive().optional(),
    type: recordType.optional(),
    category: z.string().min(1).max(120).optional(),
    date: z.coerce.date().optional(),
    notes: z.string().max(2000).optional().nullable(),
    userId: z.string().uuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

const optionalBool = z
  .preprocess((v) => {
    if (v === 'true' || v === true) return true;
    if (v === 'false' || v === false) return false;
    return undefined;
  }, z.boolean().optional());

export const listRecordsQuerySchema = z.object({
  type: recordType.optional(),
  category: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  includeDeleted: optionalBool,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dashboardQuerySchema = z.object({
  trendGranularity: z.enum(['week', 'month']).default('month'),
  trendBuckets: z.coerce.number().int().min(2).max(24).default(6),
  recentLimit: z.coerce.number().int().min(1).max(50).default(10),
});

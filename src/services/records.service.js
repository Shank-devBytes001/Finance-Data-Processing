import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/apiError.js';

// Build a Prisma "where" clause from list/filters input for records
function buildWhere(filters) {
  const where = {};
  if (!filters.includeDeleted) {
    where.isDeleted = false;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }
  if (filters.search) {
    const q = filters.search.trim();
    if (q) {
      where.OR = [
        { category: { contains: q } },
        { notes: { contains: q } },
      ];
    }
  }
  return where;
}

// Return a paginated + filtered list of financial records
export async function listRecords(filters) {
  const { page, limit, ...rest } = filters;
  const where = buildWhere(rest);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.record.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    }),
    prisma.record.count({ where }),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

// Fetch a single record by id, optionally including soft-deleted ones
export async function getRecordById(id, { includeDeleted = false } = {}) {
  const where = { id };
  if (!includeDeleted) {
    where.isDeleted = false;
  }
  const record = await prisma.record.findFirst({
    where,
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });
  if (!record) {
    throw new AppError(404, 'Record not found');
  }
  return record;
}

// Create a new record, letting admins optionally assign it to another user
export async function createRecord(payload, actor) {
  let userId = actor.id;
  if (payload.userId) {
    if (actor.role !== 'ADMIN') {
      throw new AppError(403, 'Only admins can assign records to other users');
    }
    const target = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!target) {
      throw new AppError(400, 'Target user does not exist');
    }
    userId = payload.userId;
  }

  const { userId: _u, ...data } = payload;
  return prisma.record.create({
    data: {
      ...data,
      userId,
    },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });
}

// Update an existing record and (for admins) optionally reassign ownership
export async function updateRecord(id, payload, actor) {
  const existing = await getRecordById(id);

  let userId = existing.userId;
  if (payload.userId !== undefined) {
    if (actor.role !== 'ADMIN') {
      throw new AppError(403, 'Only admins can reassign record ownership');
    }
    const target = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!target) {
      throw new AppError(400, 'Target user does not exist');
    }
    userId = payload.userId;
  }

  const { userId: _u, ...rest } = payload;
  const data = { ...rest, userId };

  return prisma.record.update({
    where: { id },
    data,
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });
}

// Mark a record as deleted instead of physically removing it
export async function softDeleteRecord(id) {
  await getRecordById(id);
  return prisma.record.update({
    where: { id },
    data: { isDeleted: true },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });
}

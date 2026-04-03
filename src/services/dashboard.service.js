import { prisma } from '../lib/prisma.js';

// Normalize a date to the Monday of its ISO week (00:00 UTC)
function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Return a new Date that is N days from the input date
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Build the starting dates for trend buckets used in the dashboard chart
function buildBucketStarts(granularity, bucketCount) {
  const now = new Date();
  const starts = [];
  for (let i = bucketCount - 1; i >= 0; i--) {
    if (granularity === 'month') {
      starts.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      starts.push(startOfWeekMonday(d));
    }
  }
  return starts;
}

// Check if a record date falls in the same calendar month as the bucket start
function recordInMonthBucket(recordDate, bucketStart) {
  const d = new Date(recordDate);
  return (
    d.getFullYear() === bucketStart.getFullYear() &&
    d.getMonth() === bucketStart.getMonth()
  );
}

// Check if a record date falls inside the [bucketStart, bucketStart+7d) window
function recordInWeekBucket(recordDate, bucketStart) {
  const t = new Date(recordDate).getTime();
  const s = bucketStart.getTime();
  const e = addDays(bucketStart, 7).getTime();
  return t >= s && t < e;
}

// Compute high-level dashboard metrics (totals, category breakdown, trends, recent rows)
export async function getDashboardSummary(options) {
  const {
    trendGranularity = 'month',
    trendBuckets = 6,
    recentLimit = 10,
  } = options;

  const baseWhere = { isDeleted: false };

  const starts = buildBucketStarts(trendGranularity, trendBuckets);

  const [totalsIncome, totalsExpense, byCategory, recentRaw, trendRecords] =
    await Promise.all([
      prisma.record.aggregate({
        where: { ...baseWhere, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.record.aggregate({
        where: { ...baseWhere, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      prisma.record.groupBy({
        by: ['category', 'type'],
        where: baseWhere,
        _sum: { amount: true },
      }),
      prisma.record.findMany({
        where: baseWhere,
        take: recentLimit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.record.findMany({
        where: baseWhere,
        select: { date: true, amount: true, type: true },
      }),
    ]);

  const totalIncome = totalsIncome._sum.amount ?? 0;
  const totalExpense = totalsExpense._sum.amount ?? 0;
  const netBalance = totalIncome - totalExpense;

  const categoryTotals = byCategory.map((row) => ({
    category: row.category,
    type: row.type,
    total: row._sum.amount ?? 0,
  }));

  const trends = starts.map((start) => ({
    periodStart: start.toISOString(),
    label:
      trendGranularity === 'month'
        ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
        : start.toISOString().slice(0, 10),
    income: 0,
    expense: 0,
    net: 0,
  }));

  for (const r of trendRecords) {
    for (let i = 0; i < starts.length; i++) {
      const inBucket =
        trendGranularity === 'month'
          ? recordInMonthBucket(r.date, starts[i])
          : recordInWeekBucket(r.date, starts[i]);
      if (inBucket) {
        if (r.type === 'INCOME') {
          trends[i].income += r.amount;
        } else {
          trends[i].expense += r.amount;
        }
        trends[i].net = trends[i].income - trends[i].expense;
        break;
      }
    }
  }

  return {
    totals: {
      totalIncome,
      totalExpense,
      netBalance,
    },
    categoryTotals,
    trends: {
      granularity: trendGranularity,
      buckets: trends,
    },
    recentActivity: recentRaw,
  };
}

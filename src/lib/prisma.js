import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');

function resolveSqliteUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is not set (e.g. file:./prisma/dev.db)');
  }
  if (!raw.startsWith('file:')) {
    throw new Error('DATABASE_URL must be a SQLite file URL (e.g. file:./prisma/dev.db)');
  }
  const rel = raw.slice('file:'.length).replace(/^\//, '');
  const absolute = path.isAbsolute(rel)
    ? rel
    : path.resolve(projectRoot, rel);
  // Ensure the SQLite directory exists (Render volume mounts can start empty).
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  return `file:${absolute}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqliteUrl(),
});

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

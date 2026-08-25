import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Handle Vercel serverless environment SQLite /tmp path
if (process.env.VERCEL) {
  try {
    const tmpDb = '/tmp/dev.db';
    if (!fs.existsSync(tmpDb)) {
      const localDb = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(localDb)) {
        fs.copyFileSync(localDb, tmpDb);
      }
    }
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  } catch (err) {
    console.error('[Prisma Vercel Setup] Error copying db to /tmp:', err);
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

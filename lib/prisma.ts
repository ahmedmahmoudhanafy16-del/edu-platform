import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl(): string {
  if (process.env.VERCEL) {
    const tmpDb = '/tmp/dev.db';
    try {
      if (!fs.existsSync(tmpDb)) {
        const candidatePaths = [
          path.join(process.cwd(), 'prisma', 'dev.db'),
          path.join(__dirname, '..', 'prisma', 'dev.db'),
          path.join('/var/task', 'prisma', 'dev.db'),
        ];

        for (const p of candidatePaths) {
          if (fs.existsSync(p)) {
            fs.copyFileSync(p, tmpDb);
            try {
              fs.chmodSync(tmpDb, 0o666);
            } catch (e) {}
            console.log(`[Prisma Vercel] Successfully copied database from ${p} to ${tmpDb}`);
            break;
          }
        }
      }
    } catch (err) {
      console.error('[Prisma Vercel Setup] Error copying db to /tmp:', err);
    }
    return 'file:/tmp/dev.db';
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  memoryCodes?: any[];
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Global In-Memory Access Codes Store for 100% resilient fallback on Vercel
if (!globalForPrisma.memoryCodes) {
  globalForPrisma.memoryCodes = [];
}
export const memoryAccessCodes = globalForPrisma.memoryCodes;

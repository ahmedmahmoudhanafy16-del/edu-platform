import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function initDatabase(): string {
  // On Vercel / AWS Lambda serverless functions
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = '/tmp';
    const tmpDb = path.join(tmpDir, 'dev.db');

    try {
      if (!fs.existsSync(tmpDb)) {
        const candidatePaths = [
          path.join(process.cwd(), 'prisma', 'dev.db'),
          path.join(process.cwd(), 'dev.db'),
          path.join('/var/task', 'prisma', 'dev.db'),
          path.join('/var/task', 'dev.db'),
        ];

        let copied = false;
        for (const cand of candidatePaths) {
          if (fs.existsSync(cand)) {
            fs.copyFileSync(cand, tmpDb);
            try {
              fs.chmodSync(tmpDb, 0o666);
            } catch (e) {}
            copied = true;
            console.log(`[Vercel DB Init] Successfully copied database from ${cand} to ${tmpDb}`);
            break;
          }
        }

        if (!copied) {
          console.warn('[Vercel DB Init] No dev.db found to copy, will create new in /tmp');
        }
      }

      return `file:${tmpDb}`;
    } catch (e) {
      console.error('[Vercel DB Init Error]', e);
    }
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

const dbUrl = initDatabase();
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

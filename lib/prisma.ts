import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// On Vercel / serverless runtime with SQLite: copy bundled dev.db to /tmp so SQLite is writable!
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const currentDbUrl = process.env.DATABASE_URL || '';
  if (!currentDbUrl || currentDbUrl.startsWith('file:')) {
    const tmpDbPath = path.join('/tmp', 'dev.db');
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.join(__dirname, '..', 'prisma', 'dev.db'),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          try {
            fs.copyFileSync(cand, tmpDbPath);
            console.log('[Prisma Init] Successfully copied dev.db to /tmp/dev.db');
            break;
          } catch (e) {}
        }
      }
    }
    if (fs.existsSync(tmpDbPath)) {
      process.env.DATABASE_URL = 'file:/tmp/dev.db';
    }
  }
}

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  memoryCodes?: any[];
  memoryQuizResults?: any[];
  memoryUnlockedQuizzes?: any[];
  memoryQuizzes?: any[];
  memoryAssignments?: any[];
};

// Global singleton instance for serverless Next.js
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Always cache in global scope for warm serverless lambda invocations
globalForPrisma.prisma = prisma;

// In-Memory Stores for 100% resilient fallback on Serverless Staging
if (!globalForPrisma.memoryCodes) {
  globalForPrisma.memoryCodes = [];
}
export const memoryAccessCodes = globalForPrisma.memoryCodes;

if (!globalForPrisma.memoryQuizResults) {
  globalForPrisma.memoryQuizResults = [];
}
export const memoryQuizResults = globalForPrisma.memoryQuizResults;

if (!globalForPrisma.memoryUnlockedQuizzes) {
  globalForPrisma.memoryUnlockedQuizzes = [];
}
export const memoryUnlockedQuizzes = globalForPrisma.memoryUnlockedQuizzes;

if (!globalForPrisma.memoryQuizzes) {
  globalForPrisma.memoryQuizzes = [];
}
export const memoryQuizzes = globalForPrisma.memoryQuizzes;

if (!globalForPrisma.memoryAssignments) {
  globalForPrisma.memoryAssignments = [];
}
export const memoryAssignments = globalForPrisma.memoryAssignments;

/**
 * Checks if a Prisma / Database error is caused by SQLite serverless read-only filesystem (Error 14)
 * or missing cloud database connection.
 */
export function isDatabaseReadOnlyError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  const code = String(error.code || '');
  return (
    msg.includes('unable to open the database file') ||
    msg.includes('attempt to write a readonly database') ||
    msg.includes('sqlite_cantopen') ||
    msg.includes('error 14') ||
    msg.includes('read-only file system') ||
    code === 'P2021' ||
    code === 'P2022'
  );
}

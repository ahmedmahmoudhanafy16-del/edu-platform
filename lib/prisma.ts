import { PrismaClient } from '@prisma/client';

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

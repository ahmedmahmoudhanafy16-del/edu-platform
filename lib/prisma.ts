import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  memoryCodes?: any[];
  memoryQuizResults?: any[];
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
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

// Global In-Memory Quiz Results Store for 100% resilient fallback on Vercel
if (!globalForPrisma.memoryQuizResults) {
  globalForPrisma.memoryQuizResults = [];
}
export const memoryQuizResults = globalForPrisma.memoryQuizResults;

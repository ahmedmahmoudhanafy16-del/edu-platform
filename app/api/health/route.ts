import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'UNKNOWN';
  let dbLatencyMs = 0;

  try {
    // Fast ping query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'CONNECTED';
    dbLatencyMs = Date.now() - startTime;
  } catch (err: any) {
    dbStatus = 'DEGRADED_OR_IN_MEMORY';
    dbLatencyMs = Date.now() - startTime;
  }

  const payload = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    system: {
      platform: process.platform,
      nodeVersion: process.version,
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

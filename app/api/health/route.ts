import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

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

  let supabaseStatus = 'DISCONNECTED';
  let supabaseStudentCount = 0;
  let supabaseLatencyMs = 0;
  const sbStartTime = Date.now();
  try {
    if (isSupabaseConfigured()) {
      const client = getSupabaseServerClient();
      const { count, error } = await client
        .from('students')
        .select('*', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        supabaseStatus = 'CONNECTED';
        supabaseStudentCount = count;
        supabaseLatencyMs = Date.now() - sbStartTime;
      } else {
        supabaseStatus = `ERROR: ${error?.message || 'unknown'}`;
      }
    }
  } catch (e: any) {
    supabaseStatus = `FATAL: ${e?.message || 'unknown'}`;
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
    supabase: {
      status: supabaseStatus,
      studentCount: supabaseStudentCount,
      latencyMs: supabaseLatencyMs,
    },
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

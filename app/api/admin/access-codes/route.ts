import { NextRequest, NextResponse } from 'next/server';
import { prisma, memoryAccessCodes } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 1. Auth check
    const rawSession = req.cookies.get('user_session')?.value;
    let sessionUser: any = null;
    if (rawSession) {
      try {
        sessionUser = JSON.parse(decodeURIComponent(rawSession));
      } catch (err) {
        try {
          sessionUser = JSON.parse(rawSession);
        } catch (e2) {}
      }
    }

    if (!sessionUser || (sessionUser.role !== 'TEACHER' && sessionUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'غير مصرح لك باستعراض أكواد الحصص (يتطلب حساب معلم)' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    const whereClause: any = {};
    if (sessionId && sessionId !== 'ALL') {
      whereClause.liveSessionId = sessionId;
    }

    let dbCodes: any[] = [];
    try {
      dbCodes = await prisma.sessionAccessCode.findMany({
        where: whereClause,
        include: {
          liveSession: {
            select: { id: true, title: true, roomCode: true, isActive: true },
          },
          usedByStudent: {
            select: { id: true, name: true, studentCode: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('[Get Access Codes] Prisma query error:', err);
    }

    const now = new Date();

    const formattedDb = dbCodes.map((c) => {
      let status: 'USED' | 'AVAILABLE' | 'EXPIRED' = 'AVAILABLE';
      if (c.usedByStudentId || c.usedAt) {
        status = 'USED';
      } else if (c.expiresAt && now > new Date(c.expiresAt)) {
        status = 'EXPIRED';
      }

      return {
        id: c.id,
        code: c.code,
        price: c.price,
        liveSessionId: c.liveSessionId,
        liveSessionTitle: c.liveSession?.title || 'الحصة المباشرة',
        roomCode: c.liveSession?.roomCode || 'LIVE-ROOM',
        usedByStudentId: c.usedByStudentId,
        studentName: c.usedByStudent?.name || null,
        studentCode: c.usedByStudent?.studentCode || null,
        usedAt: c.usedAt ? c.usedAt.toISOString() : null,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        status,
      };
    });

    // Merge in-memory codes (filter out any duplicates already in DB)
    const existingDbCodes = new Set(formattedDb.map((c) => c.code));
    const memoryFiltered = memoryAccessCodes
      .filter((m: any) => !existingDbCodes.has(m.code))
      .filter((m: any) => !sessionId || sessionId === 'ALL' || m.liveSessionId === sessionId);

    const allCodes = [...formattedDb, ...memoryFiltered];

    return NextResponse.json({
      success: true,
      count: allCodes.length,
      codes: allCodes,
    });
  } catch (error: any) {
    console.error('[Get Access Codes Error]:', error);
    return NextResponse.json({ error: error.message || 'فشل في جلب الأكواد' }, { status: 500 });
  }
}

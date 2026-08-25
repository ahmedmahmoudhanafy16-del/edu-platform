import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `EDU-${seg(4)}-${seg(4)}`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Check Authentication (Teacher Only)
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
        { error: 'غير مصرح لك بتوليد أكواد الوصول (يتطلب حساب معلم)' },
        { status: 403 }
      );
    }

    // 2. Parse Request Body
    const body = await req.json();
    const { liveSessionId, quantity = 10, price = 0, expiresAt = null } = body;

    if (!liveSessionId) {
      return NextResponse.json({ error: 'معرف الحصة المباشرة مطلوب' }, { status: 400 });
    }

    const numCodes = Math.min(Math.max(1, parseInt(quantity, 10) || 10), 100);
    const parsedPrice = parseFloat(price) || 0;
    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;

    // 3. Verify Live Session Exists
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: liveSessionId },
    });

    if (!liveSession) {
      return NextResponse.json({ error: 'الحصة المباشرة المحددة غير موجودة' }, { status: 404 });
    }

    // 4. Generate Unique Codes
    const generatedCodes: string[] = [];
    const createdRecords = [];

    // Fetch existing codes to prevent duplicate collisions
    const existing = await prisma.sessionAccessCode.findMany({
      select: { code: true },
    });
    const existingSet = new Set(existing.map((e) => e.code));

    while (generatedCodes.length < numCodes) {
      const newCode = generateCode();
      if (!existingSet.has(newCode) && !generatedCodes.includes(newCode)) {
        generatedCodes.push(newCode);
        existingSet.add(newCode);
      }
    }

    // 5. Save to Database
    for (const code of generatedCodes) {
      const record = await prisma.sessionAccessCode.create({
        data: {
          code,
          liveSessionId,
          price: parsedPrice,
          expiresAt: parsedExpiresAt,
        },
      });
      createdRecords.push(record);
    }

    return NextResponse.json({
      success: true,
      count: generatedCodes.length,
      codes: generatedCodes,
      records: createdRecords,
    });
  } catch (error: any) {
    console.error('[Generate Access Codes Error]:', error);
    return NextResponse.json({ error: error.message || 'فشل في توليد الأكواد' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma, memoryAccessCodes } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Student
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

    if (!sessionUser) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول كطالب أولاً' }, { status: 401 });
    }

    const studentId = sessionUser.id;
    const studentName = sessionUser.name || 'الطالب';

    // 2. Parse & Sanitize Input
    const body = await req.json();
    const cleanCode = body?.code?.trim()?.toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ error: 'يرجى إدخال كود الجلسة' }, { status: 400 });
    }

    // 3. Find Code in Database or In-Memory Store
    let accessCode: any = null;
    let isMemoryCode = false;

    try {
      accessCode = await prisma.sessionAccessCode.findUnique({
        where: { code: cleanCode },
        include: {
          liveSession: {
            include: { classroom: true },
          },
        },
      });
    } catch (dbFindErr) {
      console.warn('[Redeem Code] DB findUnique error:', dbFindErr);
    }

    if (!accessCode) {
      const memMatch = memoryAccessCodes.find((m: any) => m.code === cleanCode);
      if (memMatch) {
        accessCode = {
          id: memMatch.id,
          code: memMatch.code,
          liveSessionId: memMatch.liveSessionId,
          usedByStudentId: memMatch.usedByStudentId,
          usedAt: memMatch.usedAt,
          expiresAt: memMatch.expiresAt,
          liveSession: {
            id: memMatch.liveSessionId,
            title: memMatch.liveSessionTitle || 'مراجعة شاملة للوحدة الأولى والبث المباشر',
            roomCode: memMatch.roomCode || 'LIVE-MATH1',
            isActive: true,
            classroom: { name: 'الصف الثالث الإعدادي - رياضيات' },
          },
        };
        isMemoryCode = true;
      }
    }

    if (!accessCode) {
      return NextResponse.json({ error: 'الكود غير موجود، يرجى التأكد من كتابة الكود بشكل صحيح' }, { status: 404 });
    }

    // 4. Check if already used
    if (accessCode.usedByStudentId || accessCode.usedAt) {
      return NextResponse.json({ error: 'الكود مستخدم بالفعل من قبل طالب آخر' }, { status: 400 });
    }

    // 5. Check if expired
    if (accessCode.expiresAt && new Date() > new Date(accessCode.expiresAt)) {
      return NextResponse.json({ error: 'انتهت صلاحية هذا الكود' }, { status: 400 });
    }

    // 6. Check if student already unlocked this live session
    let alreadyUnlocked = false;
    try {
      const existing = await prisma.sessionAccessCode.findFirst({
        where: {
          liveSessionId: accessCode.liveSessionId,
          usedByStudentId: studentId,
        },
      });
      if (existing) alreadyUnlocked = true;
    } catch (e) {}

    if (!alreadyUnlocked) {
      const memExisting = memoryAccessCodes.find(
        (m: any) => m.liveSessionId === accessCode.liveSessionId && m.usedByStudentId === studentId
      );
      if (memExisting) alreadyUnlocked = true;
    }

    if (alreadyUnlocked) {
      return NextResponse.json(
        { error: 'لديك حق الوصول إلى هذه الحصة بالفعل، يمكنك الانضمام مباشرة من لوحة التحكم' },
        { status: 400 }
      );
    }

    // 7. Redeem Code in DB (with in-memory fallback)
    try {
      await prisma.sessionAccessCode.update({
        where: { id: accessCode.id },
        data: {
          usedByStudentId: studentId,
          usedAt: new Date(),
        },
      });
    } catch (dbUpdateErr: any) {
      console.warn('[Redeem Code] DB update skipped (using memory store):', dbUpdateErr?.message);
    }

    // Always update in-memory record
    const memIndex = memoryAccessCodes.findIndex((m: any) => m.code === cleanCode);
    if (memIndex >= 0) {
      memoryAccessCodes[memIndex].usedByStudentId = studentId;
      memoryAccessCodes[memIndex].studentName = studentName;
      memoryAccessCodes[memIndex].usedAt = new Date().toISOString();
      memoryAccessCodes[memIndex].status = 'USED';
    } else {
      memoryAccessCodes.push({
        id: accessCode.id,
        code: accessCode.code,
        liveSessionId: accessCode.liveSessionId,
        liveSessionTitle: accessCode.liveSession.title,
        roomCode: accessCode.liveSession.roomCode,
        usedByStudentId: studentId,
        studentName,
        usedAt: new Date().toISOString(),
        status: 'USED',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل الكود بنجاح والاشتراك في الحصة المباشرة!',
      code: accessCode.code,
      liveSession: {
        id: accessCode.liveSession.id,
        title: accessCode.liveSession.title,
        roomCode: accessCode.liveSession.roomCode,
        isActive: accessCode.liveSession.isActive,
        classroomName: accessCode.liveSession.classroom?.name,
      },
    });
  } catch (error: any) {
    console.error('[Redeem Code Error]:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء تفعيل الكود' }, { status: 500 });
  }
}

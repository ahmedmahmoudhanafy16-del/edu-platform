import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // 2. Parse & Sanitize Input
    const body = await req.json();
    const cleanCode = body?.code?.trim()?.toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ error: 'يرجى إدخال كود الجلسة' }, { status: 400 });
    }

    // 3. Find Code in Database
    const accessCode = await prisma.sessionAccessCode.findUnique({
      where: { code: cleanCode },
      include: {
        liveSession: {
          include: { classroom: true },
        },
      },
    });

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
    const alreadyUnlocked = await prisma.sessionAccessCode.findFirst({
      where: {
        liveSessionId: accessCode.liveSessionId,
        usedByStudentId: studentId,
      },
    });

    if (alreadyUnlocked) {
      return NextResponse.json(
        { error: 'لديك حق الوصول إلى هذه الحصة بالفعل، يمكنك الانضمام مباشرة من لوحة التحكم' },
        { status: 400 }
      );
    }

    // 7. Redeem Code
    const updatedCode = await prisma.sessionAccessCode.update({
      where: { id: accessCode.id },
      data: {
        usedByStudentId: studentId,
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل الكود بنجاح والاشتراك في الحصة المباشرة!',
      code: updatedCode.code,
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

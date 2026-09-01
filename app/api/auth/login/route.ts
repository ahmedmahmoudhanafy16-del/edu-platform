import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, studentCode, password, role } = await req.json();

    const rawPassword = String(password ?? '').trim();

    if (!rawPassword) {
      return NextResponse.json(
        { error: 'كلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    // Find user from REAL database ONLY — no demo fallbacks
    let user: any = null;

    if (role === 'TEACHER') {
      const cleanEmail = String(email ?? '').trim();
      user = await prisma.user.findFirst({
        where: {
          role: 'TEACHER',
          OR: [{ email: cleanEmail }, { phone: cleanEmail }],
        },
      });
    } else {
      // Student can login with studentCode, phone, or name
      const cleanInput = String(studentCode ?? '').trim();
      const cleanUpper = cleanInput.toUpperCase();

      user = await prisma.user.findFirst({
        where: {
          role: 'STUDENT',
          OR: [
            { studentCode: cleanInput },
            { studentCode: cleanUpper },
            { phone: cleanInput },
            { id: cleanInput },
            { name: cleanInput },
          ],
        },
      });
    }

    // NOT found in real DB → reject immediately, no fallback
    if (!user) {
      return NextResponse.json(
        { error: 'كود الطالب أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.role === 'STUDENT' && user.isActive === false) {
      return NextResponse.json(
        {
          error: 'SUSPENDED',
          message: 'تم تعليق هذا الحساب. يرجى مراجعة المعلمة.',
        },
        { status: 403 }
      );
    }

    // Password check: plain text (against password or defaultPassword) OR bcrypt
    let isMatch = false;

    if (rawPassword === String(user.password ?? '') || (user.defaultPassword && rawPassword === String(user.defaultPassword))) {
      isMatch = true;
    } else if (user.password && String(user.password).startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(rawPassword, String(user.password));
      } catch {
        isMatch = false;
      }
    }

    // Also check passwordHash field if present
    if (!isMatch && user.passwordHash && String(user.passwordHash).startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(rawPassword, String(user.passwordHash));
      } catch {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'كود الطالب أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Success — set session cookie and return payload
    const sessionPayload = {
      id: user.id,
      name: user.name,
      role: user.role,
      studentCode: user.studentCode || undefined,
      grade: user.grade || 'الصف الثالث الإعدادي',
      isActive: user.isActive !== false,
    };

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    response.cookies.set('user_session', JSON.stringify(sessionPayload), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('[Auth Login] Database error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة لاحقاً' },
      { status: 500 }
    );
  }
}

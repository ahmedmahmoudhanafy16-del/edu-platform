import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

function toStandardDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

const SEED_USERS: any[] = [
  {
    id: 'teacher-admin-1',
    name: 'المعلم',
    email: 'teacher@school.com',
    phone: '',
    role: 'TEACHER',
    password: 'teacher123',
    passwordHash: '$2a$10$w8.1k9rJ8e4Fq.qXn2.eGe1XmP5s7mKz3n8q2w5e7r9t1y3u5i7o9',
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, studentCode, password, role } = body;

    const rawPassword = toStandardDigits(String(password ?? '').trim());

    if (!rawPassword) {
      return NextResponse.json(
        { error: 'كلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    const cleanInput = toStandardDigits(String(studentCode ?? '').trim());
    const cleanUpper = cleanInput.toUpperCase();
    const cleanLower = cleanInput.toLowerCase();

    // ── Teacher Authentication ─────────────────────────────────────────────
    if (role === 'TEACHER' || (!cleanInput && email)) {
      const cleanEmail = String(email ?? '').trim().toLowerCase();
      let teacherUser: any = null;

      try {
        teacherUser = await prisma.user.findFirst({
          where: {
            role: 'TEACHER',
            OR: [{ email: cleanEmail }, { phone: cleanEmail }],
          },
        });
      } catch (dbErr) {
        console.warn('[Teacher Login] Database query skipped:', dbErr);
      }

      if (!teacherUser) {
        const memTeacher = (global as any).memoryTeacher || (global as any).prisma?.memoryTeacher;
        if (
          memTeacher &&
          ((memTeacher.email && memTeacher.email.toLowerCase() === cleanEmail) ||
            (memTeacher.phone && memTeacher.phone === cleanEmail) ||
            cleanEmail === 'teacher@school.com')
        ) {
          teacherUser = memTeacher;
        } else {
          teacherUser = SEED_USERS.find(
            (u) =>
              u.role === 'TEACHER' &&
              ((u.email && u.email.toLowerCase() === cleanEmail) ||
                (u.phone && u.phone === cleanEmail))
          );
        }
      }

      if (!teacherUser) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 }
        );
      }

      // Verify teacher password
      let isTeacherPassMatch = false;
      const tPass = String(teacherUser.password || '').trim();
      const tHash = String(teacherUser.passwordHash || '').trim();

      if (tPass && rawPassword === tPass) {
        isTeacherPassMatch = true;
      } else if (tHash && tHash.startsWith('$2')) {
        try {
          isTeacherPassMatch = await bcrypt.compare(rawPassword, tHash);
        } catch {
          isTeacherPassMatch = false;
        }
      }

      if (!isTeacherPassMatch) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 }
        );
      }

      const teacherSession = {
        id: teacherUser.id || 'teacher-admin-1',
        name: teacherUser.name || 'المعلم',
        role: 'TEACHER',
        email: teacherUser.email || 'teacher@school.com',
        phone: teacherUser.phone || '',
        isActive: true,
      };

      const res = NextResponse.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        user: teacherSession,
      });

      res.cookies.set('user_session', JSON.stringify(teacherSession), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      return res;
    }

    // ── Student Authentication (Supabase Central Production Database) ──────
    if (!cleanInput) {
      return NextResponse.json(
        { error: 'يرجى إدخال كود الطالب أو رقم الهاتف' },
        { status: 400 }
      );
    }

    // 1. Direct query to Supabase central 'students' table
    try {
      const { data: student, error: sbError } = await supabase
        .from('students')
        .select('id, student_code, full_name, grade_level, is_active, password_hash, phone, parent_phone')
        .or(`student_code.eq.${cleanInput},student_code.eq.${cleanUpper},student_code.eq.${cleanLower},phone.eq.${cleanInput}`)
        .maybeSingle();

      if (!sbError && student) {
        if (student.is_active === false) {
          return NextResponse.json(
            { error: 'SUSPENDED', message: 'هذا الحساب معطل، يرجى مراجعة إدارة المنصة' },
            { status: 403 }
          );
        }

        // Verify student password (plain text or bcrypt hash)
        let isStudentMatch = false;
        const storedHash = String(student.password_hash || '').trim();

        if (storedHash === rawPassword) {
          isStudentMatch = true;
        } else if (storedHash.startsWith('$2')) {
          try {
            isStudentMatch = await bcrypt.compare(rawPassword, storedHash);
          } catch {
            isStudentMatch = false;
          }
        }

        if (!isStudentMatch) {
          return NextResponse.json(
            { error: 'كلمة المرور غير صحيحة' },
            { status: 401 }
          );
        }

        const sessionPayload = {
          id: student.id,
          name: student.full_name,
          role: 'STUDENT',
          studentCode: student.student_code,
          phone: student.phone || '',
          parentPhone: student.parent_phone || '',
          grade: student.grade_level || '',
          isActive: true,
        };

        const response = NextResponse.json({
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          user: sessionPayload,
        });

        response.cookies.set('user_session', JSON.stringify(sessionPayload), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });

        return response;
      }
    } catch (sbErr: any) {
      console.warn('[Student Login] Supabase query notice:', sbErr?.message);
    }

    // 2. Secondary fallback: Local/Relational Prisma Database
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          role: 'STUDENT',
          OR: [
            { studentCode: cleanInput },
            { studentCode: cleanUpper },
            { phone: cleanInput },
            { id: cleanInput },
          ],
        },
      });
    } catch (dbErr) {
      console.warn('[Student Login] DB query skipped:', dbErr);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'كود الطالب غير صحيح أو غير مسجل' },
        { status: 404 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: 'SUSPENDED', message: 'هذا الحساب معطل، يرجى مراجعة إدارة المنصة' },
        { status: 403 }
      );
    }

    // Password verification for fallback user
    let isMatch = false;
    const userPass = String(user.password ?? '').trim();
    const userDefPass = String(user.defaultPassword ?? '').trim();

    if (
      (userPass && rawPassword === userPass) ||
      (userDefPass && rawPassword === userDefPass)
    ) {
      isMatch = true;
    } else if (user.password && String(user.password).startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(rawPassword, String(user.password));
      } catch {
        isMatch = false;
      }
    }

    if (!isMatch && user.passwordHash && String(user.passwordHash).startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(rawPassword, String(user.passwordHash));
      } catch {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Success payload
    const sessionPayload = {
      id: user.id || user.studentCode,
      name: user.name,
      role: user.role,
      studentCode: user.studentCode || undefined,
      email: user.email || undefined,
      phone: user.phone || undefined,
      grade: user.grade || '',
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
    console.error('[Auth Login] Fatal Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}

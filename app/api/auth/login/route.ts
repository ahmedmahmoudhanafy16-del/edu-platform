import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase, getTeacherFromSupabase } from '@/lib/supabase';
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

    // ── 1. Teacher Authentication (Authoritative Supabase & Cloud DB) ─────
    if (role === 'TEACHER' || (!cleanInput && email)) {
      const cleanEmail = String(email ?? '').trim().toLowerCase();

      // Step A: Check Supabase PostgreSQL teachers table first
      let teacherRecord: any = null;
      try {
        teacherRecord = await getTeacherFromSupabase(cleanEmail);
      } catch (sbErr) {
        console.warn('[Teacher Login] Supabase query notice:', sbErr);
      }

      // Step B: If not in Supabase yet, check relational Prisma user table
      if (!teacherRecord) {
        try {
          teacherRecord = await prisma.user.findFirst({
            where: {
              role: 'TEACHER',
              OR: [{ email: cleanEmail }, { phone: cleanEmail }],
            },
          });
        } catch (dbErr) {
          console.warn('[Teacher Login] Prisma query notice:', dbErr);
        }
      }

      // Step C: If still no DB record, check bootstrap teacher identity
      let isTeacherPassMatch = false;
      let teacherName = 'أ/ رشا';
      let teacherEmail = 'Rasha@yahoo.com';
      let teacherPhone = '01117633351';
      let teacherId = 'teacher-admin-1';

      if (teacherRecord) {
        teacherId = teacherRecord.id || teacherId;
        teacherName = teacherRecord.name || teacherName;
        teacherEmail = teacherRecord.email || teacherEmail;
        teacherPhone = teacherRecord.phone || teacherPhone;

        const storedPass = String(teacherRecord.password || '').trim();
        const storedHash = String(teacherRecord.password_hash || teacherRecord.passwordHash || '').trim();

        if (storedPass && rawPassword === storedPass) {
          isTeacherPassMatch = true;
        } else if (storedHash && (rawPassword === storedHash || storedHash === 'Rasha1980' || storedHash === 'Rasha1900')) {
          isTeacherPassMatch = true;
        } else if (storedHash && storedHash.startsWith('$2')) {
          try {
            isTeacherPassMatch = await bcrypt.compare(rawPassword, storedHash);
          } catch {
            isTeacherPassMatch = false;
          }
        }

        // Failsafe bootstrap fallback for teacher account
        if (!isTeacherPassMatch && (cleanEmail === 'rasha@yahoo.com' || cleanEmail === '01117633351')) {
          if (rawPassword === 'Rasha1980' || rawPassword === 'Rasha1900') {
            isTeacherPassMatch = true;
          }
        }
      } else if (cleanEmail === 'rasha@yahoo.com' || cleanEmail === '01117633351') {
        // Bootstrap credential: accept both initial and updated passwords
        if (rawPassword === 'Rasha1980' || rawPassword === 'Rasha1900') {
          isTeacherPassMatch = true;
        }
      }

      if (!isTeacherPassMatch) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 }
        );
      }

      const teacherSession = {
        id: teacherId,
        name: teacherName,
        role: 'TEACHER',
        email: teacherEmail,
        phone: teacherPhone,
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

    // ── 2. Student Authentication (Supabase Central Production Database) ──
    if (!cleanInput) {
      return NextResponse.json(
        { error: 'يرجى إدخال كود الطالب أو رقم الهاتف' },
        { status: 400 }
      );
    }

    // Direct query to Supabase central 'students' table
    try {
      const { data: student, error: sbError } = await supabase
        .from('students')
        .select('id, student_code, full_name, grade_level, is_active, password_hash, phone, parent_phone')
        .or(`student_code.eq.${cleanInput},student_code.eq.${cleanUpper},student_code.eq.${cleanLower},phone.eq.${cleanInput}`)
        .not('student_code', 'like', '\\_\\_%')
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

    // Secondary fallback: Prisma Database
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
      console.warn('[Student Login] DB query notice:', dbErr);
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

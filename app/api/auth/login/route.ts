import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ');
}

const DEMO_USERS = [
  {
    id: 'demo-student-1',
    name: 'أحمد محمد علي',
    studentCode: 'STU-001',
    phone: '01099998888',
    password: '4829',
    defaultPassword: '4829',
    role: 'STUDENT',
    grade: 'الصف الثالث الإعدادي',
  },
  {
    id: 'demo-student-633',
    name: 'أحمد محمود أحمد',
    studentCode: 'STU-633',
    phone: '01012345678',
    password: '9715',
    defaultPassword: '9715',
    role: 'STUDENT',
    grade: 'الصف الثالث الإعدادي',
  },
  {
    id: 'demo-student-2',
    name: 'زياد طارق إبراهيم',
    studentCode: 'STU-777',
    phone: '01055554444',
    password: '6341',
    defaultPassword: '6341',
    role: 'STUDENT',
    grade: 'الصف الثالث الإعدادي',
  },
  {
    id: 'demo-teacher-1',
    name: 'أ/ سارة أحمد',
    email: 'teacher@school.com',
    phone: '01011112222',
    password: 'teacher123',
    role: 'TEACHER',
  },
];

export async function POST(req: NextRequest) {
  try {
    const { email, studentCode, password, role, localStudent } = await req.json();

    const raw = String(password ?? '').trim();
    let user: any = null;

    // 1. Try resolving user from Prisma DB
    try {
      if (role === 'TEACHER') {
        const cleanEmail = email?.toString().trim();
        user = await prisma.user.findFirst({
          where: {
            role: 'TEACHER',
            OR: [{ email: cleanEmail }, { phone: cleanEmail }],
          },
        });
      } else {
        const cleanInput = (studentCode?.toString() || '').trim();
        const cleanUpper = cleanInput.toUpperCase();
        user = await prisma.user.findFirst({
          where: {
            role: 'STUDENT',
            OR: [
              { studentCode: cleanInput },
              { studentCode: cleanUpper },
              { phone: cleanInput },
              { name: cleanInput },
              { name: { contains: cleanInput } },
            ],
          },
        });
      }
    } catch (dbErr) {
      console.warn('[Auth Login] Database lookup failed:', dbErr);
    }

    // 1.5 Try resolving from localStudent if provided by client store
    if (!user && localStudent && role !== 'TEACHER') {
      const cleanInput = (studentCode?.toString() || '').trim();
      const cleanUpper = cleanInput.toUpperCase();
      const normInput = normalizeArabic(cleanInput);

      const sCode = (localStudent.studentCode || localStudent.code || localStudent.id || '').toString().trim().toUpperCase();
      const sPhone = (localStudent.phone || '').toString().trim();
      const sName = (localStudent.name || '').toString().trim();
      const sNameNorm = normalizeArabic(sName);

      const isIdentifierMatch =
        sCode === cleanUpper ||
        sPhone === cleanInput ||
        sName.toLowerCase() === cleanInput.toLowerCase() ||
        (sNameNorm && (sNameNorm === normInput || sNameNorm.includes(normInput) || normInput.includes(sNameNorm)));

      const sPass = String(localStudent.password ?? localStudent.defaultPassword ?? '1234').trim();
      const sDefPass = String(localStudent.defaultPassword ?? localStudent.password ?? '1234').trim();

      if (isIdentifierMatch && (sPass === raw || sDefPass === raw)) {
        user = {
          id: localStudent.id || sCode,
          name: localStudent.name,
          role: 'STUDENT',
          studentCode: sCode,
          phone: sPhone,
          grade: localStudent.grade || localStudent.gradeLevel || 'الصف الثالث الإعدادي',
          password: sPass || sDefPass,
          defaultPassword: sDefPass || sPass,
          isActive: localStudent.isActive !== false,
        };
      }
    }

    // 2. Fallback to Demo Directory
    if (!user) {
      if (role === 'TEACHER') {
        const cleanEmail = email?.toString().trim().toLowerCase();
        user = DEMO_USERS.find(
          (u) => u.role === 'TEACHER' && ((u.email && u.email.toLowerCase() === cleanEmail) || u.phone === cleanEmail)
        );
      } else {
        const cleanInput = (studentCode?.toString() || '').trim();
        const cleanUpper = cleanInput.toUpperCase();
        const cleanLower = cleanInput.toLowerCase();
        const normInput = normalizeArabic(cleanInput);

        user = DEMO_USERS.find((u) => {
          if (u.role !== 'STUDENT') return false;
          const uCode = (u.studentCode || '').toUpperCase();
          const uPhone = (u.phone || '').trim();
          const uName = (u.name || '').trim().toLowerCase();
          const uNameNorm = normalizeArabic(u.name || '');

          return (
            uCode === cleanUpper ||
            uPhone === cleanInput ||
            uName === cleanLower ||
            (uNameNorm && (uNameNorm === normInput || uNameNorm.includes(normInput) || normInput.includes(uNameNorm)))
          );
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'كود الطالب أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // 3. Password verification: plain text first, then bcrypt
    const stored = String(user.password ?? '');
    let isMatch = false;

    // Plain text match against password or defaultPassword
    if (raw === stored || (user.defaultPassword && raw === user.defaultPassword)) {
      isMatch = true;
    }

    // Bcrypt match
    if (!isMatch && stored.startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(raw, stored);
      } catch {
        isMatch = false;
      }
    }

    // Check passwordHash column if present
    if (!isMatch && user.passwordHash && user.passwordHash.startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(raw, user.passwordHash);
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

    // 3.5 Check if user is suspended
    if (user.role === 'STUDENT' && user.isActive === false) {
      return NextResponse.json(
        {
          error: 'SUSPENDED',
          message: 'تم تعليق هذا الحساب. يرجى مراجعة المعلمة.',
        },
        { status: 403 }
      );
    }

    // 4. Session Payload
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
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });

    return response;
  } catch (e: any) {
    console.error('[Auth Login] Fatal login error:', e);
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}

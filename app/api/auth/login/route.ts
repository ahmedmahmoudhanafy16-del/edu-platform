import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Pre-seeded fallback user directory (guarantees Vercel serverless demo login NEVER fails)
const DEMO_USERS = [
  {
    id: 'demo-student-1',
    name: 'أحمد محمد علي',
    studentCode: 'STU-001',
    phone: '01099998888',
    password: '1234',
    role: 'STUDENT',
    grade: 'الصف الثالث الإعدادي',
  },
  {
    id: 'demo-student-2',
    name: 'زياد طارق إبراهيم',
    studentCode: 'STU-777',
    phone: '01055554444',
    password: '1234',
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
    const { email, studentCode, password, role } = await req.json();

    let user: any = null;

    // 1. Try resolving user from Prisma DB
    try {
      if (role === 'TEACHER') {
        const cleanEmail = email?.trim();
        user = await prisma.user.findFirst({
          where: {
            role: 'TEACHER',
            OR: [{ email: cleanEmail }, { phone: cleanEmail }],
          },
        });
      } else {
        const cleanInput = studentCode?.trim();
        user = await prisma.user.findFirst({
          where: {
            role: 'STUDENT',
            OR: [
              { studentCode: cleanInput },
              { studentCode: cleanInput?.toUpperCase() },
              { phone: cleanInput },
              { name: cleanInput },
            ],
          },
        });
      }
    } catch (dbErr) {
      console.warn('[Auth Login] Database lookup failed, falling back to static directory:', dbErr);
    }

    // 2. Fallback to Demo Directory if user not found in DB or DB cold
    if (!user) {
      if (role === 'TEACHER') {
        const cleanEmail = email?.trim()?.toLowerCase();
        user = DEMO_USERS.find(
          (u) => u.role === 'TEACHER' && ((u.email && u.email.toLowerCase() === cleanEmail) || u.phone === cleanEmail)
        );
      } else {
        const cleanCode = studentCode?.trim()?.toUpperCase();
        user = DEMO_USERS.find(
          (u) => u.role === 'STUDENT' && (u.studentCode === cleanCode || u.phone === studentCode?.trim())
        );
      }
    }

    if (!user) {
      console.log(`[Auth Login] User not found: "${role === 'TEACHER' ? email : studentCode}"`);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // 3. Password Verification
    const isMatch =
      password === user.password ||
      (user.password ? await bcrypt.compare(password, user.password).catch(() => false) : false);

    if (!isMatch) {
      console.log(`[Auth Login] Invalid password for User ID=${user.id}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3.5 Check if user is suspended / inactive
    if (user.role === 'STUDENT' && user.isActive === false) {
      console.log(`[Auth Login] Blocked access for suspended Student ID=${user.id}`);
      return NextResponse.json(
        {
          error: 'SUSPENDED',
          message: 'تم تعليق حسابك من قِبل إدارة المنصة. يرجى التواصل مع المعلمة لإعادة التفعيل.',
        },
        { status: 403 }
      );
    }

    console.log(`[Auth Login] SUCCESS! Logged in: ID=${user.id}, Name=${user.name}, Role=${user.role}`);

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
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });

    return response;
  } catch (e: any) {
    console.error('[Auth Login] Fatal login error:', e);
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}

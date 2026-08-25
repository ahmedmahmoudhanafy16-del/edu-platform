import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, studentCode, password, role } = await req.json();

    let user;
    if (role === 'TEACHER') {
      const cleanEmail = email?.trim();
      user = await prisma.user.findFirst({
        where: {
          role: 'TEACHER',
          OR: [{ email: cleanEmail }, { phone: cleanEmail }],
        },
      });

      // Self-healing fallback for Vercel demo teacher account
      if (!user && (cleanEmail === 'teacher@school.com' || cleanEmail === '01011112222')) {
        try {
          user = await prisma.user.upsert({
            where: { email: 'teacher@school.com' },
            update: { password: 'teacher123', name: 'سارة أحمد', role: 'TEACHER', phone: '01011112222' },
            create: { name: 'سارة أحمد', email: 'teacher@school.com', password: 'teacher123', role: 'TEACHER', phone: '01011112222' },
          });
        } catch (seedErr) {
          console.error('[Auth Login] Fallback teacher seed error:', seedErr);
        }
      }
    } else {
      const cleanInput = studentCode?.trim();
      // Support matching by studentCode (e.g. STU-001, STU-777), phone, or username
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

      // Self-healing fallback for Vercel demo student accounts (STU-001, STU-777)
      if (!user && (cleanInput?.toUpperCase() === 'STU-001' || cleanInput === '01099998888' || cleanInput?.toUpperCase() === 'STU-777')) {
        const isStu777 = cleanInput?.toUpperCase() === 'STU-777';
        try {
          user = await prisma.user.upsert({
            where: { studentCode: isStu777 ? 'STU-777' : 'STU-001' },
            update: { password: '1234', grade: 'الصف الثالث الإعدادي' },
            create: {
              name: isStu777 ? 'زياد طارق إبراهيم' : 'أحمد محمد علي',
              studentCode: isStu777 ? 'STU-777' : 'STU-001',
              password: '1234',
              role: 'STUDENT',
              phone: isStu777 ? '01055554444' : '01099998888',
              parentPhone: '01012345678',
              grade: 'الصف الثالث الإعدادي',
            },
          });
        } catch (seedErr) {
          console.error('[Auth Login] Fallback student seed error:', seedErr);
        }
      }
    }

    if (!user) {
      console.log(`[Auth Login Debug] User not found for query: "${role === 'TEACHER' ? email : studentCode}" (Role: ${role})`);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const isMatch =
      password === user.password ||
      (user.password ? await bcrypt.compare(password, user.password).catch(() => false) : false);

    if (!isMatch) {
      console.log(`[Auth Login Debug] Invalid password attempt for User: ID=${user.id}, Name=${user.name}, Code=${user.studentCode}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log(`[Auth Login Debug] SUCCESS! Logged in user: ID=${user.id}, Name=${user.name}, Code=${user.studentCode}, Role=${user.role}`);

    // Create session payload with EXACT found user ID
    const sessionPayload = {
      id: user.id,
      name: user.name,
      role: user.role,
      studentCode: user.studentCode,
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
    console.error('[Auth Login Debug] Unhandled error during login:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, studentCode, password, role } = await req.json();

    let user;
    if (role === 'TEACHER') {
      user = await prisma.user.findFirst({
        where: { email, role: 'TEACHER' },
      });
    } else {
      user = await prisma.user.findFirst({
        where: { studentCode, role: 'STUDENT' },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const isMatch = password === user.password || (await bcrypt.compare(password, user.password).catch(() => false));

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Set cookie
    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
    response.cookies.set('user_session', JSON.stringify({ id: user.id, name: user.name, role: user.role }), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

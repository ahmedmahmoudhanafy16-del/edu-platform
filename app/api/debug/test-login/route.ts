import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

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
];

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const studentCode = (body.studentCode || '').trim();
    const password = (body.password || '').trim();

    const steps: any = {
      received: { studentCode, password },
    };

    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { studentCode },
            { studentCode: studentCode.toUpperCase() },
            { phone: studentCode },
            { id: studentCode },
          ],
        },
        select: {
          id: true,
          name: true,
          studentCode: true,
          role: true,
          password: true,
          defaultPassword: true,
        },
      });
      if (user) steps.source = 'PRISMA_DB';
    } catch (err: any) {
      steps.dbError = err?.message || String(err);
    }

    // Fallback to DEMO_USERS if DB is unreachable on Vercel Serverless
    if (!user) {
      const cleanUpper = studentCode.toUpperCase();
      user = DEMO_USERS.find(
        (u) => (u.studentCode && u.studentCode.toUpperCase() === cleanUpper) || u.phone === studentCode || u.name === studentCode
      );
      if (user) steps.source = 'DEMO_DIRECTORY_FALLBACK';
    }

    if (!user) {
      return NextResponse.json({ ...steps, error: 'USER NOT FOUND' });
    }

    steps.userFound = {
      id: user.id,
      name: user.name,
      studentCode: user.studentCode,
      role: user.role,
      defaultPassword: user.defaultPassword,
      passwordFirst30: user.password?.substring(0, 30),
      isBcryptHash: user.password?.startsWith('$2'),
    };

    // Step 2: plain text check
    steps.plainTextMatch = password === user.password || password === user.defaultPassword;

    // Step 3: bcrypt check
    try {
      steps.bcryptMatch = await bcrypt.compare(
        String(password),
        String(user.password || '')
      );
    } catch (e: any) {
      steps.bcryptError = e.message;
    }

    // Step 4: trimmed check
    try {
      steps.trimmedBcryptMatch = await bcrypt.compare(
        String(password).trim(),
        String(user.password || '').trim()
      );
    } catch (e: any) {
      steps.trimmedBcryptError = e.message;
    }

    return NextResponse.json(steps);
  } catch (fatal: any) {
    return NextResponse.json(
      {
        fatalError: fatal?.message || String(fatal),
        stack: fatal?.stack,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentCode = searchParams.get('studentCode') || searchParams.get('code') || 'STU-001';
    const password = searchParams.get('password') || searchParams.get('pass') || '1234';

    const steps: any = {
      received: { studentCode, password },
    };

    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { studentCode },
            { studentCode: studentCode.toUpperCase() },
            { phone: studentCode },
            { id: studentCode },
          ],
        },
        select: {
          id: true,
          name: true,
          studentCode: true,
          role: true,
          password: true,
          defaultPassword: true,
        },
      });
      if (user) steps.source = 'PRISMA_DB';
    } catch (err: any) {
      steps.dbError = err?.message || String(err);
    }

    // Fallback to DEMO_USERS if DB is unreachable on Vercel Serverless
    if (!user) {
      const cleanUpper = studentCode.toUpperCase();
      user = DEMO_USERS.find(
        (u) => (u.studentCode && u.studentCode.toUpperCase() === cleanUpper) || u.phone === studentCode || u.name === studentCode
      );
      if (user) steps.source = 'DEMO_DIRECTORY_FALLBACK';
    }

    if (!user) {
      return NextResponse.json({ ...steps, error: 'USER NOT FOUND' });
    }

    steps.userFound = {
      id: user.id,
      name: user.name,
      studentCode: user.studentCode,
      role: user.role,
      defaultPassword: user.defaultPassword,
      passwordFirst30: user.password?.substring(0, 30),
      isBcryptHash: user.password?.startsWith('$2'),
    };

    steps.plainTextMatch = password === user.password || password === user.defaultPassword;

    try {
      steps.bcryptMatch = await bcrypt.compare(
        String(password),
        String(user.password || '')
      );
    } catch (e: any) {
      steps.bcryptError = e.message;
    }

    try {
      steps.trimmedBcryptMatch = await bcrypt.compare(
        String(password).trim(),
        String(user.password || '').trim()
      );
    } catch (e: any) {
      steps.trimmedBcryptError = e.message;
    }

    return NextResponse.json(steps);
  } catch (fatal: any) {
    return NextResponse.json(
      {
        fatalError: fatal?.message || String(fatal),
        stack: fatal?.stack,
      },
      { status: 500 }
    );
  }
}

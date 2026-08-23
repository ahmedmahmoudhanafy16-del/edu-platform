import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const phone = req.nextUrl.searchParams.get('phone');

  const student = await prisma.user.findFirst({
    where: {
      studentCode: code || undefined,
      phone: phone || undefined,
      role: 'STUDENT',
    },
    include: {
      submissions: {
        include: { assignment: true },
        orderBy: { submittedAt: 'desc' },
      },
      quizResults: {
        include: { quiz: true },
        orderBy: { submittedAt: 'desc' },
      },
      attendance: {
        include: { session: true },
        orderBy: { joinedAt: 'desc' },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  return NextResponse.json(student);
}

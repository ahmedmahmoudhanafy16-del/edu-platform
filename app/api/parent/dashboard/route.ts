import { NextRequest, NextResponse } from 'next/server';
import { prisma, memoryQuizResults } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || 'STU-001';
  const phone = req.nextUrl.searchParams.get('phone');

  let student: any = null;
  try {
    student = await prisma.user.findFirst({
      where: {
        OR: [
          { studentCode: code },
          { id: code },
          { phone: phone || undefined },
        ],
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
          include: { liveSession: true },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });
  } catch (err) {
    console.warn('[Parent Dashboard API] DB query error:', err);
  }

  if (!student) {
    student = {
      id: code === 'STU-777' ? 'student-2' : 'student-1',
      name: code === 'STU-777' ? 'زياد طارق إبراهيم' : 'أحمد محمد علي',
      studentCode: code || 'STU-001',
      phone: phone || '01099998888',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
      submissions: [],
      quizResults: [],
      attendance: [],
    };
  }

  // Merge in-memory quiz results for instant serverless reflection
  const dbQuizIds = new Set((student.quizResults || []).map((r: any) => r.quizId || r.id));
  const memResults = (memoryQuizResults || [])
    .filter(
      (m: any) =>
        (m.studentId === student.id ||
          m.studentId === student.studentCode ||
          (student.studentCode === 'STU-001' && (m.studentId === 'demo-student-1' || m.studentId === 'student-1' || m.studentId === 'STU-001')) ||
          (student.studentCode === 'STU-777' && (m.studentId === 'demo-student-2' || m.studentId === 'student-2' || m.studentId === 'STU-777'))) &&
        !dbQuizIds.has(m.quizId)
    )
    .map((m: any) => ({
      id: m.id || `mem-${m.quizId}`,
      quizId: m.quizId,
      totalScore: m.totalScore ?? m.autoScore ?? m.score ?? 0,
      autoScore: m.autoScore ?? 0,
      maxScore: m.maxScore || 100,
      percentage: m.percentage,
      isPassed: Boolean(m.isPassed),
      status: m.status || 'AUTO_GRADED',
      submittedAt: m.submittedAt ? new Date(m.submittedAt) : new Date(),
      quiz: {
        id: m.quizId,
        title: m.quizTitle || 'الاختبار الأكاديمي',
        type: 'WEEKLY',
      },
    }));

  return NextResponse.json({
    ...student,
    quizResults: [...(student.quizResults || []), ...memResults],
  });
}

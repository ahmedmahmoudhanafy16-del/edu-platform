import React from 'react';
import { prisma } from '@/lib/prisma';
import { ParentChildProgressClient } from '@/components/parent/ParentChildProgressClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParentChildProgressPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let student: any = null;
  try {
    student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: {
        quizResults: {
          include: { quiz: true },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
  } catch (err) {
    console.warn('[ParentChildProgressPage] DB query skipped:', err);
  }

  const initialStudentData = {
    id: student?.id || 'student-1',
    name: student?.name || 'أحمد محمد علي',
    studentCode: student?.studentCode || 'STU-001',
    grade: student?.grade || 'الصف الثالث الإعدادي',
    quizResults: (student?.quizResults || []).map((r: any) => ({
      id: r.id,
      quizId: r.quizId,
      quizTitle: r.quiz?.title || 'الاختبار الأكاديمي',
      score: r.totalScore ?? r.autoScore ?? 0,
      maxScore: r.maxScore || 100,
      isPassed: Boolean(r.isPassed),
      submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : new Date().toISOString(),
      type: r.quiz?.type || 'WEEKLY',
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 max-w-4xl mx-auto">
      <ParentChildProgressClient initialStudent={initialStudentData} locale={locale} />
    </div>
  );
}

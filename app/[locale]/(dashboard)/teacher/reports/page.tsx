import React from 'react';
import { prisma, memoryQuizResults } from '@/lib/prisma';
import { BarChart3 } from 'lucide-react';
import { TeacherReportsClient } from './TeacherReportsClient';
import { getLatestStudentSubmission } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function TeacherReportsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let students: any[] = [];
  let dbSuccess = false;
  try {
    const res = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        quizResults: true,
        submissions: true,
        attendance: true,
        enrollments: {
          include: { classroom: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (res) {
      students = res;
      dbSuccess = true;
    }
  } catch (err) {
    console.warn('[Teacher Reports] DB query skipped:', err);
  }

  // Fallback to dynamic registered students only if DB query failed
  if (!dbSuccess) {
    try {
      const { getDynamicStudents } = await import('@/lib/dynamic-students');
      const dynamicList = getDynamicStudents();
      if (dynamicList && dynamicList.length > 0) {
        students = dynamicList;
      }
    } catch (e) {}
  }

  let classrooms: any[] = [];
  try {
    classrooms = await prisma.classroom.findMany({
      select: { id: true, name: true },
    });
  } catch (e) {}

  const isAr = locale === 'ar';

  const studentReports = (students || []).map((s) => {
    // Merge database results with in-memory store
    const dbQuizIds = new Set((s.quizResults || []).map((r: any) => r.quizId || r.id));
    const memResults = (memoryQuizResults || []).filter(
      (m: any) =>
        (m.studentId === s.id || m.studentId === s.studentCode) &&
        !dbQuizIds.has(m.quizId)
    );

    const combinedResults = [...(s.quizResults || []), ...memResults];
    const latest = getLatestStudentSubmission(s.studentCode || s.id, combinedResults);
    const scorePct = latest ? latest.percentage : 0;

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode,
      phone: s.phone || '—',
      parentPhone: s.parentPhone || s.phone || '—',
      grade: s.grade || '—',
      classroomId: s.enrollments?.[0]?.classroom?.id || '',
      classroomName: s.enrollments?.[0]?.classroom?.name || '',
      avgScore: scorePct,
      latestScore: latest ? latest.score : null,
      latestMaxScore: latest ? latest.maxScore : null,
      latestPercentage: latest ? latest.percentage : null,
      hasSubmissions: Boolean(latest),
      examsCompleted: combinedResults.length,
      homeworkCompleted: s.submissions?.length ?? 0,
      attendanceCount: s.attendance?.length ?? 0,
      status: scorePct >= 65 ? (isAr ? 'ممتاز' : 'Excellent') : (isAr ? 'يحتاج متابعة' : 'Needs Follow-up'),
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          {isAr ? 'التقارير الأكاديمية وتحليلات الأداء' : 'Academic Reports & Performance Analytics'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isAr
            ? 'تصدير كشوف الدرجات، إحصائيات الحضور، وإرسال تنبيهات واتساب جماعية لأولياء الأمور'
            : 'Export grade rosters, attendance stats, and broadcast WhatsApp alerts to parents'}
        </p>
      </div>

      <TeacherReportsClient initialReports={studentReports} classrooms={classrooms} />
    </div>
  );
}

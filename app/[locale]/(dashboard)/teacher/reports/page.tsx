import React from 'react';
import { prisma, memoryQuizResults } from '@/lib/prisma';
import { BarChart3 } from 'lucide-react';
import { TeacherReportsClient } from './TeacherReportsClient';
import { calcStudentAvg } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherReportsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let students: any[] = [];
  try {
    const res = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        quizResults: true,
        submissions: true,
        attendance: true,
      },
      orderBy: { name: 'asc' },
    });
    students = res || [];
  } catch (err) {
    console.warn('[Teacher Reports] DB query skipped:', err);
  }

  if (!students || students.length === 0) {
    students = [
      {
        id: 'student-1',
        name: 'أحمد محمد علي',
        studentCode: 'STU-001',
        phone: '01099998888',
        parentPhone: '01012345678',
        grade: 'الصف الثالث الإعدادي',
        quizResults: [],
        submissions: [],
        attendance: [1, 2, 3],
      },
      {
        id: 'student-2',
        name: 'زياد طارق إبراهيم',
        studentCode: 'STU-777',
        phone: '01055554444',
        parentPhone: '01087654321',
        grade: 'الصف الثالث الإعدادي',
        quizResults: [],
        submissions: [],
        attendance: [1, 2],
      },
    ];
  }

  const studentReports = (students || []).map((s) => {
    // Merge database results with in-memory store
    const dbQuizIds = new Set((s.quizResults || []).map((r: any) => r.quizId || r.id));
    const memResults = (memoryQuizResults || [])
      .filter(
        (m: any) =>
          (m.studentId === s.id ||
            m.studentId === s.studentCode ||
            (s.studentCode === 'STU-001' && (m.studentId === 'demo-student-1' || m.studentId === 'student-1' || m.studentId === 'STU-001')) ||
            (s.studentCode === 'STU-777' && (m.studentId === 'demo-student-2' || m.studentId === 'student-2' || m.studentId === 'STU-777'))) &&
          !dbQuizIds.has(m.quizId)
      );

    const combinedResults = [...(s.quizResults || []), ...memResults];
    const avgScore = calcStudentAvg(combinedResults) ?? 0;

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode || '—',
      phone: s.phone || '—',
      parentPhone: s.parentPhone || s.phone || '—',
      grade: s.grade || 'الصف الثالث الإعدادي',
      avgScore,
      examsCompleted: combinedResults.length,
      homeworkCompleted: s.submissions?.length ?? 0,
      attendanceCount: s.attendance?.length ?? 0,
      status: avgScore >= 65 ? 'ممتاز' : 'يحتاج متابعة',
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          التقارير الأكاديمية وتحليلات الأداء
        </h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          تصدير كشوف الدرجات، إحصائيات الحضور، وإرسال تنبيهات واتساب جماعية لأولياء الأمور
        </p>
      </div>

      <TeacherReportsClient initialReports={studentReports} />
    </div>
  );
}

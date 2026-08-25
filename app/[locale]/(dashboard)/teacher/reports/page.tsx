import React from 'react';
import { prisma } from '@/lib/prisma';
import { BarChart3, Download, MessageSquare, TrendingUp, Users, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeacherReportsClient } from './TeacherReportsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherReportsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const [students, quizzes, classrooms, submissions] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        quizResults: true,
        submissions: true,
        attendance: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.quiz.findMany({ include: { results: true } }),
    prisma.classroom.findMany(),
    prisma.assignmentSubmission.findMany(),
  ]);

  const studentReports = students.map((s) => {
    const totalScore = s.quizResults.reduce((acc, r) => acc + (r.totalScore || 0), 0);
    const maxPossible = s.quizResults.reduce((acc, r) => acc + (r.maxScore || 1), 0);
    const avgScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
    const attendancePct = s.attendance.length > 0 ? 100 : 0;

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode || '—',
      phone: s.phone || '—',
      parentPhone: s.parentPhone || s.phone || '—',
      grade: s.grade || 'الصف الثالث الإعدادي',
      avgScore,
      examsCompleted: s.quizResults.length,
      homeworkCompleted: s.submissions.length,
      attendanceCount: s.attendance.length,
      status: avgScore >= 65 ? 'ممتاز' : 'يحتاج متابعة',
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          التقارير الأكاديمية وتحليلات الأداء
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          تصدير كشوف الدرجات، إحصائيات الحضور، وإرسال تنبيهات واتساب جماعية لأولياء الأمور
        </p>
      </div>

      <TeacherReportsClient initialReports={studentReports} />
    </div>
  );
}

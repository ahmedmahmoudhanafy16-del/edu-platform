import { prisma } from '@/lib/prisma';
import { CompactStudentsTable } from '@/components/teacher/CompactStudentsTable';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function TeacherStudentsPage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      submissions: true,
      quizResults: true,
      attendance: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = students.map((s) => {
    const totalScore = s.quizResults.reduce((acc, r) => acc + (r.totalScore || 0), 0);
    const maxPossible = s.quizResults.reduce((acc, r) => acc + (r.maxScore || 1), 0);
    const avgScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : null;

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode || '—',
      phone: s.phone,
      avgScore,
      submissionsCount: s.submissions.length,
      attendanceCount: s.attendance.length,
      lastActive: s.quizResults[0]?.submittedAt || null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">شؤون الطلاب وتقارير أولياء الأمور</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            كشف كامل بالطلاب، نسب الحضور والدرجات، وتصدير ملفات Excel وتقارير واتساب فورية
          </p>
        </div>
        <Button size="md">
          <UserPlus className="h-4 w-4 me-1.5" />
          إضافة طالب جديد
        </Button>
      </div>

      <CompactStudentsTable students={formatted} classroomName="الصف_الثالث_الإعدادي" />
    </div>
  );
}

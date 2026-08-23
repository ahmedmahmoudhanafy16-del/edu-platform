import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { CompactStudentsTable } from '@/components/teacher/CompactStudentsTable';

export default async function TeacherStudentsPage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      submissions: true,
      attendance: true,
      quizResults: true,
    },
  });

  const formattedStudents = students.map((s) => {
    const scores = s.quizResults.filter((r) => r.totalScore != null);
    const avgScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((acc, r) => acc + ((r.totalScore || 0) / (r.maxScore || 1)) * 100, 0) /
              scores.length
          )
        : null;

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode || '',
      phone: s.phone,
      avgScore,
      submissionsCount: s.submissions.length,
      attendanceCount: s.attendance.length,
      lastActive: s.createdAt,
    };
  });

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="TEACHER" userName={teacher?.name || 'المعلمة'} />
      <main className="flex-1 mr-60 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">قائمة الطلاب والتقارير</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            جدول مدمج لعرض أداء الطلاب مع إمكانية التصدير كملف CSV وإرسال تقارير واتساب
          </p>
        </div>

        <CompactStudentsTable
          students={formattedStudents}
          classroomName="الصف الثالث الإعدادي"
        />
      </main>
    </div>
  );
}

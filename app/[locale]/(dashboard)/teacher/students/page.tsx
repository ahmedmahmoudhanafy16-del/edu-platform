import { prisma } from '@/lib/prisma';
import { TeacherStudentsClient } from './TeacherStudentsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherStudentsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  // Await params for Next.js 15+ promise resolution compatibility
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const [classrooms, students] = await Promise.all([
    prisma.classroom.findMany({
      where: { teacherId },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        submissions: true,
        quizResults: true,
        attendance: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const formatted = students.map((s) => {
    const totalScore = s.quizResults.reduce((acc, r) => acc + (r.totalScore || 0), 0);
    const maxPossible = s.quizResults.reduce((acc, r) => acc + (r.maxScore || 1), 0);
    const avgScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : null;

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode || '—',
      phone: s.phone,
      parentPhone: s.parentPhone,
      grade: s.grade || 'الصف الثالث الإعدادي',
      avgScore,
      submissionsCount: s.submissions.length,
      attendanceCount: s.attendance.length,
      lastActive: s.quizResults[0]?.submittedAt ? s.quizResults[0].submittedAt.toISOString() : null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <TeacherStudentsClient initialStudents={formatted} classrooms={classrooms} />
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { TeacherClassroomsClient } from './TeacherClassroomsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherClassroomsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    include: {
      enrollments: true,
      quizzes: true,
      assignments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    code: c.code,
    studentsCount: c.enrollments.length,
    quizzesCount: c.quizzes.length,
    assignmentsCount: c.assignments.length,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <TeacherClassroomsClient initialClassrooms={formatted} teacherId={teacherId} />
    </div>
  );
}

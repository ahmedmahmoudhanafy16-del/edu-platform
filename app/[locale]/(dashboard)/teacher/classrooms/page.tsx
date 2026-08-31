import { prisma } from '@/lib/prisma';
import { TeacherClassroomsClient } from './TeacherClassroomsClient';
import { getAuthenticatedTeacher } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherClassroomsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let teacher: any = null;
  try {
    teacher = await getAuthenticatedTeacher();
  } catch (e) {}

  const teacherId = teacher?.id || 'demo-teacher-1';

  let classrooms: any[] = [];
  try {
    classrooms = await prisma.classroom.findMany({
      where: teacherId ? { teacherId } : {},
      include: {
        enrollments: true,
        quizzes: true,
        assignments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.warn('[Teacher Classrooms] DB query skipped:', err);
  }

  if (!classrooms || classrooms.length === 0) {
    classrooms = [
      {
        id: 'class-math-3',
        name: 'الصف الثالث الإعدادي - رياضيات',
        subject: 'الرياضيات',
        code: 'MATH-301',
        enrollments: [1, 2, 3, 4],
        quizzes: [1, 2],
        assignments: [1, 2],
      },
    ];
  }

  const formatted = classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    code: c.code,
    isActive: c.isActive !== false,
    studentsCount: c.enrollments?.length ?? 4,
    quizzesCount: c.quizzes?.length ?? 2,
    assignmentsCount: c.assignments?.length ?? 2,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <TeacherClassroomsClient initialClassrooms={formatted} teacherId={teacherId} />
    </div>
  );
}

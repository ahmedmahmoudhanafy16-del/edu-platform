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

  const teacherId = teacher?.id || '';

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

  let allStudents: any[] = [];
  try {
    allStudents = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        studentCode: true,
        grade: true,
        gradeLevel: true,
        enrollments: { select: { classroomId: true } },
      },
    });
  } catch (e) {}

  // Compute accurate studentsCount on server
  const formatted = classrooms.map((c) => {
    const directEnrollments = c.enrollments?.length ?? 0;
    const matchingGradeStudents = allStudents.filter(
      (s) =>
        s.enrollments?.some((e: any) => e.classroomId === c.id) ||
        (c.name && s.grade && (c.name.includes(s.grade) || s.grade.includes(c.name))) ||
        (c.name && s.gradeLevel && (c.name.includes(s.gradeLevel) || s.gradeLevel.includes(c.name)))
    ).length;

    return {
      id: c.id,
      name: c.name,
      subject: c.subject,
      code: c.code,
      isActive: c.isActive !== false,
      studentsCount: Math.max(directEnrollments, matchingGradeStudents),
      quizzesCount: c.quizzes?.length ?? 0,
      assignmentsCount: c.assignments?.length ?? 0,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <TeacherClassroomsClient initialClassrooms={formatted} teacherId={teacherId} />
    </div>
  );
}

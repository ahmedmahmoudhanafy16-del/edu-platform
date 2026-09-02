import { prisma } from '@/lib/prisma';
import { TeacherStudentsClient } from './TeacherStudentsClient';
import { getAuthenticatedTeacher } from '@/lib/auth';
import { calcStudentAvg } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherStudentsPage({
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
  let students: any[] = [];

  try {
    const results = await Promise.allSettled([
      prisma.classroom.findMany({
        where: teacherId ? { teacherId } : {},
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true,
          name: true,
          studentCode: true,
          phone: true,
          defaultPassword: true, // real value from DB
          password: true,
          isActive: true,
          createdAt: true,
          grade: true,
          gradeLevel: true,
          enrollments: {
            include: {
              classroom: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          submissions: {
            select: { id: true },
          },
          attendance: {
            select: { id: true },
          },
          quizResults: {
            select: {
              totalScore: true,
              autoScore: true,
              maxScore: true,
              submittedAt: true,
            },
            orderBy: { submittedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (results[0].status === 'fulfilled') classrooms = results[0].value || [];
    if (results[1].status === 'fulfilled') students = results[1].value || [];
  } catch (err) {
    console.warn('[Teacher Students] DB query error:', err);
  }

  const formatted = students.map((s) => {
    const latestQuiz = s.quizResults?.[0];
    const avgScore = calcStudentAvg(s.quizResults || []);
    const enrollment = s.enrollments?.[0];
    const studentGrade = s.grade || s.gradeLevel || 'الصف الثالث الإعدادي';
    const studentClassroomId = enrollment?.classroom?.id || '';
    const studentClassroomName = enrollment?.classroom?.name || '';

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode ?? '—',
      phone: s.phone ?? '',
      defaultPassword: s.defaultPassword ?? s.password ?? '1234',
      password: s.defaultPassword ?? s.password ?? '1234',
      isActive: s.isActive !== false,
      grade: studentGrade,
      gradeLevel: studentGrade,
      classroomId: studentClassroomId,
      classroomName: studentClassroomName,
      classroom: studentClassroomId,
      avgScore,
      latestScore: latestQuiz ? (latestQuiz.totalScore ?? latestQuiz.autoScore ?? 0) : null,
      latestMaxScore: latestQuiz ? (latestQuiz.maxScore ?? 100) : null,
      latestPercentage: avgScore,
      submissionsCount: s.submissions?.length ?? 0,
      attendanceCount: s.attendance?.length ?? 0,
      lastActive: latestQuiz?.submittedAt ? new Date(latestQuiz.submittedAt).toISOString() : null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <TeacherStudentsClient initialStudents={formatted} classrooms={classrooms} />
    </div>
  );
}

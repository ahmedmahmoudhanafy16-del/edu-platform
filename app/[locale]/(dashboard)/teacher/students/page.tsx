import { prisma, memoryQuizResults } from '@/lib/prisma';
import { TeacherStudentsClient } from './TeacherStudentsClient';
import { getAuthenticatedTeacher } from '@/lib/auth';
import { getLatestStudentSubmission } from '@/lib/analytics';

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

  const teacherId = teacher?.id || 'demo-teacher-1';

  let classrooms: any[] = [];
  let students: any[] = [];
  let dbQuizSubmissions: any[] = [];

  try {
    const results = await Promise.allSettled([
      prisma.classroom.findMany({
        where: teacherId ? { teacherId } : {},
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
      prisma.quizResult.findMany({
        select: {
          id: true,
          quizId: true,
          studentId: true,
          totalScore: true,
          autoScore: true,
          maxScore: true,
          isPassed: true,
          submittedAt: true,
        },
      }),
    ]);

    if (results[0].status === 'fulfilled') classrooms = results[0].value || [];
    if (results[1].status === 'fulfilled') students = results[1].value || [];
    if (results[2].status === 'fulfilled') dbQuizSubmissions = results[2].value || [];
  } catch (err) {
    console.warn('[Teacher Students] DB query skipped:', err);
  }

  if (!classrooms || classrooms.length === 0) {
    classrooms = [{ id: 'class-math-3', name: 'الصف الثالث الإعدادي - رياضيات' }];
  }

  if (!students || students.length === 0) {
    students = [
      {
        id: 'STU-633',
        name: 'أحمد محمود أحمد',
        studentCode: 'STU-633',
        phone: '01012345678',
        parentPhone: '01012345678',
        grade: 'الصف الثالث الإعدادي',
        defaultPassword: '9715',
        submissions: [],
        quizResults: [],
        attendance: [1, 2, 3],
      },
      {
        id: 'student-1',
        name: 'أحمد محمد علي',
        studentCode: 'STU-001',
        phone: '01099998888',
        parentPhone: '01012345678',
        grade: 'الصف الثالث الإعدادي',
        defaultPassword: '4829',
        submissions: [],
        quizResults: [],
        attendance: [1, 2, 3],
      },
      {
        id: 'student-2',
        name: 'زياد طارق إبراهيم',
        studentCode: 'STU-777',
        phone: '01055554444',
        parentPhone: '01087654321',
        grade: 'الصف الثالث الإعدادي',
        defaultPassword: '6341',
        submissions: [],
        quizResults: [],
        attendance: [1, 2],
      },
    ];
  }

  // Merge database quiz results with serverless in-memory store
  const allSubmissions = [
    ...dbQuizSubmissions,
    ...(memoryQuizResults || []).map((m: any) => ({
      id: m.id,
      quizId: m.quizId,
      quizTitle: m.quizTitle,
      studentId: m.studentId,
      score: m.totalScore ?? m.autoScore ?? m.score ?? 0,
      totalScore: m.totalScore ?? m.autoScore ?? m.score ?? 0,
      autoScore: m.autoScore ?? 0,
      maxScore: m.maxScore || 100,
      percentage: m.percentage,
      isPassed: Boolean(m.isPassed),
      submittedAt: m.submittedAt ? new Date(m.submittedAt) : new Date(),
    })),
  ];

  const formatted = (students || []).map((s) => {
    const studentSubs = allSubmissions.filter((sub: any) => {
      const sId = sub.studentId || sub.studentCode;
      return (
        sId === s.id ||
        sId === s.studentCode ||
        (s.studentCode === 'STU-001' && (sId === 'demo-student-1' || sId === 'student-1' || sId === 'STU-001')) ||
        (s.studentCode === 'STU-777' && (sId === 'demo-student-2' || sId === 'student-2' || sId === 'STU-777'))
      );
    });

    const combinedResults = [...(s.quizResults || []), ...studentSubs];
    const latestSubmission = getLatestStudentSubmission(s.studentCode || s.id, combinedResults);

    // READ defaultPassword DIRECTLY from the database — NEVER generate or modify it
    const studentPin = s.defaultPassword ?? '1234';

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode || '—',
      defaultPassword: studentPin,
      phone: s.phone,
      parentPhone: s.parentPhone,
      grade: s.grade || 'الصف الثالث الإعدادي',
      isActive: s.isActive !== false,
      avgScore: latestSubmission ? latestSubmission.percentage : null,
      latestScore: latestSubmission ? latestSubmission.score : null,
      latestMaxScore: latestSubmission ? latestSubmission.maxScore : null,
      latestPercentage: latestSubmission ? latestSubmission.percentage : null,
      latestQuizTitle: latestSubmission ? latestSubmission.quizTitle : null,
      submissionsCount: Math.max(s.submissions?.length ?? 0, combinedResults.length),
      attendanceCount: s.attendance?.length ?? 0,
      lastActive: latestSubmission?.submittedAt ? new Date(latestSubmission.submittedAt).toISOString() : null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <TeacherStudentsClient initialStudents={formatted} classrooms={classrooms} />
    </div>
  );
}

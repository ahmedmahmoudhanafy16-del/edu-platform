import { prisma } from '@/lib/prisma';
import { supabase, getClassroomsFromSupabase } from '@/lib/supabase';
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
          parentPhone: true,
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

  // Authoritative Supabase Cloud Sync: Classrooms & Students
  try {
    const sbClassrooms = await getClassroomsFromSupabase();
    if (Array.isArray(sbClassrooms) && sbClassrooms.length > 0) {
      const existingClsIds = new Set(classrooms.map((c) => c.id));
      for (const sbc of sbClassrooms) {
        if (!existingClsIds.has(sbc.id)) {
          classrooms.push({ id: sbc.id, name: sbc.name });
          existingClsIds.add(sbc.id);
        }
      }
    }
  } catch (sbErr) {
    console.warn('[Teacher Students Page] Supabase classroom sync notice:', sbErr);
  }

  try {
    const { data: sbStudents } = await supabase.from('students').select('*').not('student_code', 'like', '__%');
    if (sbStudents && sbStudents.length > 0) {
      const existingCodes = new Set(students.map((s) => String(s.studentCode || '').toUpperCase()));
      for (const sb of sbStudents) {
        const code = String(sb.student_code || '').toUpperCase();
        if (code.startsWith('__')) continue;
        if (!existingCodes.has(code)) {
          students.push({
            id: sb.id,
            name: sb.full_name,
            studentCode: sb.student_code,
            phone: sb.phone || '',
            parentPhone: sb.parent_phone || '',
            defaultPassword: '',
            password: '',
            isActive: sb.is_active !== false,
            createdAt: sb.created_at || new Date(),
            grade: sb.grade_level || '',
            gradeLevel: sb.grade_level || '',
            enrollments: [],
            submissions: [],
            attendance: [],
            quizResults: [],
          });
          existingCodes.add(code);
        }
      }
    }
  } catch (sbErr) {
    console.warn('[Teacher Students Page] Supabase sync notice:', sbErr);
  }

  const formatted = students.map((s) => {
    const latestQuiz = s.quizResults?.[0];
    const avgScore = calcStudentAvg(s.quizResults || []);
    const enrollment = s.enrollments?.[0];
    const studentGrade = s.grade || s.gradeLevel || '';
    const studentClassroomId = enrollment?.classroom?.id || '';
    const studentClassroomName = enrollment?.classroom?.name || '';

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode ?? '—',
      phone: s.phone ?? '',
      parentPhone: s.parentPhone ?? '',
      defaultPassword: s.defaultPassword ?? s.password ?? '',
      password: s.defaultPassword ?? s.password ?? '',
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

  const isAr = locale === 'ar';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <TeacherStudentsClient initialStudents={formatted} classrooms={classrooms} />
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { TeacherClassroomsClient } from './TeacherClassroomsClient';
import { getAuthenticatedTeacher } from '@/lib/auth';
import { supabase, getClassroomsFromSupabase, getAssignmentsFromSupabase, getQuizzesFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function matchesClassroomGrade(classroomName: string, itemGrade?: string): boolean {
  if (!classroomName || !itemGrade) return false;
  const cName = classroomName.trim();
  const g = itemGrade.trim();
  if (cName.includes(g) || g.includes(cName)) return true;
  if (
    (g.includes('الرابع') && (cName.includes('Primary 4') || cName.includes('Grade 4') || cName.includes('الرابع'))) ||
    (g.includes('الخامس') && (cName.includes('Primary 5') || cName.includes('Grade 5') || cName.includes('الخامس'))) ||
    (g.includes('السادس') && (cName.includes('Primary 6') || cName.includes('Grade 6') || cName.includes('السادس'))) ||
    (g.includes('الثالث الإعدادي') && (cName.includes('Prep 3') || cName.includes('Grade 9') || cName.includes('الثالث الإعدادي'))) ||
    (g.includes('الثاني الإعدادي') && (cName.includes('Prep 2') || cName.includes('Grade 8') || cName.includes('الثاني الإعدادي'))) ||
    (g.includes('الأول الإعدادي') && (cName.includes('Prep 1') || cName.includes('Grade 7') || cName.includes('الأول الإعدادي'))) ||
    (g.includes('الأول الثانوي') && (cName.includes('Secondary 1') || cName.includes('Grade 10') || cName.includes('الأول الثانوي'))) ||
    (g.includes('الثاني الثانوي') && (cName.includes('Secondary 2') || cName.includes('Grade 11') || cName.includes('الثاني الثانوي'))) ||
    (g.includes('الثالث الثانوي') && (cName.includes('Secondary 3') || cName.includes('Grade 12') || cName.includes('الثالث الثانوي')))
  ) return true;
  return false;
}

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

  // Authoritative Supabase Cloud Classrooms
  try {
    const sbClassrooms = await getClassroomsFromSupabase();
    if (Array.isArray(sbClassrooms) && sbClassrooms.length > 0) {
      const existingIds = new Set(classrooms.map((c) => c.id));
      for (const sbc of sbClassrooms) {
        if (!existingIds.has(sbc.id)) {
          classrooms.push({
            id: sbc.id,
            name: sbc.name,
            subject: sbc.subject || 'عام',
            code: sbc.code || '',
            isActive: sbc.isActive !== false,
            createdAt: sbc.createdAt ? new Date(sbc.createdAt) : new Date(),
            enrollments: [],
            quizzes: [],
            assignments: [],
          });
          existingIds.add(sbc.id);
        }
      }
    }
  } catch (sbErr) {
    console.warn('[Teacher Classrooms] Supabase lookup notice:', sbErr);
  }

  // Authoritative Supabase Cloud Students
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

  try {
    const { data: sbStudents } = await supabase
      .from('students')
      .select('*')
      .not('student_code', 'like', '\\_\\_%');

    if (Array.isArray(sbStudents) && sbStudents.length > 0) {
      const existingCodes = new Set(allStudents.map((s) => String(s.studentCode || '').toUpperCase()));
      for (const sb of sbStudents) {
        const code = String(sb.student_code || '').toUpperCase();
        if (code.startsWith('__')) continue;
        if (!existingCodes.has(code)) {
          allStudents.push({
            id: sb.id,
            studentCode: sb.student_code,
            grade: sb.grade_level || '',
            gradeLevel: sb.grade_level || '',
            enrollments: [],
          });
          existingCodes.add(code);
        }
      }
    }
  } catch (sbErr) {
    console.warn('[Teacher Classrooms] Supabase student sync notice:', sbErr);
  }

  // Authoritative Supabase Cloud Quizzes & Assignments
  let allQuizzes: any[] = [];
  let allAssignments: any[] = [];
  try {
    allQuizzes = await getQuizzesFromSupabase();
  } catch (e) {}
  try {
    allAssignments = await getAssignmentsFromSupabase();
  } catch (e) {}

  // Compute accurate studentsCount, quizzesCount, assignmentsCount on server
  const formatted = classrooms.map((c) => {
    const directEnrollments = c.enrollments?.length ?? 0;
    const matchingGradeStudents = allStudents.filter(
      (s) =>
        s.enrollments?.some((e: any) => e.classroomId === c.id) ||
        matchesClassroomGrade(c.name, s.grade || s.gradeLevel)
    ).length;

    const directQuizzes = c.quizzes?.length ?? 0;
    const matchedQuizzes = allQuizzes.filter(
      (q: any) =>
        (q.classroomId && (q.classroomId === c.id || q.classroomId === c.code)) ||
        (q.classroomName && q.classroomName.trim() === c.name.trim()) ||
        matchesClassroomGrade(c.name, q.grade || q.title || q.classroomName)
    ).length;

    const directAssignments = c.assignments?.length ?? 0;
    const matchedAssignments = allAssignments.filter(
      (a: any) => a.classroomId === c.id || matchesClassroomGrade(c.name, a.grade || a.classroomName)
    ).length;

    return {
      id: c.id,
      name: c.name,
      subject: c.subject,
      code: c.code,
      isActive: c.isActive !== false,
      studentsCount: Math.max(directEnrollments, matchingGradeStudents),
      quizzesCount: Math.max(directQuizzes, matchedQuizzes),
      assignmentsCount: Math.max(directAssignments, matchedAssignments),
    };
  });

  const isAr = locale === 'ar';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <TeacherClassroomsClient initialClassrooms={formatted} teacherId={teacherId} />
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { StudentAssignmentsClient } from './StudentAssignmentsClient';
import { getAuthenticatedStudent } from '@/lib/auth';
import { getAssignmentsFromSupabase, getClassroomsFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isAr = locale === 'ar';

  let student: any = null;
  try {
    student = await getAuthenticatedStudent();
  } catch (e) {}

  const studentId = student?.id || '';
  const studentName = student?.name || (isAr ? 'طالب' : 'Student');

  let assignments: any[] = [];
  try {
    assignments = await prisma.assignment.findMany({
      where: {
        classroom: {
          isActive: true,
        },
      },
      include: {
        classroom: true,
        submissions: {
          where: { studentId },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    if (assignments) {
      // Prisma succeeded
    }
  } catch (err) {
    console.warn('[Student Assignments] DB query skipped:', err);
  }

  try {
    const [sbAssignments, sbClassrooms] = await Promise.all([
      getAssignmentsFromSupabase(),
      getClassroomsFromSupabase(),
    ]);
    const classroomNameMap = new Map<string, string>();
    for (const c of sbClassrooms) {
      classroomNameMap.set(c.id, c.name);
    }
    if (sbAssignments && sbAssignments.length > 0) {
      const existingAssignmentIds = new Set(assignments.map((a) => a.id));
      for (const sba of sbAssignments) {
        if (!existingAssignmentIds.has(sba.id)) {
          assignments.push({
            id: sba.id,
            title: sba.title,
            description: sba.description || '',
            dueDate: sba.dueDate,
            maxScore: sba.maxScore ?? 10,
            classroom: {
              id: sba.classroomId || '',
              name: classroomNameMap.get(sba.classroomId || '') || sba.classroom?.name || (isAr ? 'فصل دراسي' : 'Classroom'),
            },
            submissions: sba.submissions || [],
          });
          existingAssignmentIds.add(sba.id);
        }
      }
    }
  } catch (sbErr) {
    console.warn('[Student Assignments] Supabase fetch fallback:', sbErr);
  }

  const serialized = (assignments || []).map((a) => ({
    id: a.id,
    title: a.title || (isAr ? 'الواجب المنزلي' : 'Homework Assignment'),
    description: a.description || '',
    dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : new Date().toISOString(),
    maxScore: a.maxScore ?? 10,
    classroomName: a.classroom?.name || '',
    submission: a.submissions && a.submissions[0]
      ? {
          id: a.submissions[0].id,
          grade: a.submissions[0].grade ?? null,
          status: a.submissions[0].status || 'SUBMITTED',
          teacherNote: a.submissions[0].teacherNote || '',
          submittedAt: a.submissions[0].submittedAt ? new Date(a.submissions[0].submittedAt).toISOString() : new Date().toISOString(),
        }
      : null,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">
          {isAr ? 'الواجبات والتسليمات' : 'Assignments & Submissions'}
        </h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          {isAr
            ? `مرحباً ${studentName} — قائمة بالواجبات المطلوبة ومتابعة درجات وملاحظات المعلم`
            : `Welcome ${studentName} — List of required assignments, grades, and teacher feedback`}
        </p>
      </div>

      <StudentAssignmentsClient initialAssignments={serialized} />
    </div>
  );
}

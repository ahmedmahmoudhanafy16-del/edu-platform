import { prisma } from '@/lib/prisma';
import { TeacherAssignmentsClient } from './TeacherAssignmentsClient';
import { getAuthenticatedTeacher } from '@/lib/auth';
import { getClassroomsFromSupabase, getAssignmentsFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherAssignmentsPage({
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
  let assignments: any[] = [];

  try {
    const results = await Promise.allSettled([
      prisma.classroom.findMany({
        where: teacherId ? { teacherId } : {},
        select: { id: true, name: true },
      }),
      prisma.assignment.findMany({
        include: {
          classroom: true,
          submissions: { include: { student: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (results[0].status === 'fulfilled') classrooms = results[0].value || [];
    if (results[1].status === 'fulfilled') assignments = results[1].value || [];
  } catch (err) {
    console.warn('[Teacher Assignments] DB query skipped:', err);
  }

  // Authoritative Supabase Cloud Sync
  try {
    const [sbClassrooms, sbAssignments] = await Promise.all([
      getClassroomsFromSupabase().catch(() => []),
      getAssignmentsFromSupabase().catch(() => []),
    ]);

    if (Array.isArray(sbClassrooms) && sbClassrooms.length > 0) {
      const existingClsIds = new Set(classrooms.map((c) => c.id));
      for (const sbc of sbClassrooms) {
        if (!existingClsIds.has(sbc.id)) {
          classrooms.push({ id: sbc.id, name: sbc.name });
          existingClsIds.add(sbc.id);
        }
      }
    }

    if (Array.isArray(sbAssignments) && sbAssignments.length > 0) {
      const existingAssignIds = new Set(assignments.map((a) => a.id));
      for (const sba of sbAssignments) {
        if (!existingAssignIds.has(sba.id)) {
          assignments.push({
            id: sba.id,
            title: sba.title,
            description: sba.description || '',
            dueDate: sba.dueDate ? new Date(sba.dueDate) : new Date(),
            maxScore: sba.maxScore ?? 10,
            isClosed: Boolean(sba.isClosed),
            classroom: sba.classroomId ? classrooms.find((c) => c.id === sba.classroomId) : null,
            classroomId: sba.classroomId || '',
            submissions: [],
            createdAt: sba.createdAt ? new Date(sba.createdAt) : new Date(),
          });
          existingAssignIds.add(sba.id);
        }
      }
    }
  } catch (sbErr) {
    console.warn('[Teacher Assignments] Supabase lookup notice:', sbErr);
  }

  const serialized = (assignments || []).map((a) => ({
    id: a.id,
    title: a.title || '',
    description: a.description || '',
    dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : new Date().toISOString(),
    maxScore: a.maxScore ?? 10,
    isClosed: Boolean(a.isClosed),
    classroomName: a.classroom?.name || '',
    classroomId: a.classroomId || '',
    submissions: (a.submissions || []).map((s: any) => ({
      id: s.id || 'sub-1',
      studentName: s.student?.name || 'طالب',
      studentCode: s.student?.studentCode || '—',
      answerText: s.answerText || '',
      fileUrl: s.fileUrl || null,
      grade: s.grade ?? null,
      teacherNote: s.teacherNote || '',
      status: s.status || 'SUBMITTED',
      submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString() : new Date().toISOString(),
    })),
  }));

  const isAr = locale === 'ar';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <TeacherAssignmentsClient
        initialAssignments={serialized}
        classrooms={classrooms}
      />
    </div>
  );
}

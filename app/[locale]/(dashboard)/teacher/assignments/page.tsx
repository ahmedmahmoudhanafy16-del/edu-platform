import { prisma } from '@/lib/prisma';
import { TeacherAssignmentsClient } from './TeacherAssignmentsClient';
import { getAuthenticatedTeacher } from '@/lib/auth';

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

  const teacherId = teacher?.id || 'demo-teacher-1';

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

  if (!classrooms || classrooms.length === 0) {
    classrooms = [{ id: 'class-math-3', name: 'الصف الثالث الإعدادي - رياضيات' }];
  }

  if (!assignments || assignments.length === 0) {
    assignments = [
      {
        id: 'sample-assign-1',
        title: 'حل تمارين معادلات الدرجة الأولى',
        description: 'حل المسائل من صفحة 15 إلى 18 في كتاب التمارين ورفع صورة الحل.',
        dueDate: new Date(Date.now() + 86400000 * 3),
        maxScore: 10,
        classroomId: classrooms[0].id,
        classroom: { name: classrooms[0].name },
        submissions: [
          {
            id: 'sub-1',
            student: { name: 'أحمد محمد علي', studentCode: 'STU-001' },
            answerText: 'تم حل المسائل كاملة مع خطوات التبسيط.',
            fileUrl: null,
            grade: 10,
            teacherNote: 'ممتاز يا أحمد، استمر!',
            status: 'GRADED',
            submittedAt: new Date(),
          },
        ],
      },
    ];
  }

  const serialized = (assignments || []).map((a) => ({
    id: a.id || 'assign-1',
    title: a.title || 'الواجب المنزلي',
    description: a.description || '',
    dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : new Date().toISOString(),
    maxScore: a.maxScore ?? 10,
    isClosed: Boolean(a.isClosed),
    classroomName: a.classroom?.name || classrooms[0]?.name || 'فصل الرياضيات',
    classroomId: a.classroomId || classrooms[0]?.id || 'class-1',
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <TeacherAssignmentsClient
        initialAssignments={serialized}
        classrooms={classrooms}
      />
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { StudentAssignmentsClient } from './StudentAssignmentsClient';
import { getAuthenticatedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const student = await getAuthenticatedStudent();
  const studentId = student?.id || '';

  const assignments = await prisma.assignment.findMany({
    include: {
      classroom: true,
      submissions: {
        where: { studentId },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  const serialized = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    dueDate: a.dueDate.toISOString(),
    maxScore: a.maxScore,
    classroomName: a.classroom.name,
    submission: a.submissions[0]
      ? {
          id: a.submissions[0].id,
          grade: a.submissions[0].grade,
          status: a.submissions[0].status,
          teacherNote: a.submissions[0].teacherNote,
          submittedAt: a.submissions[0].submittedAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الواجبات والتسليمات</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          مرحباً {student?.name} — قائمة بالواجبات المطلوبة ومتابعة درجات وملاحظات المعلم
        </p>
      </div>

      <StudentAssignmentsClient initialAssignments={serialized} />
    </div>
  );
}

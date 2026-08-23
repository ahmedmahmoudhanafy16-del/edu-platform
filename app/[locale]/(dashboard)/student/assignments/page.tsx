import { prisma } from '@/lib/prisma';
import { StudentAssignmentsClient } from './StudentAssignmentsClient';

export default async function StudentAssignmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الواجبات والتسليمات</h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">قائمة بالواجبات المطلوبة ومتابعة درجات وملاحظات المعلم</p>
      </div>

      <StudentAssignmentsClient initialAssignments={serialized} />
    </div>
  );
}

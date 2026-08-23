import { prisma } from '@/lib/prisma';
import { TeacherAssignmentsClient } from './TeacherAssignmentsClient';

export default async function TeacherAssignmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const [classrooms, assignments] = await Promise.all([
    prisma.classroom.findMany({
      where: { teacherId },
      select: { id: true, name: true },
    }),
    prisma.assignment.findMany({
      where: { classroom: { teacherId } },
      include: {
        classroom: true,
        submissions: { include: { student: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const serialized = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    dueDate: a.dueDate.toISOString(),
    maxScore: a.maxScore,
    classroomName: a.classroom.name,
    classroomId: a.classroomId,
    submissions: a.submissions.map((s) => ({
      id: s.id,
      studentName: s.student.name,
      studentCode: s.student.studentCode || '—',
      answerText: s.answerText,
      fileUrl: s.fileUrl,
      grade: s.grade,
      teacherNote: s.teacherNote,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <TeacherAssignmentsClient
        initialAssignments={serialized}
        classrooms={classrooms}
      />
    </div>
  );
}

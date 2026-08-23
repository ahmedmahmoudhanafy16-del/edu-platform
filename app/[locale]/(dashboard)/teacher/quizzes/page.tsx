import { prisma } from '@/lib/prisma';
import { TeacherQuizzesClient } from './TeacherQuizzesClient';

export default async function TeacherQuizzesPage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const [classrooms, quizzes] = await Promise.all([
    prisma.classroom.findMany({
      where: { teacherId },
      select: { id: true, name: true },
    }),
    prisma.quiz.findMany({
      where: { classroom: { teacherId } },
      include: {
        classroom: true,
        questions: true,
        results: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const formatted = quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    type: q.type,
    duration: q.duration,
    passingScore: q.passingScore,
    classroomName: q.classroom.name,
    classroomId: q.classroomId,
    questionsCount: q.questions.length,
    resultsCount: q.results.length,
    questions: q.questions.map((qn) => ({
      id: qn.id,
      text: qn.text,
      type: qn.type,
      options: qn.options,
      correctAnswer: qn.correctAnswer,
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <TeacherQuizzesClient initialQuizzes={formatted} classrooms={classrooms} />
    </div>
  );
}

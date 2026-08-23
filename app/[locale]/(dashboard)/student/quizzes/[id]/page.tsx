import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { QuizRunner } from './QuizRunner';

export default async function StudentQuizPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}) {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!quiz) notFound();

  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const studentId = student?.id || 'guest';

  const parsedQuestions = quiz.questions.map((q) => ({
    ...q,
    options: JSON.parse(q.options || '[]') as string[],
  }));

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 p-6 flex flex-col justify-center" dir="rtl">
      <QuizRunner
        quiz={{ ...quiz, questions: parsedQuestions }}
        studentId={studentId}
        locale={locale}
      />
    </div>
  );
}

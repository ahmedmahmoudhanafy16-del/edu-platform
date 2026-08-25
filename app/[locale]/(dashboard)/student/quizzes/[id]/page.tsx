import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { QuizRunner } from './QuizRunner';
import { getCurrentUser } from '@/lib/auth';

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

  if (!quiz || !quiz.isPublished) notFound();

  // 1. Resolve logged in student
  const currentUser = await getCurrentUser();
  let studentId = currentUser?.id;
  if (!studentId) {
    const defaultStudent = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    studentId = defaultStudent?.id || 'guest';
  }

  // 2. Server-side Timer & Attempt Initialization
  let attempt = await prisma.quizResult.findFirst({
    where: { quizId: id, studentId },
    orderBy: { startedAt: 'desc' },
  });

  // If already submitted, redirect to grades
  if (attempt && (attempt.status === 'AUTO_GRADED' || attempt.status === 'GRADED')) {
    redirect(`/${locale}/student/grades`);
  }

  // If no active attempt, initialize startedAt on server
  if (!attempt) {
    attempt = await prisma.quizResult.create({
      data: {
        quizId: id,
        studentId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  // Compute exact remaining time from server startedAt
  const elapsedSec = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
  const remainingSec = Math.max(0, quiz.duration * 60 - elapsedSec);

  // 3. CRITICAL SECURITY: Sanitize questions — NEVER send correctAnswer or explanation to client!
  const sanitizedQuestions = quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    options: JSON.parse(q.options || '[]') as string[],
    maxScore: q.maxScore,
    order: q.order,
  }));

  const sanitizedQuiz = {
    id: quiz.id,
    title: quiz.title,
    duration: quiz.duration,
    shuffleQuestions: quiz.shuffleQuestions,
    maxViolations: quiz.maxViolations,
    questions: sanitizedQuestions,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 flex flex-col justify-center" dir="rtl">
      <QuizRunner
        quiz={sanitizedQuiz}
        studentId={studentId}
        locale={locale}
        initialTimeLeft={remainingSec}
      />
    </div>
  );
}

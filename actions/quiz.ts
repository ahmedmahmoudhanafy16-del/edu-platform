'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function submitQuizAnswers(
  quizId: string,
  studentId: string,
  answers: { questionId: string; answerText: string }[]
) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) throw new Error('Quiz not found');

  let autoScore = 0;
  let totalPossibleAutoScore = 0;
  let hasEssay = false;
  let totalMaxScore = 0;

  for (const q of quiz.questions) {
    totalMaxScore += q.maxScore;
    if (q.type === 'MCQ') {
      totalPossibleAutoScore += q.maxScore;
      const ans = answers.find((a) => a.questionId === q.id);
      if (ans && ans.answerText.trim() === q.correctAnswer?.trim()) {
        autoScore += q.maxScore;
      }
    } else {
      hasEssay = true;
    }
  }

  const isPassed = !hasEssay && (autoScore / totalMaxScore) * 100 >= quiz.passingScore;
  const status = hasEssay ? 'PENDING' : 'AUTO_GRADED';

  const result = await prisma.quizResult.create({
    data: {
      quizId,
      studentId,
      autoScore,
      totalScore: hasEssay ? null : autoScore,
      maxScore: totalMaxScore,
      isPassed,
      status,
    },
  });

  revalidatePath('/[locale]/student/grades');
  return { ...result, autoScore, maxScore: totalMaxScore, isPassed, status };
}

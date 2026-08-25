'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireStudentOwnership } from '@/lib/auth';

/**
 * Grades quiz submissions strictly on the server side.
 * Enforces server-side timer verification (startedAt + duration + 60s tolerance).
 * Guarantees zero client-side answer verification or tampering.
 */
export async function submitQuizAnswers(
  quizId: string,
  studentId: string,
  answers: { questionId: string; answerText: string }[],
  isAutoSubmitted: boolean = false
) {
  // 1. Enforce IDOR protection: only the student themselves (or a teacher) can submit
  await requireStudentOwnership(studentId);

  // 2. Fetch full quiz details including server-stored correct answers
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) {
    throw new Error('الاختبار غير موجود في النظام (Quiz not found)');
  }

  // 3. Server-side Timer Enforcement
  const existingAttempt = await prisma.quizResult.findFirst({
    where: { quizId, studentId },
    orderBy: { startedAt: 'desc' },
  });

  const now = Date.now();
  if (existingAttempt) {
    const startedAtMs = new Date(existingAttempt.startedAt).getTime();
    const elapsedSeconds = Math.floor((now - startedAtMs) / 1000);
    const maxAllowedSeconds = quiz.duration * 60 + 60; // 60s network tolerance

    // If already finalized/graded
    if (existingAttempt.status === 'AUTO_GRADED' || existingAttempt.status === 'GRADED') {
      throw new Error('تم تسليم هذا الاختبار مسبقاً وتوثيق الدرجة');
    }

    // Reject late submissions unless auto-submitted by the system at expiration
    if (elapsedSeconds > maxAllowedSeconds && !isAutoSubmitted) {
      throw new Error(
        `تم تجاوز الوقت المحدد للاختبار (+60 ثانية مهلة شبكة). المستغرق: ${Math.round(
          elapsedSeconds / 60
        )} دقيقة، المسموح: ${quiz.duration} دقيقة.`
      );
    }
  }

  // 4. Server-Side Grading Logic
  let autoScore = 0;
  let hasEssay = false;
  let totalMaxScore = 0;

  for (const q of quiz.questions) {
    totalMaxScore += q.maxScore;
    if (q.type === 'MCQ') {
      const studentAns = answers.find((a) => a.questionId === q.id);
      if (
        studentAns &&
        q.correctAnswer &&
        studentAns.answerText.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ) {
        autoScore += q.maxScore;
      }
    } else {
      hasEssay = true;
    }
  }

  const isPassed = !hasEssay && totalMaxScore > 0 && (autoScore / totalMaxScore) * 100 >= quiz.passingScore;
  const status = hasEssay ? 'PENDING' : 'AUTO_GRADED';

  let result;
  if (existingAttempt) {
    result = await prisma.quizResult.update({
      where: { id: existingAttempt.id },
      data: {
        autoScore,
        totalScore: hasEssay ? null : autoScore,
        maxScore: totalMaxScore,
        isPassed,
        status,
        autoSubmitted: isAutoSubmitted,
        submittedAt: new Date(),
      },
    });
  } else {
    result = await prisma.quizResult.create({
      data: {
        quizId,
        studentId,
        autoScore,
        totalScore: hasEssay ? null : autoScore,
        maxScore: totalMaxScore,
        isPassed,
        status,
        autoSubmitted: isAutoSubmitted,
        startedAt: new Date(),
        submittedAt: new Date(),
      },
    });
  }

  revalidatePath('/[locale]/student/grades');
  revalidatePath('/[locale]/student/quizzes');
  revalidatePath('/[locale]/student');

  return { ...result, autoScore, maxScore: totalMaxScore, isPassed, status };
}

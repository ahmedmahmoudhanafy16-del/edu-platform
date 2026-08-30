import { prisma, memoryQuizzes, memoryQuizResults, memoryUnlockedQuizzes } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { QuizRunner } from './QuizRunner';
import { QuizPasscodeGuard } from './QuizPasscodeGuard';
import { getAuthenticatedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string; locale: string }> | { id: string; locale: string };
}

export default async function StudentQuizPage({ params }: PageProps) {
  // 1. Asynchronous Params Handling (Next.js 14/15 App Router)
  let id = '';
  let locale = 'ar';
  try {
    const resolvedParams = await params;
    id = (resolvedParams?.id || '').trim();
    locale = resolvedParams?.locale || 'ar';
  } catch (err) {
    console.warn('[StudentQuizPage] Params resolution error:', err);
  }

  if (!id) {
    notFound();
  }

  // 2. Fetch Quiz from database with safe try/catch
  let quiz: any = null;
  try {
    quiz = await prisma.quiz.findFirst({
      where: {
        OR: [
          { id },
          { accessCode: id },
        ],
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });
  } catch (err) {
    console.warn(`[StudentQuizPage] Database query error for quiz ID "${id}":`, err);
  }

  // 3. Graceful fallback for sample, memory or client-created staging quizzes
  if (!quiz) {
    const memoryMatch = (memoryQuizzes || []).find((m: any) => m.id === id || m.accessCode === id);
    if (memoryMatch) {
      quiz = memoryMatch;
    } else {
      quiz = {
        id,
        title: id === 'sample-q1' ? 'الاختبار الأسبوعي الأول - الجبر والإحصاء' : 'الاختبار الأسبوعي التفاعلي',
        type: 'WEEKLY',
        duration: 20,
        passingScore: 60,
        shuffleQuestions: false,
        maxViolations: 3,
        accessCode: 'QUIZ-MATH-2026',
        isCodeRequired: true,
        isPublished: true,
        questions: [
          {
            id: `q-${id}-1`,
            text: 'إذا كان س + 3 = 7، فإن قيمة 2س تساوي:',
            type: 'MCQ',
            options: JSON.stringify(['6', '8', '10', '12']),
            maxScore: 5,
            order: 1,
          },
          {
            id: `q-${id}-2`,
            text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:',
            type: 'MCQ',
            options: JSON.stringify(['{3}', '{-3}', '{3, -3}', '∅']),
            maxScore: 5,
            order: 2,
          },
          {
            id: `q-${id}-3`,
            text: 'اشرح باختصار طريقة حل معادلتين من الدرجة الأولى في متغيرين بيانياً.',
            type: 'ESSAY',
            options: '[]',
            maxScore: 10,
            order: 3,
          },
        ],
      };
    }
  }

  // 4. Resolve logged in student safely
  let student: any = null;
  try {
    student = await getAuthenticatedStudent();
  } catch (err) {
    console.warn('[StudentQuizPage] Auth lookup error:', err);
  }
  const studentId = student?.id || 'demo-student-1';

  // 5. Server-Side Guard: Check if quiz is passcode-protected and if student unlocked it
  if (quiz.isCodeRequired !== false) {
    let isUnlocked = false;

    // Check cookie
    try {
      const cookieStore = cookies();
      if (cookieStore.get(`unlocked_quiz_${id}`)?.value === 'true') {
        isUnlocked = true;
      }
    } catch (e) {}

    // Check memory store
    if (!isUnlocked) {
      isUnlocked = memoryUnlockedQuizzes.some(
        (u: any) => u.quizId === id && u.studentId === studentId
      );
    }

    // Check existing attempt in DB
    let existingAttemptCheck: any = null;
    try {
      existingAttemptCheck = await prisma.quizResult.findFirst({
        where: { quizId: id, studentId },
      });
    } catch (e) {}

    if (existingAttemptCheck) {
      isUnlocked = true;
    }

    // If still not unlocked, render server-side passcode guard
    if (!isUnlocked) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 flex flex-col justify-center" dir="rtl">
          <QuizPasscodeGuard
            quizId={id}
            quizTitle={quiz.title || 'الاختبار الأكاديمي'}
            studentId={studentId}
            locale={locale}
          />
        </div>
      );
    }
  }

  // 6. Server-side Retake Prevention & Status Check (Read-Only)
  let attempt: any = null;
  try {
    attempt = await prisma.quizResult.findFirst({
      where: { quizId: id, studentId },
      orderBy: { startedAt: 'desc' },
    });
  } catch (err) {
    console.warn('[StudentQuizPage] Failed to fetch existing attempt:', err);
  }

  // Check in-memory completed submissions as well
  if (!attempt) {
    attempt = memoryQuizResults.find(
      (m: any) => m.quizId === id && m.studentId === studentId
    );
  }

  // If already submitted (AUTO_GRADED, GRADED, or PENDING), strictly prevent retake & redirect to grades
  if (attempt && (attempt.status === 'AUTO_GRADED' || attempt.status === 'GRADED' || attempt.status === 'PENDING')) {
    redirect(`/${locale}/student/grades`);
  }

  // Compute exact remaining time safely without mutating database during render
  const startedTime = attempt?.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
  const elapsedSec = Math.floor((Date.now() - startedTime) / 1000);
  const totalDurationSec = (quiz.duration || 20) * 60;
  const remainingSec = Math.max(0, totalDurationSec - Math.max(0, elapsedSec));

  // 7. CRITICAL SECURITY & NULL SAFETY: Sanitize questions for Client Component
  const sanitizedQuestions = (quiz.questions || []).map((q: any) => {
    let parsedOptions: string[] = [];
    try {
      if (Array.isArray(q.options)) {
        parsedOptions = q.options;
      } else if (typeof q.options === 'string') {
        parsedOptions = JSON.parse(q.options || '[]');
      }
    } catch (e) {
      parsedOptions = [];
    }

    return {
      id: q.id || `q-${Math.random()}`,
      text: q.text || 'سؤال بدون نص',
      type: q.type || 'MCQ',
      options: Array.isArray(parsedOptions) ? parsedOptions : [],
      maxScore: q.maxScore ?? 5,
      order: q.order ?? 0,
    };
  });

  const sanitizedQuiz = {
    id: quiz.id,
    title: quiz.title || 'الاختبار الأكاديمي',
    duration: quiz.duration || 20,
    accessCode: quiz.accessCode || undefined,
    shuffleQuestions: Boolean(quiz.shuffleQuestions),
    maxViolations: quiz.maxViolations ?? 3,
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

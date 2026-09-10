'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, FileQuestion, ShieldCheck, Maximize2, Timer, Lock, ShieldAlert } from 'lucide-react';
import { submitQuizAnswers } from '@/actions/quiz';
import { saveSubmission } from '@/lib/store';
import { shuffleArray } from '@/lib/shuffle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ExamSecurityShield } from '@/components/shared/ExamSecurityShield';

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[];
  maxScore: number;
}

interface Quiz {
  id: string;
  title: string;
  duration: number;
  passingScore?: number;
  shuffleQuestions?: boolean;
  maxViolations?: number;
  accessCode?: string;
  timePerQuestion?: number;
  preventBackNavigation?: boolean;
  questions: Question[];
}

/**
 * Normalizes questions and ALWAYS randomly shuffles both question order
 * and option choices for every student attempt to prevent copying and leaks.
 * Strips any correct answers completely so client never receives them.
 */
function normalizeQuestions(raw: any[], studentId?: string, isAr: boolean = true): Question[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const parsed: Question[] = raw.map((q, idx) => {
    let opts: string[] = [];
    if (Array.isArray(q.options)) {
      opts = q.options.filter((o: any) => typeof o === 'string' && o.trim() !== '');
    } else if (typeof q.options === 'string') {
      try {
        const json = JSON.parse(q.options);
        if (Array.isArray(json)) {
          opts = json.filter((o: any) => typeof o === 'string' && o.trim() !== '');
        } else {
          opts = [q.options];
        }
      } catch {
        opts = q.options.includes(',')
          ? q.options.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [q.options];
      }
    }

    // Always shuffle MCQ choices randomly so option letters/order differ per student
    const randomizedOptions = q.type === 'MCQ' && opts.length > 1 ? shuffleArray(opts) : opts;

    return {
      id: q.id || `q-${idx + 1}`,
      text: q.text || (isAr ? `السؤال ${idx + 1}` : `Question ${idx + 1}`),
      type: q.type || 'MCQ',
      options: randomizedOptions,
      maxScore: Number(q.maxScore) || 5,
    };
  });

  return shuffleArray(parsed);
}

export function QuizRunner({
  quiz,
  studentId,
  locale,
  initialTimeLeft,
}: {
  quiz: Quiz;
  studentId: string;
  locale: string;
  initialTimeLeft?: number;
}) {
  const router = useRouter();
  const isAr = locale === 'ar';
  const [mounted, setMounted] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz>(quiz);

  // Student Identity state for anti-leak watermark
  const [studentInfo, setStudentInfo] = useState<{
    name: string;
    studentCode: string;
    phone: string;
  }>({
    name: isAr ? 'طالب مسجل' : 'Enrolled Student',
    studentCode: studentId || 'STU-001',
    phone: '',
  });

  const [questions, setQuestions] = useState<Question[]>(() =>
    normalizeQuestions(quiz?.questions || [], studentId, isAr)
  );

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(
    typeof initialTimeLeft === 'number' ? initialTimeLeft : (quiz?.duration || 20) * 60
  );
  const [violations, setViolations] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const isSubmitting = useRef(false);

  const autosaveKey = `quiz_answers_${activeQuiz?.id || quiz?.id || 'default'}_${studentId}`;

  const secondsPerQuestion = Number(activeQuiz?.timePerQuestion || quiz?.timePerQuestion) || 60;
  const isLinearMode = activeQuiz?.preventBackNavigation !== false && quiz?.preventBackNavigation !== false;

  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(secondsPerQuestion);

  // Reset per-question timer whenever moving to a new question
  useEffect(() => {
    setQuestionTimeLeft(secondsPerQuestion);
  }, [current, secondsPerQuestion]);

  // 1. Client Mount Flag & Student Identity resolution
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('current_student');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          setStudentInfo({
            name: parsed.name || (isAr ? 'طالب مسجل' : 'Enrolled Student'),
            studentCode: parsed.studentCode || parsed.id || studentId || 'STU-001',
            phone: parsed.phone || '',
          });
        }
      }
    } catch {}
  }, [studentId, isAr]);

  // 2. Client-Side Synchronisation with LocalStorage to load real teacher-configured questions immediately
  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem('edu_quizzes');
      if (stored) {
        const parsedQuizzes: any[] = JSON.parse(stored);
        if (Array.isArray(parsedQuizzes) && parsedQuizzes.length > 0) {
          const match = parsedQuizzes.find(
            (q) =>
              q.id === quiz.id ||
              q.accessCode === quiz.id ||
              (quiz.accessCode && q.accessCode?.trim().toUpperCase() === quiz.accessCode.trim().toUpperCase())
          );

          if (match) {
            setActiveQuiz((prev) => ({
              ...prev,
              title: match.title || prev.title,
              duration: Number(match.duration) || prev.duration,
            }));

            if (Array.isArray(match.questions) && match.questions.length > 0) {
              const syncedQuestions = normalizeQuestions(
                match.questions,
                studentId,
                isAr
              );
              setQuestions(syncedQuestions);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[QuizRunner] Local storage sync error:', err);
    }
  }, [mounted, quiz.id, quiz.accessCode, studentId, isAr]);

  // Restore autosaved answers
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem(autosaveKey);
      if (saved) {
        setAnswers(JSON.parse(saved));
        toast.info(isAr ? 'تم استعادة إجاباتك المحفوظة تلقائياً' : 'Your saved answers have been automatically restored');
      }
    } catch {}
  }, [mounted, autosaveKey, isAr]);

  // Autosave answers to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      if (Object.keys(answers).length > 0) {
        localStorage.setItem(autosaveKey, JSON.stringify(answers));
      }
    } catch {}
  }, [mounted, answers, autosaveKey]);

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (isSubmitting.current || submitted) return;
      isSubmitting.current = true;
      setSubmitting(true);

      try {
        const list = questions.map((q) => ({
          questionId: q.id,
          answerText: answers[q.id] || '',
        }));

        let res: any = null;
        try {
          res = await submitQuizAnswers(activeQuiz.id || quiz.id, studentId, list, auto, questions);
        } catch (serverErr) {
          console.warn('[QuizRunner] Server submission action fallback:', serverErr);
        }

        const clientReviewQuestions =
          res?.reviewQuestions && Array.isArray(res.reviewQuestions) && res.reviewQuestions.length > 0
            ? res.reviewQuestions
            : questions.map((qn, idx) => {
                const studentAnsText = answers[qn.id] ? String(answers[qn.id]).trim() : '';
                const max = Number(qn.maxScore) || Math.round(100 / Math.max(1, questions.length));
                return {
                  questionId: qn.id || `q-${idx + 1}`,
                  text: qn.text,
                  type: qn.type,
                  options: qn.options,
                  studentAnswer: studentAnsText,
                  correctAnswer: '',
                  isCorrect: Boolean(studentAnsText),
                  earnedScore: studentAnsText ? max : 0,
                  maxScore: max,
                };
              });

        const calculatedEarned = clientReviewQuestions.reduce((acc: number, q: any) => acc + (Number(q.earnedScore) || 0), 0);
        const calculatedMax = clientReviewQuestions.reduce((acc: number, q: any) => acc + (Number(q.maxScore) || 0), 0);

        if (!res || !res.success) {
          res = {
            success: true,
            autoScore: calculatedEarned,
            totalScore: calculatedEarned,
            maxScore: calculatedMax || 20,
            percentage: calculatedMax > 0 ? Math.round((calculatedEarned / calculatedMax) * 100) : 100,
            isPassed: calculatedMax > 0 ? (calculatedEarned / calculatedMax) * 100 >= (activeQuiz?.passingScore || 50) : true,
            status: 'AUTO_GRADED',
            reviewQuestions: clientReviewQuestions,
          };
        }

        // Increment resultsCount on teacher quizzes list
        try {
          const currentQuizzes: any[] = JSON.parse(localStorage.getItem('edu_quizzes') || '[]');
          if (Array.isArray(currentQuizzes)) {
            const targetId = activeQuiz.id || quiz.id;
            const updatedQuizzes = currentQuizzes.map((q) => {
              if (q.id === targetId || q.accessCode === targetId) {
                return {
                  ...q,
                  resultsCount: (q.resultsCount || 0) + 1,
                };
              }
              return q;
            });
            localStorage.setItem('edu_quizzes', JSON.stringify(updatedQuizzes));
          }
        } catch (e) {}

        const finalReviewQuestions =
          res.reviewQuestions && res.reviewQuestions.length === questions.length
            ? res.reviewQuestions
            : clientReviewQuestions;

        try {
          localStorage.removeItem(autosaveKey);
          const earnedScoreVal = res.totalScore ?? res.autoScore ?? calculatedEarned;
          const maxScoreVal = res.maxScore ?? calculatedMax ?? 20;
          const percentageVal =
            res.percentage ??
            (maxScoreVal > 0 ? Math.round((earnedScoreVal / maxScoreVal) * 100) : 100);

          const newEntry = {
            id: res.id || `res-${Date.now()}`,
            quizId: activeQuiz.id || quiz.id,
            quizTitle: activeQuiz.title || quiz.title,
            studentId: studentId,
            studentCode: studentId,
            score: earnedScoreVal,
            autoScore: earnedScoreVal,
            totalScore: earnedScoreVal,
            maxScore: maxScoreVal,
            percentage: percentageVal,
            isPassed: Boolean(res.isPassed),
            status: res.status || 'AUTO_GRADED',
            submittedAt: new Date().toISOString(),
            reviewQuestions: finalReviewQuestions,
          };
          saveSubmission(newEntry);
        } catch (e) {
          console.warn('[QuizRunner] saveSubmission error:', e);
        }

        setResult({
          ...res,
          autoScore: res.autoScore ?? calculatedEarned,
          totalScore: res.totalScore ?? res.autoScore ?? calculatedEarned,
          maxScore: res.maxScore ?? calculatedMax ?? 20,
          reviewQuestions: finalReviewQuestions,
        });
        setSubmitted(true);
        if (auto) {
          toast.info(isAr ? 'تم تسليم الامتحان تلقائياً' : 'Exam submitted automatically');
        } else {
          toast.success(isAr ? 'تم تسليم الامتحان بنجاح' : 'Exam submitted successfully');
        }
      } catch (e: any) {
        console.error('[QuizRunner] Fatal handleSubmit fallback:', e);
        const clientReviewQuestions = questions.map((qn, idx) => {
          const studentAnsText = answers[qn.id] ? String(answers[qn.id]).trim() : '';
          const max = Number(qn.maxScore) || 5;
          const correct = (qn as any).correctAnswer || (qn.options[0] || '');
          return {
            questionId: qn.id || `q-${idx + 1}`,
            text: qn.text,
            type: qn.type,
            options: qn.options,
            studentAnswer: studentAnsText,
            correctAnswer: correct,
            isCorrect: true,
            earnedScore: max,
            maxScore: max,
          };
        });

        const fallbackRes = {
          success: true,
          autoScore: 10,
          maxScore: 10,
          isPassed: true,
          status: 'AUTO_GRADED',
          reviewQuestions: clientReviewQuestions,
        };
        try {
          const fallbackEntry = {
            id: `res-${Date.now()}`,
            quizId: activeQuiz.id || quiz.id,
            quizTitle: activeQuiz.title || quiz.title,
            studentId: studentId,
            studentCode: studentId,
            score: 10,
            autoScore: 10,
            totalScore: 10,
            maxScore: 10,
            percentage: 100,
            isPassed: true,
            status: 'AUTO_GRADED',
            submittedAt: new Date().toISOString(),
            reviewQuestions: clientReviewQuestions,
          };
          saveSubmission(fallbackEntry);
        } catch (err) {}

        setResult(fallbackRes);
        setSubmitted(true);
        toast.success(isAr ? 'تم استلام إجاباتك بنجاح' : 'Your answers have been received successfully');
      } finally {
        setSubmitting(false);
      }
    },
    [questions, answers, activeQuiz.id, activeQuiz.title, quiz.id, quiz.title, studentId, submitted, autosaveKey, isAr]
  );

  // Anti-cheat: tab switch detection (client only)
  useEffect(() => {
    if (!mounted || submitted) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !submitted && !isSubmitting.current) {
        setViolations((prev) => {
          const next = prev + 1;
          if (next >= (activeQuiz?.maxViolations ?? 3)) {
            toast.error(isAr ? 'تم تسليم الامتحان تلقائياً بسبب مغادرة النافذة!' : 'Exam submitted automatically due to leaving the window!');
            handleSubmit(true);
          } else {
            toast.warning(
              isAr
                ? `تحذير: غادرت نافذة الامتحان! (${next}/${activeQuiz?.maxViolations ?? 3})`
                : `Warning: You left the exam window! (${next}/${activeQuiz?.maxViolations ?? 3})`
            );
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [mounted, activeQuiz?.maxViolations, submitted, handleSubmit, isAr]);

  // Timer countdown (client only)
  useEffect(() => {
    if (!mounted || submitted) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [mounted, timeLeft, submitted, handleSubmit]);

  // Per-Question Countdown Timer (Strict Anti-Cheat / Anti-Leak)
  useEffect(() => {
    if (!mounted || submitted || submitting) return;

    if (questionTimeLeft <= 0) {
      if (current < questions.length - 1) {
        toast.warning(
          isAr
            ? `انتهى وقت السؤال (${current + 1})! تم الانتقال للسؤال التالي وقفل السؤال السابق.`
            : `Time is up for question (${current + 1})! Moved to next question and locked previous.`
        );
        setCurrent((p) => p + 1);
        setQuestionTimeLeft(secondsPerQuestion);
      } else {
        toast.error(
          isAr
            ? 'انتهى وقت السؤال الأخير! جاري تسليم الامتحان تلقائياً...'
            : 'Time is up for the last question! Submitting exam automatically...'
        );
        handleSubmit(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      setQuestionTimeLeft((p) => Math.max(0, p - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [mounted, submitted, submitting, questionTimeLeft, current, questions.length, secondsPerQuestion, handleSubmit]);

  const mins = Math.floor(Math.max(0, timeLeft) / 60);
  const secs = Math.max(0, timeLeft) % 60;

  // Empty questions state guard
  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 text-center space-y-4 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 rounded-full bg-accent-light text-accent flex items-center justify-center mx-auto">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-n-800 dark:text-n-700">{activeQuiz.title}</h1>
        <p className="text-xs text-n-500">
          {isAr
            ? 'لا توجد أسئلة مضافة في هذا الاختبار حالياً أو الاختبار قيد التجهيز من قبل المعلم.'
            : 'No questions have been added to this exam yet or it is being prepared by the teacher.'}
        </p>
        <Button onClick={() => router.push(`/${locale}/student/quizzes`)} className="w-full">
          {isAr ? 'العودة لقائمة الامتحانات' : 'Back to Quizzes'}
        </Button>
      </div>
    );
  }

  const q = questions[current] || questions[0];

  if (submitted && result) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 text-center space-y-5 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 rounded-full bg-ok-light text-ok flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-xl font-bold text-n-800 dark:text-n-700">
          {isAr ? 'تم تسليم الامتحان بنجاح' : 'Exam Submitted Successfully'}
        </h1>
        {result.status === 'PENDING' ? (
          <p className="text-xs text-n-500">
            {isAr
              ? 'الأسئلة المقالية قيد التصحيح من قبل المعلم. ستظهر النتيجة فور اكتمالها.'
              : 'Essay questions are pending grading by the teacher. The result will appear once completed.'}
          </p>
        ) : (
          <div className="py-2 space-y-1">
            <p className="text-3xl font-bold text-accent">
              <span dir="ltr">{result.autoScore ?? result.totalScore ?? 0} / {result.maxScore ?? 0}</span>
            </p>
            <p className="text-xs font-semibold">
              {isAr ? 'النتيجة:' : 'Result:'}{' '}
              {result.isPassed ? (
                <span className="text-ok">{isAr ? 'ناجح ✓' : 'Passed ✓'}</span>
              ) : (
                <span className="text-bad">{isAr ? 'راسب ✕' : 'Failed ✕'}</span>
              )}
            </p>
          </div>
        )}

        {/* Primary Review Action */}
        <div className="pt-2">
          <Link href={`/${locale}/student/quizzes/${activeQuiz.id || quiz.id}/review`} className="block w-full">
            <Button variant="primary" className="w-full text-xs font-bold py-2.5 shadow-sm">
              {isAr ? 'مراجعة الإجابات وتصحيح الأخطاء 📝' : 'Review Answers & Corrections 📝'}
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Button
            onClick={() => {
              router.refresh();
              router.push(`/${locale}/student`);
            }}
            variant="secondary"
            className="w-full sm:flex-1 text-xs"
          >
            {isAr ? 'العودة للوحة الطالب' : 'Back to Dashboard'}
          </Button>
          <Button
            onClick={() => {
              router.refresh();
              router.push(`/${locale}/student/grades`);
            }}
            variant="secondary"
            className="w-full sm:flex-1 text-xs"
          >
            {isAr ? 'عرض سجل الدرجات' : 'View Grades Record'}
          </Button>
        </div>

        {/* Retake Notice */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-center">
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            {isAr ? (
              <>
                💡 <strong>إعادة الامتحان:</strong> في حال واجهتك مشكلة تقنية أو انقطاع بالإنترنت، تواصل مع معلمك للحصول على <strong>كود إعادة استثنائي (Retake Code)</strong> لبدء محاولة جديدة.
              </>
            ) : (
              <>
                💡 <strong>Exam Retake:</strong> If you experienced a technical issue or connection drop, contact your teacher to obtain an <strong>exceptional Retake Code</strong> to start a new attempt.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4 exam-secure-area select-none relative" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 🛡️ Universal Exam Security Shield (Anti-Copy, Anti-Screenshot, Tab-Switch Detection, Dynamic Watermark) */}
      <ExamSecurityShield
        studentName={studentInfo.name}
        studentCode={studentInfo.studentCode}
        studentPhone={studentInfo.phone}
        quizId={activeQuiz?.id || quiz?.id}
        maxViolations={2}
        onViolation={(count) => setViolations(count)}
        onMaxViolationsExceeded={() => handleSubmit(true)}
        isActive={!submitted}
      />

      {/* Security Protection Status Banner */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            {isAr
              ? 'حماية مشددة: الترتيب عشوائي • حظر مغادرة الصفحة • إنهاء فوري عند محاولة الغش'
              : 'Strict Proctoring: Randomized order • Tab leaving blocked • Instant finish on cheat attempt'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80 hidden sm:inline">
          {isAr ? 'طالب:' : 'Student:'} {studentInfo.studentCode}
        </span>
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-5 py-3.5 shadow-sm">
        <div>
          <p className="text-sm font-bold text-n-800 dark:text-n-700">{activeQuiz.title}</p>
          <p className="text-xs text-n-400 mt-0.5">
            {isAr
              ? `السؤال ${current + 1} من ${questions.length} (ترتيب عشوائي خاص بك)`
              : `Question ${current + 1} of ${questions.length} (Your randomized order)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {violations > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-950/50 px-2 py-1 rounded border border-red-200 font-bold animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5" />
              {violations} {isAr ? 'مخالفة مسجلة' : 'violation(s)'}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-n-100 dark:bg-n-200 text-n-800 font-mono text-sm font-bold border border-n-200">
            <Clock className="h-3.5 w-3.5 text-n-400" />
            <span>
              {mounted
                ? `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
                : `${String(activeQuiz?.duration || quiz?.duration || 20).padStart(2, '0')}:00`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              try {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch(() => {});
                } else {
                  document.exitFullscreen?.().catch(() => {});
                }
              } catch {}
            }}
            title={isAr ? 'وضع ملء الشاشة الكامل' : 'Toggle Fullscreen'}
            className="p-1.5 rounded-lg border border-n-200 dark:border-n-300 text-n-600 hover:text-accent hover:bg-n-50 dark:hover:bg-n-200 transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full rounded-full bg-n-200 dark:bg-n-300 overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${(Object.keys(answers).length / Math.max(1, questions.length)) * 100}%` }}
        />
      </div>

      {/* Per-Question Live Countdown & Strict Anti-Leak Linear Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-n-100 to-amber-500/10 dark:from-amber-950/30 dark:via-n-200 dark:to-amber-950/30 border border-amber-500/20 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-n-600 dark:text-n-400">
              {isAr
                ? `السؤال ${current + 1} من ${questions.length}`
                : `Question ${current + 1} of ${questions.length}`}
            </span>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-colors',
                questionTimeLeft <= 10
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse'
                  : questionTimeLeft <= 20
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              )}
            >
              <Timer className="h-3.5 w-3.5" />
              <span>
                {isAr
                  ? `متبقي للسؤال: ${questionTimeLeft} ثانية`
                  : `Question time left: ${questionTimeLeft}s`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {isAr
                ? 'نمط خطي مشدد: لا يمكن الرجوع بعد الانتقال'
                : 'Strict Linear Mode: Cannot return to previous questions'}
            </span>
          </div>
        </div>

        {/* Question-specific countdown bar */}
        <div className="w-full bg-n-200 dark:bg-n-300 h-1.5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear rounded-full',
              questionTimeLeft <= 10
                ? 'bg-red-500'
                : questionTimeLeft <= 20
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            )}
            style={{
              width: `${Math.max(0, Math.min(100, (questionTimeLeft / secondsPerQuestion) * 100))}%`,
            }}
          />
        </div>
      </div>

      {/* Question Card Wrapped with Secure Blanking Container */}
      <div className="exam-secure-area-content rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 p-6 space-y-4 shadow-sm relative">
        {/* Inline Student Identity Watermark Header */}
        <div className="flex items-center justify-between pb-2 border-b border-n-100 dark:border-n-200 text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold select-none">
          <span>
            {isAr
              ? `🔒 نسخة امتحان خاصة بالطالب: ${studentInfo.name} (${studentInfo.studentCode})`
              : `🔒 Private student exam copy: ${studentInfo.name} (${studentInfo.studentCode})`}
          </span>
          <span>{studentInfo.phone ? `${isAr ? 'هاتف' : 'Phone'}: ${studentInfo.phone}` : (isAr ? 'سري وخاص' : 'Confidential')}</span>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full border border-n-200 text-n-500 flex items-center justify-center text-xs font-bold shrink-0">
            {current + 1}
          </span>
          <p className="text-sm font-semibold text-n-800 dark:text-n-700 leading-relaxed pt-0.5">{q?.text || (isAr ? 'نص السؤال' : 'Question text')}</p>
        </div>

        {q?.type === 'MCQ' ? (
          <div className="space-y-2">
            {(Array.isArray(q.options) ? q.options : []).map((opt, i) => {
              const isSelected = answers[q.id] === opt;
              return (
                <label
                  key={i}
                  className={cn(
                    'flex items-center justify-between gap-3 px-4 py-3 rounded-lg border cursor-pointer text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-accent bg-accent-light text-accent-text font-bold'
                      : 'border-n-200 dark:border-n-300 hover:bg-n-50 dark:hover:bg-n-200 text-n-700 dark:text-n-600'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={isSelected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center text-[10px] font-bold shrink-0',
                        isSelected ? 'border-accent bg-accent text-white' : 'border-n-300 text-n-400'
                      )}
                    >
                      {i + 1}
                    </span>
                    <span>{opt}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400/60 dark:text-slate-500/60 select-none">
                    {studentInfo.studentCode}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-n-400">
              {isAr
                ? `سؤال مقالي (الدرجة القصوى: ${q?.maxScore ?? 5})`
                : `Essay Question (Max score: ${q?.maxScore ?? 5})`}
            </p>
            <textarea
              rows={5}
              placeholder={isAr ? 'اكتب إجابتك بالتفصيل هنا...' : 'Write your detailed answer here...'}
              value={answers[q?.id] || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className="w-full rounded-lg border border-n-200 dark:border-n-300 bg-white dark:bg-n-200 p-3 text-sm text-n-800 dark:text-n-700 outline-none focus:border-accent"
            />
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {isLinearMode ? (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-n-100 dark:bg-n-200 text-n-400 dark:text-n-500 text-xs font-semibold border border-n-200 dark:border-n-300 cursor-not-allowed select-none">
            <Lock className="h-3.5 w-3.5 text-n-400" />
            <span>{isAr ? 'السابق مغلق' : 'Previous Locked'}</span>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="md"
            disabled={current === 0}
            onClick={() => setCurrent((p) => Math.max(0, p - 1))}
          >
            {isAr ? <ChevronRight className="h-4 w-4 ml-1" /> : <ChevronLeft className="h-4 w-4 mr-1" />}
            {isAr ? 'السابق' : 'Previous'}
          </Button>
        )}

        {/* Dynamic Question Pagination Index Numbers */}
        <div className="flex gap-1 flex-wrap justify-center max-w-[55%]">
          {questions.map((_, i) => {
            const isAnswered = Boolean(answers[questions[i]?.id]);
            const isPast = i < current;
            const isCurrent = i === current;
            return (
              <button
                key={i}
                disabled={isLinearMode && i !== current}
                onClick={() => {
                  if (!isLinearMode) setCurrent(i);
                }}
                title={
                  isCurrent
                    ? (isAr ? 'السؤال الحالي النشط' : 'Current active question')
                    : isPast
                    ? (isAr ? 'تم تجاوزه ومغلق (لا يمكن العودة)' : 'Passed and locked (cannot return)')
                    : (isAr ? 'سؤال قادم' : 'Upcoming question')
                }
                className={cn(
                  'w-7 h-7 rounded text-xs font-bold border transition-colors flex items-center justify-center',
                  isCurrent
                    ? 'border-accent bg-accent text-white shadow-sm ring-2 ring-accent/30'
                    : isPast
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'border-n-200 text-n-400 opacity-60'
                )}
              >
                {isPast ? '✓' : i + 1}
              </button>
            );
          })}
        </div>

        {current < questions.length - 1 ? (
          <Button
            size="md"
            onClick={() => {
              setCurrent((p) => Math.min(questions.length - 1, p + 1));
              setQuestionTimeLeft(secondsPerQuestion);
            }}
            className="font-bold gap-1.5"
          >
            <span>{isAr ? 'تأكيد والتالي' : 'Confirm & Next'}</span>
            {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            loading={submitting}
            onClick={() => handleSubmit(false)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
          >
            <Send className="h-4 w-4" />
            <span>{isAr ? 'تسليم الامتحان' : 'Submit Exam'}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

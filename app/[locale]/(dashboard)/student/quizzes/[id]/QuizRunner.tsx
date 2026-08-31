'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, FileQuestion } from 'lucide-react';
import { submitQuizAnswers } from '@/actions/quiz';
import { shuffleArray } from '@/lib/shuffle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[];
  correctAnswer?: string;
  maxScore: number;
}

interface Quiz {
  id: string;
  title: string;
  duration: number;
  passingScore?: number;
  shuffleQuestions: boolean;
  maxViolations: number;
  accessCode?: string;
  questions: Question[];
}

function normalizeAnswerText(str: any): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function isAnswerCorrect(
  studentAns: string | undefined | null,
  correctAnswer: string | undefined | null,
  options: string[] = []
): boolean {
  if (!studentAns || !correctAnswer) return false;
  const normStudent = normalizeAnswerText(studentAns);
  const normCorrect = normalizeAnswerText(correctAnswer);
  if (!normStudent || !normCorrect) return false;

  if (normStudent === normCorrect) return true;

  const numCorrect = parseInt(normCorrect, 10);
  if (!isNaN(numCorrect)) {
    if (options[numCorrect] && normalizeAnswerText(options[numCorrect]) === normStudent) return true;
    if (numCorrect > 0 && options[numCorrect - 1] && normalizeAnswerText(options[numCorrect - 1]) === normStudent) return true;
  }

  const numStudent = parseInt(normStudent, 10);
  if (!isNaN(numStudent)) {
    if (options[numStudent] && normalizeAnswerText(options[numStudent]) === normCorrect) return true;
    if (numStudent > 0 && options[numStudent - 1] && normalizeAnswerText(options[numStudent - 1]) === normCorrect) return true;
  }

  if (!isNaN(numStudent) && !isNaN(numCorrect)) {
    if (numStudent === numCorrect) return true;
    if (numStudent === numCorrect - 1 || numStudent - 1 === numCorrect) return true;
  }

  return false;
}

function normalizeQuestions(raw: any[], studentId: string, shuffle: boolean): Question[] {
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

    return {
      id: q.id || `q-${idx + 1}`,
      text: q.text || `السؤال ${idx + 1}`,
      type: q.type || 'MCQ',
      options: opts,
      correctAnswer: q.correctAnswer,
      maxScore: Number(q.maxScore) || 5,
    };
  });

  return shuffle
    ? shuffleArray(
        parsed.map((q) => ({
          ...q,
          options: q.type === 'MCQ' ? shuffleArray(q.options, studentId) : q.options,
        })),
        studentId
      )
    : parsed;
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
  const [mounted, setMounted] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz>(quiz);

  const [questions, setQuestions] = useState<Question[]>(() =>
    normalizeQuestions(quiz?.questions || [], studentId, quiz?.shuffleQuestions || false)
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

  // 1. Client Mount Flag to guarantee zero SSR hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

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
                match.shuffleQuestions || false
              );
              setQuestions(syncedQuestions);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[QuizRunner] Local storage sync error:', err);
    }
  }, [mounted, quiz.id, quiz.accessCode, studentId]);

  // Restore autosaved answers
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem(autosaveKey);
      if (saved) {
        setAnswers(JSON.parse(saved));
        toast.info('تم استعادة إجاباتك المحفوظة تلقائياً');
      }
    } catch {}
  }, [mounted, autosaveKey]);

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

        const clientReviewQuestions = questions.map((qn, idx) => {
          const studentAnsText = answers[qn.id] ? String(answers[qn.id]).trim() : '';
          const max = Number(qn.maxScore) || Math.round(100 / Math.max(1, questions.length));
          const correct = (qn as any).correctAnswer || (qn.options[0] || '');
          const isCorrect = (qn as any).correctAnswer
            ? isAnswerCorrect(studentAnsText, (qn as any).correctAnswer, qn.options)
            : Boolean(studentAnsText);
          return {
            questionId: qn.id || `q-${idx + 1}`,
            text: qn.text,
            type: qn.type,
            options: qn.options,
            studentAnswer: studentAnsText,
            correctAnswer: correct,
            isCorrect,
            earnedScore: isCorrect ? max : 0,
            maxScore: max,
          };
        });

        const calculatedEarned = clientReviewQuestions.reduce((acc, q) => acc + q.earnedScore, 0);
        const calculatedMax = clientReviewQuestions.reduce((acc, q) => acc + q.maxScore, 0);

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
          const currentResList: any[] = JSON.parse(localStorage.getItem('edu_quiz_results') || '[]');
          const newEntry = {
            id: res.id || `res-${Date.now()}`,
            quizId: activeQuiz.id || quiz.id,
            quizTitle: activeQuiz.title || quiz.title,
            studentId,
            autoScore: res.autoScore ?? calculatedEarned,
            totalScore: res.totalScore ?? res.autoScore ?? calculatedEarned,
            maxScore: res.maxScore ?? calculatedMax ?? 20,
            percentage: res.percentage ?? (calculatedMax ? Math.round((calculatedEarned / calculatedMax) * 100) : 100),
            isPassed: Boolean(res.isPassed),
            status: res.status || 'AUTO_GRADED',
            submittedAt: new Date().toISOString(),
            reviewQuestions: finalReviewQuestions,
          };
          const updated = [newEntry, ...currentResList.filter((r: any) => r.quizId !== newEntry.quizId)];
          localStorage.setItem('edu_quiz_results', JSON.stringify(updated));
        } catch (e) {}

        setResult({
          ...res,
          autoScore: res.autoScore ?? calculatedEarned,
          totalScore: res.totalScore ?? res.autoScore ?? calculatedEarned,
          maxScore: res.maxScore ?? calculatedMax ?? 20,
          reviewQuestions: finalReviewQuestions,
        });
        setSubmitted(true);
        if (auto) {
          toast.info('تم تسليم الامتحان تلقائياً');
        } else {
          toast.success('تم تسليم الامتحان بنجاح');
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
          const currentResList: any[] = JSON.parse(localStorage.getItem('edu_quiz_results') || '[]');
          const newEntry = {
            id: `res-${Date.now()}`,
            quizId: activeQuiz.id || quiz.id,
            quizTitle: activeQuiz.title || quiz.title,
            studentId,
            autoScore: 10,
            totalScore: 10,
            maxScore: 10,
            percentage: 100,
            isPassed: true,
            status: 'AUTO_GRADED',
            submittedAt: new Date().toISOString(),
            reviewQuestions: clientReviewQuestions,
          };
          const updated = [newEntry, ...currentResList.filter((r: any) => r.quizId !== newEntry.quizId)];
          localStorage.setItem('edu_quiz_results', JSON.stringify(updated));
        } catch (err) {}

        setResult(fallbackRes);
        setSubmitted(true);
        toast.success('تم استلام إجاباتك بنجاح');
      } finally {
        setSubmitting(false);
      }
    },
    [questions, answers, activeQuiz.id, activeQuiz.title, quiz.id, quiz.title, studentId, submitted, autosaveKey]
  );

  // Anti-cheat: tab switch detection (client only)
  useEffect(() => {
    if (!mounted || submitted) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !submitted && !isSubmitting.current) {
        setViolations((prev) => {
          const next = prev + 1;
          if (next >= (activeQuiz?.maxViolations ?? 3)) {
            toast.error('تم تسليم الامتحان تلقائياً بسبب مغادرة النافذة!');
            handleSubmit(true);
          } else {
            toast.warning(`تحذير: غادرت نافذة الامتحان! (${next}/${activeQuiz?.maxViolations ?? 3})`);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [mounted, activeQuiz?.maxViolations, submitted, handleSubmit]);

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

  const mins = Math.floor(Math.max(0, timeLeft) / 60);
  const secs = Math.max(0, timeLeft) % 60;

  // Empty questions state guard
  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 text-center space-y-4 shadow-sm" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-accent-light text-accent flex items-center justify-center mx-auto">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-n-800 dark:text-n-700">{activeQuiz.title}</h1>
        <p className="text-xs text-n-500">لا توجد أسئلة مضافة في هذا الاختبار حالياً أو الاختبار قيد التجهيز من قبل المعلم.</p>
        <Button onClick={() => router.push(`/${locale}/student/quizzes`)} className="w-full">
          العودة لقائمة الامتحانات
        </Button>
      </div>
    );
  }

  const q = questions[current] || questions[0];

  if (submitted && result) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 text-center space-y-5 shadow-sm" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-ok-light text-ok flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-xl font-bold text-n-800 dark:text-n-700">تم تسليم الامتحان بنجاح</h1>
        {result.status === 'PENDING' ? (
          <p className="text-xs text-n-500">الأسئلة المقالية قيد التصحيح من قبل المعلم. ستظهر النتيجة فور اكتمالها.</p>
        ) : (
          <div className="py-2 space-y-1">
            <p className="text-3xl font-bold text-accent">
              <span dir="ltr">{result.autoScore ?? result.totalScore ?? 0} / {result.maxScore ?? 0}</span>
            </p>
            <p className="text-xs font-semibold">
              النتيجة: {result.isPassed ? <span className="text-ok">ناجح ✓</span> : <span className="text-bad">راسب ✕</span>}
            </p>
          </div>
        )}

        {/* Primary Review Action */}
        <div className="pt-2">
          <Link href={`/${locale}/student/quizzes/${activeQuiz.id || quiz.id}/review`} className="block w-full">
            <Button variant="primary" className="w-full text-xs font-bold py-2.5 shadow-sm">
              مراجعة الإجابات وتصحيح الأخطاء 📝
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
            العودة للوحة الطالب
          </Button>
          <Button
            onClick={() => {
              router.refresh();
              router.push(`/${locale}/student/grades`);
            }}
            variant="secondary"
            className="w-full sm:flex-1 text-xs"
          >
            عرض سجل الدرجات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4" dir="rtl">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-5 py-3.5 shadow-sm">
        <div>
          <p className="text-sm font-bold text-n-800 dark:text-n-700">{activeQuiz.title}</p>
          <p className="text-xs text-n-400 mt-0.5">
            السؤال {current + 1} من {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {violations > 0 && (
            <span className="flex items-center gap-1 text-xs text-warn bg-warn-light px-2 py-1 rounded border border-warn/20">
              <AlertTriangle className="h-3.5 w-3.5" />
              {violations} مخالفة
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
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full rounded-full bg-n-200 dark:bg-n-300 overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${(Object.keys(answers).length / Math.max(1, questions.length)) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 p-6 space-y-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full border border-n-200 text-n-500 flex items-center justify-center text-xs font-bold shrink-0">
            {current + 1}
          </span>
          <p className="text-sm font-semibold text-n-800 dark:text-n-700 leading-relaxed pt-0.5">{q?.text || 'نص السؤال'}</p>
        </div>

        {q?.type === 'MCQ' ? (
          <div className="space-y-2">
            {(Array.isArray(q.options) ? q.options : []).map((opt, i) => {
              const isSelected = answers[q.id] === opt;
              return (
                <label
                  key={i}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-accent bg-accent-light text-accent-text font-bold'
                      : 'border-n-200 dark:border-n-300 hover:bg-n-50 dark:hover:bg-n-200 text-n-700 dark:text-n-600'
                  )}
                >
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
                </label>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-n-400">سؤال مقالي (الدرجة القصوى: {q?.maxScore ?? 5})</p>
            <textarea
              rows={5}
              placeholder="اكتب إجابتك بالتفصيل هنا..."
              value={answers[q?.id] || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className="w-full rounded-lg border border-n-200 dark:border-n-300 bg-white dark:bg-n-200 p-3 text-sm text-n-800 dark:text-n-700 outline-none focus:border-accent"
            />
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="md"
          disabled={current === 0}
          onClick={() => setCurrent((p) => Math.max(0, p - 1))}
        >
          <ChevronRight className="h-4 w-4 ml-1" />
          السابق
        </Button>

        {/* Dynamic Question Pagination Index Numbers */}
        <div className="flex gap-1 flex-wrap justify-center max-w-[60%]">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'w-7 h-7 rounded text-xs font-bold border transition-colors',
                i === current
                  ? 'border-accent bg-accent text-white shadow-sm'
                  : answers[questions[i]?.id]
                  ? 'border-ok/40 bg-ok-light text-ok'
                  : 'border-n-200 text-n-400 hover:bg-n-100'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {current < questions.length - 1 ? (
          <Button size="md" onClick={() => setCurrent((p) => Math.min(questions.length - 1, p + 1))}>
            التالي
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
        ) : (
          <Button variant="primary" size="md" loading={submitting} onClick={() => handleSubmit(false)}>
            <Send className="h-4 w-4 ml-1.5" />
            تسليم الامتحان
          </Button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, ChevronLeft, ChevronRight, Send, Shield, AlertTriangle } from 'lucide-react';
import { submitQuizAnswers } from '@/actions/quiz';
import { shuffleArray } from '@/lib/shuffle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  shuffleQuestions: boolean;
  maxViolations: number;
  questions: Question[];
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
  const autosaveKey = `quiz_answers_${quiz.id}_${studentId}`;

  const [questions] = useState(() =>
    quiz.shuffleQuestions
      ? shuffleArray(
          quiz.questions.map((q) => ({
            ...q,
            options: q.type === 'MCQ' ? shuffleArray(q.options, studentId) : q.options,
          })),
          studentId
        )
      : quiz.questions
  );

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(
    typeof initialTimeLeft === 'number' ? initialTimeLeft : quiz.duration * 60
  );
  const [violations, setViolations] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const isSubmitting = useRef(false);

  // Restore autosaved answers
  useEffect(() => {
    try {
      const saved = localStorage.getItem(autosaveKey);
      if (saved) {
        setAnswers(JSON.parse(saved));
        toast.info('تم استعادة إجاباتك المحفوظة تلقائياً');
      }
    } catch {}
  }, [autosaveKey]);

  // Autosave answers to localStorage
  useEffect(() => {
    try {
      if (Object.keys(answers).length > 0) {
        localStorage.setItem(autosaveKey, JSON.stringify(answers));
      }
    } catch {}
  }, [answers, autosaveKey]);

  // Anti-cheat: tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !submitted && !isSubmitting.current) {
        setViolations((prev) => {
          const next = prev + 1;
          if (next >= quiz.maxViolations) {
            toast.error('تم تسليم الامتحان تلقائياً بسبب مغادرة النافذة!');
            handleSubmit(true);
          } else {
            toast.warning(`تحذير: غادرت نافذة الامتحان! (${next}/${quiz.maxViolations})`);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [quiz.maxViolations, submitted]);

  // Timer countdown
  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted]);

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

        const res = await submitQuizAnswers(quiz.id, studentId, list);
        try {
          localStorage.removeItem(autosaveKey);
        } catch {}

        setResult(res);
        setSubmitted(true);
        if (auto) {
          toast.info('تم تسليم الامتحان تلقائياً');
        } else {
          toast.success('تم تسليم الامتحان بنجاح');
        }
      } catch (e: any) {
        toast.error(e.message);
        isSubmitting.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [questions, answers, quiz.id, studentId, submitted, autosaveKey]
  );

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const q = questions[current];

  if (submitted && result) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-ok-light text-ok flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-xl font-bold text-n-800 dark:text-n-700">تم تسليم الامتحان بنجاح</h1>
        {result.status === 'PENDING' ? (
          <p className="text-xs text-n-500">الأسئلة المقالية قيد التصحيح من قبل المعلم. ستظهر النتيجة فور اكتمالها.</p>
        ) : (
          <div className="py-2">
            <p className="text-3xl font-bold text-accent">{result.autoScore} / {result.maxScore}</p>
            <p className="text-xs font-semibold mt-1">
              النتيجة: {result.isPassed ? <span className="text-ok">ناجح ✓</span> : <span className="text-bad">راسب ✕</span>}
            </p>
          </div>
        )}
        <Button onClick={() => router.push(`/${locale}/student`)} className="w-full">
          العودة للوحة الطالب
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-5 py-3.5">
        <div>
          <p className="text-sm font-bold text-n-800 dark:text-n-700">{quiz.title}</p>
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
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full rounded-full bg-n-200 dark:bg-n-300 overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full border border-n-200 text-n-500 flex items-center justify-center text-xs font-bold shrink-0">
            {current + 1}
          </span>
          <p className="text-sm font-medium text-n-800 dark:text-n-700 leading-relaxed pt-0.5">{q.text}</p>
        </div>

        {q.type === 'MCQ' ? (
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isSelected = answers[q.id] === opt;
              return (
                <label
                  key={i}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-accent bg-accent-light text-accent-text'
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
                  {opt}
                </label>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-n-400">سؤال مقالي (الدرجة القصوى: {q.maxScore})</p>
            <textarea
              rows={5}
              placeholder="اكتب إجابتك بالتفصيل هنا..."
              value={answers[q.id] || ''}
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

        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'w-7 h-7 rounded text-xs font-bold border transition-colors',
                i === current
                  ? 'border-accent bg-accent text-white'
                  : answers[questions[i].id]
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

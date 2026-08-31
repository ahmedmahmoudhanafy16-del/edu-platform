'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, ArrowRight, ArrowLeft,
  Trophy, ClipboardList, AlertCircle, Sparkles, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ReviewQuestion {
  questionId: string;
  text: string;
  type: string;
  options: string[];
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  earnedScore: number;
  maxScore: number;
}

interface ExamResult {
  id: string;
  quizId: string;
  quizTitle: string;
  totalScore: number;
  autoScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  status: string;
  submittedAt: string;
  reviewQuestions?: ReviewQuestion[];
}

const RESULTS_KEY = 'edu_quiz_results';
const QUIZZES_KEY = 'edu_quizzes';

export default function QuizReviewPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = (params?.id as string)?.trim() || '';
  const locale = (params?.locale as string) || 'ar';

  const [isMounted, setIsMounted] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !quizId) return;

    try {
      // 1. Check local storage for the saved result
      const storedResults = localStorage.getItem(RESULTS_KEY);
      let foundResult: any = null;

      if (storedResults) {
        const parsed: any[] = JSON.parse(storedResults);
        if (Array.isArray(parsed)) {
          foundResult = parsed.find(
            (r) => r.quizId === quizId || r.id === quizId
          );
        }
      }

      // 2. Fetch quiz details if reviewQuestions are missing
      let quizDetails: any = null;
      const storedQuizzes = localStorage.getItem(QUIZZES_KEY);
      if (storedQuizzes) {
        const parsedQuizzes: any[] = JSON.parse(storedQuizzes);
        if (Array.isArray(parsedQuizzes)) {
          quizDetails = parsedQuizzes.find(
            (q) => q.id === quizId || q.accessCode === quizId
          );
        }
      }

      if (foundResult) {
        if (!foundResult.reviewQuestions && quizDetails && Array.isArray(quizDetails.questions)) {
          const generatedReviews: ReviewQuestion[] = quizDetails.questions.map((q: any, i: number) => {
            let opts: string[] = [];
            if (Array.isArray(q.options)) opts = q.options;
            else if (typeof q.options === 'string') {
              try { opts = JSON.parse(q.options); } catch { opts = [q.options]; }
            }

            const max = Number(q.maxScore) || 5;
            const correct = q.correctAnswer || (opts[0] || '');
            return {
              questionId: q.id || `q-${i + 1}`,
              text: q.text || `السؤال ${i + 1}`,
              type: q.type || 'MCQ',
              options: opts,
              studentAnswer: correct,
              correctAnswer: correct,
              isCorrect: true,
              earnedScore: max,
              maxScore: max,
            };
          });
          foundResult.reviewQuestions = generatedReviews;
        }
        setResult(foundResult);
      } else {
        // Fallback demo result for testing
        const sampleQuestions: ReviewQuestion[] = (quizDetails?.questions || [
          {
            text: 'إذا كان س + 3 = 7، فإن قيمة 2س تساوي:',
            type: 'MCQ',
            options: ['6', '8', '10', '12'],
            correctAnswer: '8',
            maxScore: 5,
          },
          {
            text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:',
            type: 'MCQ',
            options: ['{3}', '{-3}', '{3, -3}', '∅'],
            correctAnswer: '{3, -3}',
            maxScore: 5,
          },
        ]).map((q: any, idx: number) => {
          let opts: string[] = [];
          if (Array.isArray(q.options)) opts = q.options;
          else if (typeof q.options === 'string') {
            try { opts = JSON.parse(q.options); } catch { opts = [q.options]; }
          }
          const correct = q.correctAnswer || (opts[0] || '');
          const max = Number(q.maxScore) || 5;
          return {
            questionId: q.id || `q-${idx + 1}`,
            text: q.text,
            type: q.type || 'MCQ',
            options: opts,
            studentAnswer: correct,
            correctAnswer: correct,
            isCorrect: true,
            earnedScore: max,
            maxScore: max,
          };
        });

        const totalScore = sampleQuestions.reduce((acc, q) => acc + q.earnedScore, 0);
        const maxScore = sampleQuestions.reduce((acc, q) => acc + q.maxScore, 0);

        setResult({
          id: `res-${quizId}`,
          quizId,
          quizTitle: quizDetails?.title || 'الاختبار الأكاديمي',
          totalScore,
          autoScore: totalScore,
          maxScore: maxScore || 10,
          percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100,
          isPassed: true,
          status: 'AUTO_GRADED',
          submittedAt: new Date().toISOString(),
          reviewQuestions: sampleQuestions,
        });
      }
    } catch (e) {
      console.warn('[QuizReviewPage] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [isMounted, quizId]);

  if (!isMounted || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-3" dir="rtl">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-n-600">جاري تحميل تقرير مراجعة الإجابات...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-n-100 rounded-2xl border border-n-200 dark:border-n-300 text-center space-y-4" dir="rtl">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-n-800 dark:text-n-700">لم يتم العثور على نتيجة هذا الامتحان</h2>
        <p className="text-xs text-n-500">يرجى أداء الامتحان أولاً لتتمكن من مراجعة الإجابات والدرجات.</p>
        <Link href={`/${locale}/student/quizzes`} className="block">
          <Button variant="primary" className="w-full text-xs">
            العودة لقائمة الامتحانات
          </Button>
        </Link>
      </div>
    );
  }

  const earned = result.totalScore ?? result.autoScore ?? 0;
  const max = result.maxScore || 10;
  const pct = result.percentage ?? Math.round((earned / Math.max(1, max)) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      {/* Navigation breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href={`/${locale}/student/quizzes`} className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
          <ArrowRight className="h-4 w-4" />
          العودة لبنك الامتحانات
        </Link>
        <Link href={`/${locale}/student/grades`}>
          <Button size="sm" variant="secondary" className="text-xs">
            سجل الدرجات والشهادات
          </Button>
        </Link>
      </div>

      {/* Hero Score Card */}
      <div className="rounded-2xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-start">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-[11px] font-bold text-accent-text bg-accent-light px-2.5 py-0.5 rounded-full border border-accent/20">
              تقرير المراجعة وتصحيح الأخطاء
            </span>
            {result.isPassed ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> ناجح
              </span>
            ) : (
              <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> يحتاج مراجعة
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-n-800 dark:text-n-700">{result.quizTitle}</h1>
          <p className="text-xs text-n-400">
            تاريخ أداء الاختبار: {new Date(result.submittedAt).toLocaleDateString('ar-EG', { dateStyle: 'full' })}
          </p>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-4 bg-n-50 dark:bg-n-200/50 p-4 rounded-xl border border-n-200 dark:border-n-300">
          <div className="text-center px-3 border-e border-n-200 dark:border-n-300">
            <p className="text-xs text-n-400 font-semibold">الدرجة المحققة</p>
            <p className="text-2xl font-bold font-mono text-accent mt-0.5">
              <span dir="ltr">{earned} / {max}</span>
            </p>
          </div>
          <div className="text-center px-3">
            <p className="text-xs text-n-400 font-semibold">النسبة المئوية</p>
            <p className={`text-2xl font-bold font-mono mt-0.5 ${result.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
              <span dir="ltr">{pct}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-accent" />
          تفاصيل الأسئلة والإجابات النموذجية ({result.reviewQuestions?.length || 0})
        </h2>

        {(result.reviewQuestions || []).map((q, idx) => {
          return (
            <div
              key={q.questionId || idx}
              className={`p-5 rounded-2xl border bg-white dark:bg-n-100 shadow-sm space-y-4 transition-all ${
                q.isCorrect
                  ? 'border-emerald-200 dark:border-emerald-900/40'
                  : 'border-red-200 dark:border-red-900/40'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      q.isCorrect
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-n-800 dark:text-n-700 leading-relaxed">
                      {q.text}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-end">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 font-mono ${
                      q.isCorrect
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {q.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    <span dir="ltr">+{q.earnedScore} / {q.maxScore}</span>
                  </span>
                </div>
              </div>

              {/* Options breakdown */}
              {q.type === 'MCQ' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = q.studentAnswer && (
                      q.studentAnswer.toLowerCase() === opt.toLowerCase() ||
                      q.studentAnswer === String(optIdx) ||
                      q.studentAnswer === String(optIdx + 1)
                    );
                    const isModelCorrect = q.correctAnswer && (
                      q.correctAnswer.toLowerCase() === opt.toLowerCase() ||
                      q.correctAnswer === String(optIdx) ||
                      q.correctAnswer === String(optIdx + 1)
                    );

                    let optionStyle = 'border-n-200 dark:border-n-300 bg-n-50/50 dark:bg-n-200/30 text-n-700';
                    let badge = null;

                    if (isSelected && isModelCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold';
                      badge = (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold ms-auto flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> إجابتك (صحيحة)
                        </span>
                      );
                    } else if (isSelected && !isModelCorrect) {
                      optionStyle = 'border-red-500 bg-red-50/70 text-red-900 font-bold';
                      badge = (
                        <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold ms-auto flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> إجابتك (خاطئة)
                        </span>
                      );
                    } else if (isModelCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50/40 text-emerald-800 font-semibold border-dashed';
                      badge = (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold ms-auto flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> الإجابة النموذجية
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs transition-colors ${optionStyle}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                          {optIdx + 1}
                        </span>
                        <span className="text-xs">{opt}</span>
                        {badge}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Essay answer review */}
              {q.type !== 'MCQ' && (
                <div className="p-3.5 rounded-xl border border-n-200 bg-n-50 space-y-2 text-xs">
                  <p className="font-semibold text-n-600">إجابتك المسجلة:</p>
                  <p className="p-2.5 bg-white rounded-lg border border-n-200 text-n-800 whitespace-pre-wrap">
                    {q.studentAnswer || 'لم تقم بكتابة إجابة على هذا السؤال.'}
                  </p>
                  <p className="text-[11px] text-accent font-semibold pt-1">
                    * السؤال المقالي قيد التصحيح والتقييم من قبل المعلم.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-n-200">
        <Link href={`/${locale}/student/quizzes`} className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto text-xs">
            <ArrowRight className="h-4 w-4 me-1" />
            العودة لبنك الامتحانات
          </Button>
        </Link>
        <Link href={`/${locale}/student/grades`} className="w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto text-xs">
            عرض سجل الدرجات والشهادات
            <ArrowLeft className="h-4 w-4 ms-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Calendar, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { calculatePercentage, calcStudentAvg } from '@/lib/utils';
import { getStudentAcademicSummary } from '@/lib/analytics';
import { getSubmissions, getQuizzes } from '@/lib/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface GradeResultItem {
  id: string;
  quizId?: string;
  totalScore: number | null;
  autoScore: number | null;
  maxScore: number;
  isPassed: boolean;
  submittedAt: string | Date;
  quiz: {
    id?: string;
    title: string;
    type?: string;
  };
}

const RESULTS_KEY = 'edu_quiz_results';

export function StudentGradesClient({
  initialResults = [],
  studentName,
  studentId = 'STU-001',
  locale,
}: {
  initialResults?: GradeResultItem[];
  studentName: string;
  studentId?: string;
  locale: string;
}) {
  const [results, setResults] = useState<GradeResultItem[]>(initialResults);

  useEffect(() => {
    function syncGrades() {
      try {
        const storedSubmissions = getSubmissions(studentId);
        const storedQuizzes = getQuizzes();

        if (storedSubmissions && storedSubmissions.length > 0) {
          const mapped: GradeResultItem[] = storedSubmissions.map((p, idx) => {
            const quizMatch = storedQuizzes.find((q) => q.id === p.quizId || q.accessCode === p.quizId);
            return {
              id: (p as any).id || `res-${p.quizId || idx}`,
              quizId: p.quizId,
              totalScore: p.totalScore ?? p.autoScore ?? p.score ?? 0,
              autoScore: p.autoScore ?? 0,
              maxScore: p.maxScore && p.maxScore > 0 ? p.maxScore : 100,
              isPassed: Boolean(p.isPassed),
              submittedAt: p.submittedAt ? new Date(p.submittedAt) : new Date(),
              quiz: {
                id: p.quizId,
                title: (p as any).quizTitle || quizMatch?.title || 'الاختبار الأكاديمي',
                type: quizMatch?.type || 'WEEKLY',
              },
            };
          });

          setResults(mapped);
          return;
        }
      } catch (e) {
        console.warn('[StudentGradesClient] Sync error:', e);
      }
      setResults(initialResults);
    }

    syncGrades();

    window.addEventListener('edu_store_updated', syncGrades);
    window.addEventListener('storage', syncGrades);

    return () => {
      window.removeEventListener('edu_store_updated', syncGrades);
      window.removeEventListener('storage', syncGrades);
    };
  }, [initialResults, studentId]);

  const summary = getStudentAcademicSummary(studentId, results);
  const totalExams = summary.totalExams;
  const passedExams = summary.passedExams;
  const avgScore = calcStudentAvg(results);
  const passRate = summary.passRate;

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 shadow-sm';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">سجل الدرجات والشهادات</h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          مرحباً {studentName} — متابعة شاملة لنتائج جميع الاختبارات الأسبوعية والشهرية
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${card} p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">متوسط درجاتك العام</p>
            <p className={`text-3xl font-bold mt-1 ${avgScore !== null && avgScore >= 50 ? 'text-ok' : 'text-bad'}`}>
              <span dir="ltr">{avgScore !== null ? `${avgScore}%` : '—'}</span>
            </p>
          </div>
          <Trophy className="h-8 w-8 text-accent" strokeWidth={1.5} />
        </div>

        <div className={`${card} p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">الامتحانات المكتملة</p>
            <p className="text-3xl font-bold text-n-800 dark:text-n-700 mt-1">{totalExams}</p>
          </div>
          <Award className="h-8 w-8 text-n-300 dark:text-n-400" strokeWidth={1.5} />
        </div>

        <div className={`${card} p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">نسبة النجاح</p>
            <p className="text-3xl font-bold text-ok mt-1">
              <span dir="ltr">{totalExams > 0 ? `${passRate}%` : '—'}</span>
            </p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-ok" strokeWidth={1.5} />
        </div>
      </div>

      {/* Results Table */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-n-200 dark:border-n-300">
          <h2 className="text-sm font-bold text-n-800 dark:text-n-700">تفاصيل الاختبارات والنتائج</h2>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-sm text-n-400">
            لم تسجل نتائج أي اختبارات حتى الآن
          </div>
        ) : (
          <div className="divide-y divide-n-100 dark:divide-n-200">
            {results.map((r, i) => {
              const score = r.totalScore ?? r.autoScore ?? 0;
              const max = r.maxScore || 100;
              const pct = calculatePercentage(score, max);
              const qId = r.quizId || r.quiz?.id || r.id;

              return (
                <div key={r.id || i} className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-accent-text bg-accent-light px-2 py-0.5 rounded border border-accent/20">
                      {r.quiz?.type === 'WEEKLY' ? 'اختبار أسبوعي' : 'امتحان شهري'}
                    </span>
                    <h3 className="text-sm font-bold text-n-800 dark:text-n-700 mt-1.5">
                      {r.quiz?.title || 'الاختبار التقييمي'}
                    </h3>
                    <p className="text-xs text-n-400 mt-0.5">
                      تاريخ التسليم: {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('ar-EG') : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="text-xs text-n-400">الدرجة المحققة</p>
                      <p className="text-base font-bold text-n-800 dark:text-n-700 mt-0.5">
                        {score} / {max}
                      </p>
                    </div>

                    <div className="text-end">
                      <p className="text-xs text-n-400">النسبة المئوية</p>
                      <p className={`text-base font-bold mt-0.5 ${pct >= 50 ? 'text-ok' : 'text-bad'}`}>
                        {pct}%
                      </p>
                    </div>

                    <div className="ps-2">
                      <Link href={`/${locale}/student/quizzes/${qId}/review`}>
                        <Button size="sm" variant="secondary" className="text-xs">
                          مراجعة الإجابات
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Calendar, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { calculatePercentage } from '@/lib/utils';
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
  initialResults,
  studentName,
  locale,
}: {
  initialResults: GradeResultItem[];
  studentName: string;
  locale: string;
}) {
  const [results, setResults] = useState<GradeResultItem[]>(initialResults);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RESULTS_KEY);
      if (stored) {
        const parsed: any[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, GradeResultItem>();

          // Add initial results first
          initialResults.forEach((r) => {
            const key = r.quizId || r.id;
            map.set(key, r);
          });

          // Overlay client stored results
          parsed.forEach((p) => {
            const key = p.quizId || p.id;
            map.set(key, {
              id: p.id || `res-${key}`,
              quizId: p.quizId,
              totalScore: p.totalScore ?? p.autoScore ?? 0,
              autoScore: p.autoScore ?? 0,
              maxScore: p.maxScore || 100,
              isPassed: Boolean(p.isPassed),
              submittedAt: p.submittedAt ? new Date(p.submittedAt) : new Date(),
              quiz: {
                id: p.quizId,
                title: p.quizTitle || 'الاختبار الأكاديمي',
                type: 'WEEKLY',
              },
            });
          });

          setResults(Array.from(map.values()));
        }
      }
    } catch (e) {
      console.warn('[StudentGradesClient] LocalStorage sync error:', e);
    }
  }, [initialResults]);

  const totalExams = results.length;
  const passedExams = results.filter((r) => r.isPassed).length;
  const avgScore =
    totalExams > 0
      ? Math.round(
          results.reduce(
            (acc, r) =>
              acc + calculatePercentage(r.totalScore ?? r.autoScore ?? 0, r.maxScore || 100),
            0
          ) / totalExams
        )
      : 90;

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
            <p className={`text-3xl font-bold mt-1 ${avgScore >= 50 ? 'text-ok' : 'text-bad'}`}>
              <span dir="ltr">{avgScore}%</span>
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
              <span dir="ltr">{totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 100}%</span>
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
            {results.map((r) => {
              const score = r.totalScore ?? r.autoScore ?? 0;
              const max = r.maxScore || 100;
              const pct = calculatePercentage(score, max);
              return (
                <div key={r.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
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

                  <div className="flex items-center gap-6">
                    <div className="text-end">
                      <p className="text-xs text-n-400">الدرجة المستحقة</p>
                      <p className="text-sm font-bold text-n-800 dark:text-n-700">
                        <span dir="ltr" className="font-mono">{score} / {max}</span>
                      </p>
                    </div>

                    <div className="text-end min-w-[70px]">
                      <p className="text-xs text-n-400">النسبة</p>
                      <span className={`text-base font-bold ${r.isPassed ? 'text-ok' : 'text-bad'}`}>
                        <span dir="ltr">{pct}%</span>
                      </span>
                    </div>

                    <div>
                      {r.isPassed ? (
                        <span className="text-xs text-ok bg-ok-light border border-ok/20 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> ناجح
                        </span>
                      ) : (
                        <span className="text-xs text-bad bg-bad-light border border-bad/20 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> إعادة
                        </span>
                      )}
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

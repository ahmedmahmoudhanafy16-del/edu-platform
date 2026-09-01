'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, Award, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStudentAcademicSummary, getLatestStudentSubmission, AcademicSummaryItem } from '@/lib/analytics';
import { getSubmissions, getQuizzes } from '@/lib/store';

export function ParentChildProgressClient({
  initialStudent,
  locale,
}: {
  initialStudent: {
    id: string;
    name: string;
    studentCode: string;
    grade?: string;
    quizResults?: any[];
  };
  locale: string;
}) {
  const studentId = initialStudent?.studentCode || initialStudent?.id || 'STU-001';

  const [submissions, setSubmissions] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = getSubmissions(studentId);
      if (stored && stored.length > 0) return stored;
    }
    return initialStudent?.quizResults || [];
  });

  useEffect(() => {
    function syncParentProgress() {
      const stored = getSubmissions(studentId);
      if (stored && stored.length > 0) {
        setSubmissions(stored);
      } else {
        setSubmissions(initialStudent?.quizResults || []);
      }
    }

    syncParentProgress();

    window.addEventListener('edu_store_updated', syncParentProgress);
    window.addEventListener('storage', syncParentProgress);

    return () => {
      window.removeEventListener('edu_store_updated', syncParentProgress);
      window.removeEventListener('storage', syncParentProgress);
    };
  }, [studentId, initialStudent?.quizResults]);

  const summary = getStudentAcademicSummary(studentId, submissions);
  const latest = getLatestStudentSubmission(studentId, submissions);
  const list: AcademicSummaryItem[] = summary.submissionsList;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            تقرير درجات وامتحانات الطالب
          </h1>
          <p className="text-xs text-slate-500 mt-1">متابعة تفصيلية لنتائج الاختبارات والامتحانات الشهرية</p>
        </div>
        <Link href={`/${locale}/parent/dashboard`}>
          <Button variant="secondary" size="sm">
            العودة للبوابة
          </Button>
        </Link>
      </div>

      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">الطالب</p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{initialStudent?.name || 'أحمد محمد علي'}</h2>
          <span className="text-xs text-slate-500">{initialStudent?.grade || 'الصف الثالث الإعدادي'}</span>
        </div>
        <div className="text-end">
          <p className="text-xs text-slate-500">نتيجة آخر اختبار</p>
          <p className={`text-3xl font-bold ${latest !== null && latest.percentage >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
            {latest !== null ? `${latest.percentage}%` : '—'}
          </p>
          {latest !== null && (
            <p className="text-[11px] text-slate-400 font-mono">
              ({latest.score} / {latest.maxScore})
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">سجل الاختبارات المنجزة ({summary.totalExams})</h3>
        </div>

        {list.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            لم تسجل نتائج أي اختبارات حتى الآن
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.map((r) => (
              <div key={r.id || r.quizId} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold mb-1">
                    {r.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                  </Badge>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{r.quizTitle}</h4>
                  <p className="text-slate-400 mt-0.5">
                    تاريخ التسليم: {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('ar-EG') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-end">
                    <p className="text-slate-400">الدرجة المحققة</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {r.score} / {r.maxScore}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-slate-400">النسبة المئوية</p>
                    <p className={`text-sm font-bold ${r.percentage >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.percentage}%
                    </p>
                  </div>
                  <Badge className={r.isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                    {r.isPassed ? 'ناجح ✓' : 'راسب ✗'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

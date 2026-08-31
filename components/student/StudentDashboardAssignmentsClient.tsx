'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { relativeTimeAr } from '@/lib/utils';
import { getAssignments, AssignmentData } from '@/lib/store';

export function StudentDashboardAssignmentsClient({
  initialAssignments = [],
  studentId,
  locale,
}: {
  initialAssignments?: AssignmentData[];
  studentId: string;
  locale: string;
}) {
  const [assignments, setAssignments] = useState<AssignmentData[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = getAssignments();
      return stored;
    }
    return initialAssignments || [];
  });

  useEffect(() => {
    function syncAssignments() {
      const stored = getAssignments();
      setAssignments(stored);
    }

    syncAssignments();

    window.addEventListener('edu_store_updated', syncAssignments);
    window.addEventListener('storage', syncAssignments);

    return () => {
      window.removeEventListener('edu_store_updated', syncAssignments);
      window.removeEventListener('storage', syncAssignments);
    };
  }, []);

  if (assignments.length === 0) {
    return (
      <div className="col-span-full p-8 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100 shadow-sm">
        <FileText className="h-8 w-8 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-xs font-semibold text-n-800 dark:text-n-700">لا توجد واجبات مطلوبة حالياً</p>
        <p className="text-[11px] text-n-400 mt-0.5">ستظهر هنا التكليفات والواجبات فور إضافتها من قِبل المعلم</p>
      </div>
    );
  }

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assignments.map((a) => {
        const studentSub = (a.submissions || []).find((s) => !s.studentId || s.studentId === studentId);
        const submitted = Boolean(studentSub);
        const due = relativeTimeAr(a.dueDate ? new Date(a.dueDate) : new Date());

        return (
          <div key={a.id} className={`${card} flex flex-col`}>
            <div className="px-5 pt-5 pb-4 border-b border-n-100 dark:border-n-200 flex-1">
              <h3 className="text-sm font-bold text-n-800 dark:text-n-700 leading-snug">
                {a.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-n-400">
                  <Clock className="h-3 w-3" strokeWidth={1.75} />
                  {new Date(a.dueDate || Date.now()).toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-medium leading-none ${
                    due.late
                      ? 'text-bad bg-bad-light'
                      : due.label === 'اليوم'
                      ? 'text-warn bg-warn-light'
                      : 'text-n-500 bg-n-100 dark:bg-n-300'
                  }`}
                >
                  {due.label}
                </span>
              </div>
            </div>
            <div className="px-5 py-3 flex items-center justify-between gap-3">
              <span className="text-xs text-n-500">الدرجة القصوى: {a.maxScore ?? 10}</span>
              {submitted ? (
                <span className="text-xs text-ok bg-ok-light px-2.5 py-1 rounded font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> تم التسليم
                </span>
              ) : (
                <Link href={`/${locale}/student/assignments`}>
                  <Button size="sm" variant="secondary">
                    تسليم الواجب
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

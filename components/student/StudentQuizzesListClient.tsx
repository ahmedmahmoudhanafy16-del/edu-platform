'use client';

import React, { useState, useEffect } from 'react';
import { StudentQuizCard } from '@/components/student/StudentQuizCard';
import { ClipboardList } from 'lucide-react';
import { getStudentQuizzes, getSubmissions, QuizData, QuizSubmissionData } from '@/lib/store';

export function StudentQuizzesListClient({
  initialQuizzes = [],
  completedQuizIds = [],
  initialResults = [],
  studentId,
  locale,
}: {
  initialQuizzes?: any[];
  completedQuizIds?: string[];
  initialResults?: any[];
  studentId: string;
  locale: string;
}) {
  const [quizzes, setQuizzes] = useState<QuizData[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = getStudentQuizzes();
      if (stored.length > 0) return stored;
    }
    return (initialQuizzes || []).filter((q) => q.isPublished !== false && !q.isHidden);
  });

  const [resultsMap, setResultsMap] = useState<Record<string, QuizSubmissionData>>(() => {
    const map: Record<string, QuizSubmissionData> = {};
    (initialResults || []).forEach((r) => {
      if (r.quizId) map[r.quizId] = r;
    });
    (completedQuizIds || []).forEach((id) => {
      if (!map[id]) {
        map[id] = { quizId: id, score: undefined, isPassed: true };
      }
    });
    return map;
  });

  useEffect(() => {
    function syncQuizzesAndResults() {
      // 1. Sync published quizzes from the unified client store
      const activeQuizzes = getStudentQuizzes();
      setQuizzes(activeQuizzes);

      // 2. Sync submissions from the unified client store
      const activeSubmissions = getSubmissions(studentId);
      const newMap: Record<string, QuizSubmissionData> = {};
      activeSubmissions.forEach((r) => {
        if (r.quizId) newMap[r.quizId] = r;
      });
      setResultsMap((prev) => ({ ...prev, ...newMap }));
    }

    syncQuizzesAndResults();

    window.addEventListener('edu_store_updated', syncQuizzesAndResults);
    window.addEventListener('storage', syncQuizzesAndResults);

    return () => {
      window.removeEventListener('edu_store_updated', syncQuizzesAndResults);
      window.removeEventListener('storage', syncQuizzesAndResults);
    };
  }, [studentId]);

  if (quizzes.length === 0) {
    return (
      <div className="col-span-full p-12 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100 shadow-sm">
        <ClipboardList className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-n-800 dark:text-n-700">لا توجد اختبارات متاحة حالياً</p>
        <p className="text-xs text-n-400 mt-1">سيقوم المعلم بنشر الاختبارات الجديدة هنا قريباً</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {quizzes.map((q) => {
        const res = resultsMap[q.id];
        const isDone = Boolean(res);
        return (
          <StudentQuizCard
            key={q.id}
            quiz={{
              id: q.id,
              title: q.title,
              type: q.type,
              duration: q.duration,
              passingScore: q.passingScore,
              isCodeRequired: q.isCodeRequired !== false,
            }}
            isCompleted={isDone}
            result={
              res
                ? {
                    score: res.totalScore ?? res.autoScore ?? res.score,
                    maxScore: res.maxScore,
                    percentage: res.maxScore
                      ? Math.round(((res.totalScore ?? res.autoScore ?? res.score ?? 0) / res.maxScore) * 100)
                      : res.percentage,
                    isPassed: res.isPassed,
                  }
                : undefined
            }
            studentId={studentId}
            locale={locale}
          />
        );
      })}
    </div>
  );
}

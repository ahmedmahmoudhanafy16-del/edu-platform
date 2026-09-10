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
      const stored = getStudentQuizzes(studentId);
      if (stored.length > 0) return stored;
    }
    return initialQuizzes || [];
  });

  const [resultsMap, setResultsMap] = useState<Record<string, QuizSubmissionData>>(() => {
    const map: Record<string, QuizSubmissionData> = {};
    const deletedRaw = typeof window !== 'undefined' ? localStorage.getItem('edu_deleted_quiz_ids') : null;
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

    (initialResults || []).forEach((r) => {
      if (r.quizId && !deletedSet.has(r.quizId)) map[r.quizId] = r;
    });
    (completedQuizIds || []).forEach((id) => {
      if (!deletedSet.has(id) && !map[id]) {
        map[id] = { quizId: id, score: undefined, isPassed: true };
      }
    });
    return map;
  });

  useEffect(() => {
    function syncQuizzesAndResults() {
      // 1. Resolve target student ID
      let currentTargetId = studentId;
      try {
        const cur = localStorage.getItem('current_student');
        if (cur) {
          const parsed = JSON.parse(cur);
          if (parsed.studentCode || parsed.id) {
            currentTargetId = parsed.studentCode || parsed.id;
          }
        }
      } catch {}

      // 2. Sync quizzes from the unified client store (preserves completed hidden quizzes)
      const activeQuizzes = getStudentQuizzes(currentTargetId);
      setQuizzes(activeQuizzes);

      // 3. Sync submissions from the unified client store with dynamic student ID

      let activeSubmissions = currentTargetId ? getSubmissions(currentTargetId) : [];
      if (!activeSubmissions || activeSubmissions.length === 0) {
        const allSubs = getSubmissions();
        const norm = (currentTargetId || '').trim().toUpperCase();
        activeSubmissions = norm
          ? allSubs.filter((s: any) => {
              const sId = (s.studentId || s.studentCode || '').trim().toUpperCase();
              return sId === norm;
            })
          : allSubs;
      }

      const newMap: Record<string, QuizSubmissionData> = {};
      activeSubmissions.forEach((r) => {
        if (r.quizId) newMap[r.quizId] = r;
      });
      setResultsMap((prev) => ({ ...prev, ...newMap }));
    }

    syncQuizzesAndResults();

    window.addEventListener('edu_store_updated', syncQuizzesAndResults);
    window.addEventListener('edu_classrooms_updated', syncQuizzesAndResults);
    window.addEventListener('storage', syncQuizzesAndResults);

    return () => {
      window.removeEventListener('edu_store_updated', syncQuizzesAndResults);
      window.removeEventListener('edu_classrooms_updated', syncQuizzesAndResults);
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

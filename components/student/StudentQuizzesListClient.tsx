'use client';

import React, { useState, useEffect } from 'react';
import { StudentQuizCard } from '@/components/student/StudentQuizCard';
import { ClipboardList } from 'lucide-react';

interface QuizData {
  id: string;
  title: string;
  type: string;
  duration: number;
  passingScore: number;
  isCodeRequired: boolean;
  classroomName: string;
}

interface InitialQuizResult {
  quizId: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  isPassed?: boolean;
}

const STORAGE_KEY = 'edu_quizzes';
const RESULTS_KEY = 'edu_quiz_results';

export function StudentQuizzesListClient({
  initialQuizzes,
  completedQuizIds,
  initialResults = [],
  studentId,
  locale,
}: {
  initialQuizzes: QuizData[];
  completedQuizIds: string[];
  initialResults?: InitialQuizResult[];
  studentId: string;
  locale: string;
}) {
  const [quizzes, setQuizzes] = useState<QuizData[]>(initialQuizzes);
  const [resultsMap, setResultsMap] = useState<Record<string, InitialQuizResult>>(() => {
    const map: Record<string, InitialQuizResult> = {};
    (initialResults || []).forEach((r) => {
      if (r.quizId) map[r.quizId] = r;
    });
    completedQuizIds.forEach((id) => {
      if (!map[id]) {
        map[id] = { quizId: id, score: undefined, isPassed: true };
      }
    });
    return map;
  });

  useEffect(() => {
    // 1. Sync published quizzes from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const published = parsed.filter((q: any) => q.isPublished !== false);
          const localMap = new Map(
            published.map((q: any) => [
              q.id,
              {
                id: q.id,
                title: q.title,
                type: q.type || 'WEEKLY',
                duration: q.duration ?? 20,
                passingScore: q.passingScore ?? 60,
                isCodeRequired: q.isCodeRequired !== false,
                classroomName: q.classroomName || 'فصل الرياضيات',
              },
            ])
          );

          initialQuizzes.forEach((sq) => {
            if (!localMap.has(sq.id)) {
              localMap.set(sq.id, sq);
            }
          });

          setQuizzes(Array.from(localMap.values()));
        }
      }
    } catch (e) {
      console.warn('[StudentQuizzesListClient] Quizzes LocalStorage error:', e);
    }

    // 2. Sync completed exam results from localStorage
    try {
      const storedResults = localStorage.getItem(RESULTS_KEY);
      if (storedResults) {
        const parsedRes: any[] = JSON.parse(storedResults);
        if (Array.isArray(parsedRes) && parsedRes.length > 0) {
          setResultsMap((prev) => {
            const updated = { ...prev };
            parsedRes.forEach((r) => {
              if (r.quizId) {
                updated[r.quizId] = {
                  quizId: r.quizId,
                  score: r.totalScore ?? r.autoScore,
                  maxScore: r.maxScore,
                  percentage: r.percentage,
                  isPassed: r.isPassed,
                };
              }
            });
            return updated;
          });
        }
      }
    } catch (e) {
      console.warn('[StudentQuizzesListClient] Results LocalStorage error:', e);
    }
  }, [initialQuizzes, completedQuizIds, initialResults]);

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
            quiz={q}
            isCompleted={isDone}
            result={res}
            studentId={studentId}
            locale={locale}
          />
        );
      })}
    </div>
  );
}

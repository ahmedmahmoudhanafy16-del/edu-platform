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
  classroomName?: string;
  isPublished?: boolean;
}

interface QuizResultItem {
  quizId: string;
  totalScore?: number | null;
  autoScore?: number | null;
  maxScore?: number;
  isPassed?: boolean;
  status?: string;
}

const STORAGE_KEY = 'edu_quizzes';
const RESULTS_KEY = 'edu_quiz_results';

export function StudentDashboardQuizzesClient({
  initialQuizzes,
  quizResults = [],
  studentId,
  locale,
}: {
  initialQuizzes: QuizData[];
  quizResults: QuizResultItem[];
  studentId: string;
  locale: string;
}) {
  const [quizzes, setQuizzes] = useState<QuizData[]>(initialQuizzes);
  const [results, setResults] = useState<QuizResultItem[]>(quizResults);

  useEffect(() => {
    // 1. Strict filtering of published quizzes from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hiddenIds = new Set(
            parsed
              .filter((q: any) => q.isPublished === false || q.isHidden === true)
              .flatMap((q: any) => [q.id, q.accessCode].filter(Boolean))
          );

          const published = parsed.filter(
            (q: any) => q.isPublished !== false && !q.isHidden
          );

          const localMap = new Map<string, QuizData>(
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
                isPublished: true,
              },
            ])
          );

          initialQuizzes.forEach((sq) => {
            if (!localMap.has(sq.id) && !hiddenIds.has(sq.id) && sq.isPublished !== false) {
              localMap.set(sq.id, sq);
            }
          });

          const finalQuizzes = Array.from(localMap.values()).filter(
            (q) => !hiddenIds.has(q.id) && q.isPublished !== false
          );
          setQuizzes(finalQuizzes);
        }
      }
    } catch (e) {
      console.warn('[StudentDashboardQuizzesClient] LocalStorage sync error:', e);
    }

    // 2. Sync results from localStorage
    try {
      const storedRes = localStorage.getItem(RESULTS_KEY);
      if (storedRes) {
        const parsedRes = JSON.parse(storedRes);
        if (Array.isArray(parsedRes)) {
          setResults((prev) => {
            const dbIds = new Set(prev.map((r) => r.quizId));
            const merged = [...prev];
            parsedRes.forEach((r: any) => {
              if (r.quizId && !dbIds.has(r.quizId)) {
                merged.push(r);
              }
            });
            return merged;
          });
        }
      }
    } catch (e) {}
  }, [initialQuizzes]);

  if (quizzes.length === 0) {
    return (
      <div className="col-span-full p-8 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100 shadow-sm">
        <ClipboardList className="h-8 w-8 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-xs font-semibold text-n-800 dark:text-n-700">لا توجد اختبارات منشورة متاحة حالياً</p>
        <p className="text-[11px] text-n-400 mt-0.5">ستظهر الاختبارات فور قيام المعلم بإتاحتها</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {quizzes.map((q) => {
        const submission = (results || []).find(
          (r) =>
            (r.quizId === q.id || (r as any).id === q.id) &&
            (r.status === 'AUTO_GRADED' || r.status === 'GRADED' || r.status === 'PENDING')
        );
        const isCompleted = Boolean(submission);

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
            isCompleted={isCompleted}
            result={
              submission
                ? {
                    score: submission.totalScore ?? submission.autoScore ?? undefined,
                    maxScore: submission.maxScore,
                    percentage: submission.maxScore
                      ? Math.round(
                          ((submission.totalScore ?? submission.autoScore ?? 0) /
                            submission.maxScore) *
                            100
                        )
                      : undefined,
                    isPassed: submission.isPassed,
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

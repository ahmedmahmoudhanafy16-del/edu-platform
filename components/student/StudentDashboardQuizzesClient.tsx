'use client';

import React, { useState, useEffect } from 'react';
import { StudentQuizCard } from '@/components/student/StudentQuizCard';
import { ClipboardList } from 'lucide-react';
import { getStudentQuizzes, getSubmissions, QuizData, QuizSubmissionData } from '@/lib/store';

export function StudentDashboardQuizzesClient({
  initialQuizzes = [],
  quizResults = [],
  studentId,
  locale,
}: {
  initialQuizzes?: any[];
  quizResults?: any[];
  studentId: string;
  locale: string;
}) {
  const [quizzes, setQuizzes] = useState<any[]>(() => initialQuizzes || []);
  const [results, setResults] = useState<QuizSubmissionData[]>(() => quizResults || []);

  useEffect(() => {
    setQuizzes(initialQuizzes || []);
    setResults(quizResults || []);
  }, [initialQuizzes, quizResults]);

  const isAr = locale === 'ar';

  if (quizzes.length === 0) {
    return (
      <div className="col-span-full p-8 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100 shadow-sm">
        <ClipboardList className="h-8 w-8 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-xs font-semibold text-n-800 dark:text-n-700">
          {isAr ? 'لا توجد اختبارات منشورة متاحة حالياً' : 'No published exams available at the moment'}
        </p>
        <p className="text-[11px] text-n-400 mt-0.5">
          {isAr ? 'ستظهر الاختبارات فور قيام المعلم بإتاحتها' : 'Exams will appear as soon as the teacher publishes them'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {quizzes.map((q) => {
        const submission = (results || []).find(
          (r) =>
            (r.quizId === q.id || (r as any).id === q.id) &&
            (r.status === 'AUTO_GRADED' || r.status === 'GRADED' || r.status === 'PENDING' || r.isPassed !== undefined)
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
                    score: submission.totalScore ?? submission.autoScore ?? submission.score,
                    maxScore: submission.maxScore,
                    percentage: submission.maxScore
                      ? Math.round(
                          ((submission.totalScore ?? submission.autoScore ?? submission.score ?? 0) /
                            submission.maxScore) *
                            100
                        )
                      : submission.percentage,
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

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

const STORAGE_KEY = 'edu_quizzes';

export function StudentQuizzesListClient({
  initialQuizzes,
  completedQuizIds,
  studentId,
  locale,
}: {
  initialQuizzes: QuizData[];
  completedQuizIds: string[];
  studentId: string;
  locale: string;
}) {
  const [quizzes, setQuizzes] = useState<QuizData[]>(initialQuizzes);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter only published quizzes
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
          return;
        }
      }
    } catch (e) {
      console.warn('[StudentQuizzesListClient] LocalStorage read error:', e);
    }
    setQuizzes(initialQuizzes);
  }, [initialQuizzes]);

  const completedSet = new Set(completedQuizIds);

  if (quizzes.length === 0) {
    return (
      <div className="col-span-full p-12 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100">
        <ClipboardList className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-n-800 dark:text-n-700">لا توجد اختبارات متاحة حالياً</p>
        <p className="text-xs text-n-400 mt-1">سيقوم المعلم بنشر الاختبارات الجديدة هنا قريباً</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {quizzes.map((q) => {
        const isDone = completedSet.has(q.id);
        return (
          <StudentQuizCard
            key={q.id}
            quiz={q}
            isCompleted={isDone}
            studentId={studentId}
            locale={locale}
          />
        );
      })}
    </div>
  );
}

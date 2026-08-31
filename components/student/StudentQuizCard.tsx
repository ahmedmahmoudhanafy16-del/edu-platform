'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Timer, BarChart3, CheckCircle2, Lock, ArrowLeft, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizPasscodeModal } from './QuizPasscodeModal';

interface QuizResultSummary {
  score?: number;
  maxScore?: number;
  percentage?: number;
  isPassed?: boolean;
}

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    type: string;
    duration: number;
    passingScore: number;
    isCodeRequired?: boolean;
    classroomName?: string;
  };
  isCompleted: boolean;
  result?: QuizResultSummary;
  studentId: string;
  locale: string;
  compact?: boolean;
}

export function StudentQuizCard({
  quiz,
  isCompleted,
  result,
  studentId,
  locale,
  compact = false,
}: QuizCardProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const quizTypeBadge: Record<string, string> = {
    WEEKLY: 'text-[11px] bg-accent-light text-accent-text px-2 py-0.5 rounded-full font-medium',
    MONTHLY: 'text-[11px] bg-warn-light text-warn px-2 py-0.5 rounded-full font-medium',
  };

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 shadow-sm';

  function handleStart() {
    if (isCompleted) {
      router.push(`/${locale}/student/grades`);
      return;
    }
    if (quiz.isCodeRequired !== false) {
      setModalOpen(true);
    } else {
      router.push(`/${locale}/student/quizzes/${quiz.id}`);
    }
  }

  return (
    <>
      <div className={`${card} flex flex-col justify-between overflow-hidden transition-all hover:shadow-md`}>
        {/* Card Header */}
        <div className="px-5 pt-5 pb-4 border-b border-n-100 dark:border-n-200">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-n-800 dark:text-n-700 leading-snug">
              {quiz.title}
            </h3>
            <span className={quizTypeBadge[quiz.type] ?? quizTypeBadge.WEEKLY}>
              {quiz.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
            </span>
          </div>
          {quiz.classroomName && (
            <p className="text-xs text-n-400 mt-1">{quiz.classroomName}</p>
          )}
        </div>

        {/* Card Body & Actions */}
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-n-500">
            <span className="flex items-center gap-1">
              <Timer className="h-3.5 w-3.5 text-n-400" strokeWidth={1.75} />
              {quiz.duration} دقيقة
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5 text-n-400" strokeWidth={1.75} />
              نجاح {quiz.passingScore}%
            </span>
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ok bg-ok-light border border-ok/20 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> تم أداء الامتحان ✓
              </span>
              {typeof result?.score === 'number' && (
                <span dir="ltr" className="text-xs font-mono font-bold text-n-800 dark:text-n-700 bg-n-100 dark:bg-n-200 px-2 py-0.5 rounded border border-n-200">
                  {result.score} / {result.maxScore ?? 100}
                </span>
              )}
              <Link href={`/${locale}/student/grades`}>
                <Button size="sm" variant="secondary" className="text-xs h-7 px-2 font-medium">
                  عرض النتيجة
                </Button>
              </Link>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={handleStart} className="flex items-center gap-1">
              {quiz.isCodeRequired !== false && <Lock className="h-3 w-3" />}
              ابدأ الاختبار
            </Button>
          )}
        </div>
      </div>

      <QuizPasscodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        quizId={quiz.id}
        quizTitle={quiz.title}
        studentId={studentId}
        locale={locale}
      />
    </>
  );
}

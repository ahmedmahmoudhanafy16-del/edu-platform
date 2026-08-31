'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuizRunner } from './QuizRunner';
import { QuizPasscodeGuard } from './QuizPasscodeGuard';
import { Loader2, AlertCircle, ArrowRight, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = (params?.id as string)?.trim() || '';
  const locale = (params?.locale as string) || 'ar';

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentId = 'demo-student-1';

  // 1. Ensure Client-Side Hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Client-Side Safe Fetching & Storage Synchronisation
  useEffect(() => {
    if (!isMounted || !quizId) return;

    let isSubscribed = true;

    async function loadQuizData() {
      setLoading(true);
      setError(null);

      let resolvedQuiz: any = null;

      // 1. Check LocalStorage first (instant offline/mock support)
      try {
        const stored = localStorage.getItem('edu_quizzes');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const match = parsed.find(
              (q: any) =>
                q.id === quizId ||
                q.accessCode === quizId ||
                (q.accessCode && q.accessCode.trim().toUpperCase() === quizId.toUpperCase())
            );
            if (match) {
              resolvedQuiz = match;
            }
          }
        }
      } catch (err) {
        console.warn('[QuizPage Client] LocalStorage read skipped:', err);
      }

      // 2. Fetch from API endpoint if not in localStorage or to sync updates
      if (!resolvedQuiz) {
        try {
          const res = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.quiz) {
              resolvedQuiz = data.quiz;
            }
          }
        } catch (fetchErr) {
          console.warn('[QuizPage Client] API fetch skipped:', fetchErr);
        }
      }

      // 3. Fallback default quiz structure if still not found
      if (!resolvedQuiz) {
        resolvedQuiz = {
          id: quizId,
          title: quizId === 'sample-q1' ? 'الاختبار الأسبوعي الأول - الجبر والإحصاء' : 'الاختبار الأسبوعي التفاعلي',
          duration: 20,
          passingScore: 60,
          accessCode: 'QUIZ-MATH-2026',
          isCodeRequired: true,
          isPublished: true,
          questions: [
            {
              id: `q-${quizId}-1`,
              text: 'إذا كان س + 3 = 7، فإن قيمة 2س تساوي:',
              type: 'MCQ',
              options: ['6', '8', '10', '12'],
              maxScore: 5,
            },
            {
              id: `q-${quizId}-2`,
              text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:',
              type: 'MCQ',
              options: ['{3}', '{-3}', '{3, -3}', '∅'],
              maxScore: 5,
            },
            {
              id: `q-${quizId}-3`,
              text: 'اشرح باختصار طريقة حل معادلتين من الدرجة الأولى في متغيرين بيانياً.',
              type: 'ESSAY',
              options: [],
              maxScore: 10,
            },
          ],
        };
      }

      if (!isSubscribed) return;

      // 4. Guard against Hidden / Unpublished Quizzes
      if (resolvedQuiz && (resolvedQuiz.isPublished === false || resolvedQuiz.isHidden === true)) {
        setError('هذا الاختبار غير متاح حالياً');
        setLoading(false);
        return;
      }

      // 5. Check Unlock Status for Passcode Protection
      let unlocked = !resolvedQuiz.isCodeRequired;

      if (!unlocked) {
        try {
          const inSession = sessionStorage.getItem(`unlocked_quiz_${resolvedQuiz.id || quizId}`);
          const inCookie = document.cookie.includes(`unlocked_quiz_${resolvedQuiz.id || quizId}=true`);
          if (inSession === 'true' || inCookie) {
            unlocked = true;
          }
        } catch (e) {}
      }

      setQuiz(resolvedQuiz);
      setIsUnlocked(unlocked);
      setLoading(false);
    }

    loadQuizData();

    return () => {
      isSubscribed = false;
    };
  }, [isMounted, quizId]);

  // Loading State / SSR placeholder (prevents hydration mismatch & server component render crashes)
  if (!isMounted || loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-4" dir="rtl">
        <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center animate-spin">
          <Loader2 className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-n-700 dark:text-n-600">جاري تجهيز وتحميل الامتحان...</p>
      </div>
    );
  }

  // Error State or Hidden Quiz Guard
  if (error || !quiz) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-n-800 dark:text-n-700">الاختبار غير متاح</h2>
          <p className="text-xs text-n-500 font-medium">
            {error || 'هذا الاختبار غير متاح حالياً أو تم إخفاؤه بواسطة المعلم.'}
          </p>
          <Link href={`/${locale}/student`} className="block w-full">
            <Button variant="primary" className="w-full text-xs">
              <ArrowRight className="h-4 w-4 me-1" />
              العودة للوحة تحكم الطالب
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 5. Passcode Guard View (If passcode protected and not unlocked yet)
  if (quiz.isCodeRequired && !isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 flex flex-col justify-center" dir="rtl">
        <QuizPasscodeGuard
          quizId={quiz.id || quizId}
          quizTitle={quiz.title || 'الاختبار الأكاديمي'}
          studentId={studentId}
          locale={locale}
          onUnlocked={() => setIsUnlocked(true)}
        />
      </div>
    );
  }

  // 6. Interactive Quiz Runner View
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 flex flex-col justify-center" dir="rtl">
      <QuizRunner
        quiz={{
          id: quiz.id || quizId,
          title: quiz.title || 'الاختبار الأكاديمي',
          duration: Number(quiz.duration) || 20,
          shuffleQuestions: Boolean(quiz.shuffleQuestions),
          maxViolations: Number(quiz.maxViolations) || 3,
          accessCode: quiz.accessCode,
          questions: Array.isArray(quiz.questions) ? quiz.questions : [],
        }}
        studentId={studentId}
        locale={locale}
      />
    </div>
  );
}

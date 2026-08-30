'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, KeyRound, ArrowLeft, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyQuizAccessCode } from '@/actions/quiz';
import { toast } from 'sonner';
import Link from 'next/link';

interface QuizPasscodeGuardProps {
  quizId: string;
  quizTitle: string;
  studentId: string;
  locale: string;
}

export function QuizPasscodeGuard({
  quizId,
  quizTitle,
  studentId,
  locale,
}: QuizPasscodeGuardProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setErrorMsg('يرجى إدخال كود الامتحان للمتابعة');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyQuizAccessCode(quizId, studentId, cleanCode);
      if (res.success) {
        toast.success('تم التحقق من كود الامتحان بنجاح!');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'الكود غير صحيح أو منتهي الصلاحية');
      }
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء التحقق من الكود، يرجى المحاولة ثانية');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-md overflow-hidden shadow-modal space-y-0">
        {/* Header */}
        <div className="px-6 py-6 text-center border-b border-n-200 dark:border-n-300 bg-n-50/50 dark:bg-n-200/50 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center mx-auto border border-accent/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-n-800 dark:text-n-700">امتحان محمي برمز مرور</h2>
          <p className="text-xs text-n-500 max-w-xs mx-auto leading-relaxed">
            الاختبار: <strong className="text-accent">{quizTitle}</strong>
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600">
              يرجى إدخال كود الامتحان للمتابعة:
            </label>
            <Input
              type="text"
              required
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="مثال: QUIZ-MATH-2026"
              className="font-mono text-center font-bold tracking-widest text-base uppercase py-5 border-2 focus:border-accent"
              autoFocus
              autoComplete="off"
            />
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-bad bg-bad-light p-2.5 rounded-lg border border-bad/20 mt-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full font-semibold"
            >
              تأكيد والدخول للاختبار
              <ArrowLeft className="h-4 w-4 mr-1.5" />
            </Button>
            <Link href={`/${locale}/student/quizzes`}>
              <Button type="button" variant="secondary" size="md" className="w-full">
                العودة لقائمة الامتحانات
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

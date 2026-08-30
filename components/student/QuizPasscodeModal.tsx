'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Lock, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyQuizAccessCode } from '@/actions/quiz';
import { toast } from 'sonner';

interface QuizPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
  studentId: string;
  locale: string;
}

export function QuizPasscodeModal({
  isOpen,
  onClose,
  quizId,
  quizTitle,
  studentId,
  locale,
}: QuizPasscodeModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setErrorMsg('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault();
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
        onClose();
        router.push(`/${locale}/student/quizzes/${quizId}`);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-md overflow-hidden shadow-modal space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300 bg-n-50/50 dark:bg-n-200/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-light text-accent flex items-center justify-center border border-accent/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">كود دخول الامتحان</h3>
              <p className="text-xs text-n-400">امتحان محمي برمز مرور</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-n-400 hover:text-n-700 dark:hover:text-n-500 p-1.5 rounded-lg hover:bg-n-100 dark:hover:bg-n-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-n-700 dark:text-n-600">
              الاختبار المطلوب: <span className="font-bold text-accent">{quizTitle}</span>
            </p>
            <p className="text-xs text-n-500 leading-relaxed">
              يرجى إدخال كود الامتحان للمتابعة (الكود المسلم لك من المعلم):
            </p>
          </div>

          <div>
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="مثال: QUIZ-MATH-2026"
                className="font-mono text-center font-bold tracking-widest text-base uppercase py-5 border-2 focus:border-accent"
                autoComplete="off"
              />
            </div>
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-bad bg-bad-light p-2.5 rounded-lg border border-bad/20 mt-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="flex-1 font-semibold"
            >
              تأكيد والدخول
              <ArrowLeft className="h-4 w-4 mr-1.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

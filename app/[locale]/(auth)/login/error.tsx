'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Login Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">حدث خطأ أثناء تحميل صفحة الدخول</h2>
        <p className="text-xs text-slate-500">{error.message || 'تعذر معالجة الطلب'}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button onClick={() => reset()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <RefreshCcw className="h-4 w-4 ml-1.5" />
            إعادة المحاولة
          </Button>
          <Link href="/">
            <Button variant="secondary">الرئيسية</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

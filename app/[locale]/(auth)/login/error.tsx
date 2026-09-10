'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  useEffect(() => {
    console.error('Login Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isAr ? 'حدث خطأ أثناء تحميل صفحة الدخول' : 'An error occurred loading the login page'}
        </h2>
        <p className="text-xs text-slate-500">{error.message || (isAr ? 'تعذر معالجة الطلب' : 'Could not process request')}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button onClick={() => reset()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <RefreshCcw className={`h-4 w-4 ${isAr ? 'ml-1.5' : 'mr-1.5'}`} />
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
          <Link href={`/${locale}`}>
            <Button variant="secondary">
              <Home className={`h-4 w-4 ${isAr ? 'ml-1.5' : 'mr-1.5'}`} />
              {isAr ? 'الرئيسية' : 'Home'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

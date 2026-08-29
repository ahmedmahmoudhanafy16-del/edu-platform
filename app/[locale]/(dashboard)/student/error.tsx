'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StudentRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Student Dashboard Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl p-8 max-w-lg w-full text-center shadow-lg space-y-5">
        <div className="w-14 h-14 bg-bad-light text-bad rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-n-800 dark:text-n-700">
            حدث خطأ أثناء تحميل لوحة الطالب
          </h2>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            يرجى إعادة المحاولة أو العودة للصفحة الرئيسية
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} variant="primary" size="md">
            <RefreshCcw className="h-4 w-4 ml-1.5" />
            إعادة المحاولة
          </Button>
          <Link href="/ar/student">
            <Button variant="secondary" size="md">
              <Home className="h-4 w-4 ml-1.5" />
              الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

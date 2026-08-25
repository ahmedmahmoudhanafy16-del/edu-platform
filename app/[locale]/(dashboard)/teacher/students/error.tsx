'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeacherStudentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the real error and server digest to console for debugging
    console.error('Teacher Students Error Boundary Caught:', error);
    if (error.digest) {
      console.error('Error Digest:', error.digest);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 max-w-lg w-full text-center shadow-lg space-y-5">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-950/50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            حدث خطأ أثناء معالجة بيانات الطلاب
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعذر إكمال معالجة الصفحة على الخادم (Server Component Render Error).
          </p>
        </div>

        {/* Development Error Details */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-start font-mono text-xs border border-slate-200 dark:border-slate-700 space-y-1 text-slate-800 dark:text-slate-200 overflow-x-auto">
          <p className="font-bold text-red-600 dark:text-red-400">
            {error.message || 'Server Component render error'}
          </p>
          {error.digest && (
            <p className="text-[11px] text-slate-400">
              Digest ID: <code className="text-blue-600 dark:text-blue-400">{error.digest}</code>
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <RefreshCcw className="h-4 w-4 ml-1.5" />
            إعادة المحاولة
          </Button>
          <Link href="/ar/teacher">
            <Button variant="secondary">
              <Home className="h-4 w-4 ml-1.5" />
              الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LogoutPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      router.push(`/${locale}/login`);
    });
  }, [locale, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4" dir="rtl">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">جاري تسجيل الخروج بأمان...</p>
      </div>
    </div>
  );
}

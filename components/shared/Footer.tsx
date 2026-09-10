'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';

export function Footer() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-n-200 dark:border-n-300 bg-white dark:bg-n-100 mt-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-n-400">
          {isAr
            ? `${year} منصة التعليم الإلكتروني. جميع الحقوق محفوظة.`
            : `© ${year} EduPlatform. All rights reserved.`}
        </p>
        <nav className="flex items-center gap-4 text-xs text-n-400">
          <Link href={`/${locale}/privacy`} className="hover:text-n-700 dark:hover:text-n-300 transition-colors">
            {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </Link>
          <Link href={`/${locale}/terms`} className="hover:text-n-700 dark:hover:text-n-300 transition-colors">
            {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
          </Link>
          <Link href={`/${locale}/support`} className="hover:text-n-700 dark:hover:text-n-300 transition-colors">
            {isAr ? 'الدعم والمساعدة' : 'Support & Help'}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

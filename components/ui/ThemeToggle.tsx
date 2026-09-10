'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const isAr = locale === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  const handleToggle = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transition');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 250);
    }
    setTheme(isDark ? 'light' : 'dark');
  };

  const labelText = isDark
    ? (isAr ? 'تفعيل الوضع النهاري' : 'Switch to Light Mode')
    : (isAr ? 'تفعيل الوضع الليلي' : 'Switch to Dark Mode');

  return (
    <button
      onClick={handleToggle}
      type="button"
      aria-label={labelText}
      title={labelText}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 border border-transparent"
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform duration-300" strokeWidth={1.75} />
        ) : (
          <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300 hover:-rotate-12 transition-transform duration-300" strokeWidth={1.75} />
        )
      ) : (
        <span className="w-4 h-4 inline-block" />
      )}
    </button>
  );
}

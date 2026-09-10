'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      type="button"
      aria-label={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-n-500 hover:text-n-800 hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-[140ms] border border-transparent"
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
        ) : (
          <Moon className="h-4 w-4" strokeWidth={1.75} />
        )
      ) : (
        <span className="w-4 h-4 inline-block" />
      )}
    </button>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

/**
 * Calculates the exact target URL when switching between Arabic and English.
 * Supports:
 * - Default locale without prefix (e.g. '/teacher/reports') -> '/en/teacher/reports'
 * - English prefixed routes (e.g. '/en/teacher/reports') -> '/teacher/reports'
 * - Explicit Arabic prefixed routes (e.g. '/ar/teacher/reports') -> '/en/teacher/reports'
 * - Root paths ('/' <-> '/en')
 * - Query strings and hashes (e.g. '/teacher/students?grade=3#tab') -> '/en/teacher/students?grade=3#tab'
 */
export function getLocalizedTargetPath(currentPathname: string, targetLocale: 'ar' | 'en'): string {
  const path = currentPathname || '/';

  // Separate path from query string & hash if present
  const queryIndex = path.indexOf('?');
  const hashIndex = path.indexOf('#');
  let splitIndex = -1;
  if (queryIndex !== -1 && hashIndex !== -1) {
    splitIndex = Math.min(queryIndex, hashIndex);
  } else if (queryIndex !== -1) {
    splitIndex = queryIndex;
  } else if (hashIndex !== -1) {
    splitIndex = hashIndex;
  }

  const pathnameOnly = splitIndex !== -1 ? path.substring(0, splitIndex) : path;
  const extra = splitIndex !== -1 ? path.substring(splitIndex) : '';

  // Strip existing locale prefix if present
  let cleanPath = pathnameOnly;
  if (cleanPath.startsWith('/en/') || cleanPath === '/en') {
    cleanPath = cleanPath.substring(3) || '/';
  } else if (cleanPath.startsWith('/ar/') || cleanPath === '/ar') {
    cleanPath = cleanPath.substring(3) || '/';
  }

  // With localePrefix: 'as-needed', Arabic (default) has no prefix, English has '/en'
  if (targetLocale === 'en') {
    return (cleanPath === '/' ? '/en' : `/en${cleanPath}`) + extra;
  } else {
    return cleanPath + extra;
  }
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  function toggle() {
    const nextLocale: 'ar' | 'en' = locale === 'ar' ? 'en' : 'ar';
    const targetPath = getLocalizedTargetPath(pathname, nextLocale);

    // Persist locale preference in cookie for next-intl
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }

    // Force full document navigation to guarantee layout, font, and dir (RTL/LTR) re-render
    if (typeof window !== 'undefined') {
      window.location.href = targetPath;
    }
  }

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label="تغيير اللغة / Switch language"
      className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-n-500 hover:text-n-800 hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-[140ms] text-xs font-medium border border-transparent"
    >
      <Globe className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
      <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}

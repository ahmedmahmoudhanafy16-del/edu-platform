'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, X, GraduationCap, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { cn } from '@/lib/utils';

interface NavLink {
  label: string;
  href: string;
}

interface TopNavProps {
  role: 'TEACHER' | 'STUDENT';
  userName?: string;
  brandName?: string;
}

export function TopNav({ role, userName, brandName }: TopNavProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Strict route isolation: Teacher area vs Student area
  const isTeacherArea = pathname.includes('/teacher');
  const effectiveRole = isTeacherArea ? 'TEACHER' : 'STUDENT';

  // In next-intl with localePrefix: 'as-needed', Arabic has NO prefix, English has '/en'
  const prefix = locale === 'en' ? '/en' : '';
  const area = effectiveRole === 'TEACHER' ? '/teacher' : '/student';
  const base = `${prefix}${area}`;

  const links: NavLink[] =
    effectiveRole === 'STUDENT'
      ? [
          { label: isAr ? 'الرئيسية' : 'Dashboard',       href: base },
          { label: isAr ? 'الاختبارات' : 'Quizzes',       href: `${base}/quizzes` },
          { label: isAr ? 'الواجبات' : 'Assignments',     href: `${base}/assignments` },
          { label: isAr ? 'البث المباشر' : 'Live Class',   href: `${base}/live` },
          { label: isAr ? 'الدرجات' : 'Grades',          href: `${base}/grades` },
        ]
      : [
          { label: isAr ? 'الرئيسية' : 'Dashboard',         href: base },
          { label: isAr ? 'الفصول' : 'Classrooms',           href: `${base}/classrooms` },
          { label: isAr ? 'الواجبات' : 'Assignments',         href: `${base}/assignments` },
          { label: isAr ? 'الامتحانات' : 'Quizzes',       href: `${base}/quizzes` },
          { label: isAr ? 'البث المباشر' : 'Live Class',     href: `${base}/live` },
          { label: isAr ? 'الطلاب' : 'Students',          href: `${base}/students` },
          { label: isAr ? 'التقارير' : 'Reports',         href: `${base}/reports` },
        ];

  const isActive = (href: string) => {
    // Normalize both paths by stripping optional locale prefixes for exact matching
    const cleanPath = pathname.replace(/^\/(?:en|ar)(?=\/|$)/, '') || '/';
    const cleanHref = href.replace(/^\/(?:en|ar)(?=\/|$)/, '') || '/';
    const cleanBase = base.replace(/^\/(?:en|ar)(?=\/|$)/, '') || '/';

    return cleanHref === cleanBase
      ? cleanPath === cleanHref
      : cleanPath.startsWith(cleanHref);
  };

  const displayUserName =
    effectiveRole === 'STUDENT'
      ? (userName || (isAr ? 'الطالب' : 'Student'))
      : (userName || (isAr ? 'المعلم' : 'Teacher'));

  const initials =
    (displayUserName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('')) ||
    (effectiveRole === 'STUDENT' ? (isAr ? 'ط' : 'S') : (isAr ? 'م' : 'T'));

  const resolvedBrandName = brandName || (isAr ? 'منصة التعليم' : 'EduPlatform');

  return (
    <>
      {/* ── Top navigation bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* ── Brand (right in RTL) ─────────────────────────────────── */}
          <Link href={base} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="hidden sm:block text-sm font-bold text-slate-900 dark:text-white leading-none">
              {resolvedBrandName}
            </span>
          </Link>

          {/* ── Center nav links (desktop only) ─────────────────────── */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap',
                  isActive(href)
                    ? 'bg-accent-light text-accent-text dark:bg-accent/20 dark:text-accent-text'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Right controls (left in RTL) ─────────────────────────── */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* User avatar */}
            <div className="hidden sm:flex items-center gap-2 ms-1 ps-3 border-s border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-accent-text leading-none">{initials}</span>
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[110px] truncate">
                {displayUserName}
              </span>
              <Link
                href={prefix ? `${prefix}/logout` : '/logout'}
                className="p-1.5 rounded-md text-slate-400 hover:text-bad hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
                title={isAr ? 'تسجيل الخروج' : 'Sign out'}
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              type="button"
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
              aria-label={menuOpen ? (isAr ? 'إغلاق القائمة' : 'Close menu') : (isAr ? 'فتح القائمة' : 'Open menu')}
            >
              {menuOpen ? <X className="h-4 w-4" strokeWidth={2} /> : <Menu className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ─────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-150',
                  isActive(href)
                    ? 'bg-accent-light text-accent-text dark:bg-accent/20 dark:text-accent-text'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-accent-text">{initials}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                  {displayUserName}
                </span>
              </div>
              <Link
                href={prefix ? `${prefix}/logout` : '/logout'}
                onClick={() => setMenuOpen(false)}
                className="text-xs text-bad flex items-center gap-1 font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                {isAr ? 'خروج' : 'Sign out'}
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

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

export function TopNav({ role, userName = 'أحمد', brandName = 'منصة التعليم' }: TopNavProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Strict route isolation: Student pages can NEVER render teacher links
  const isTeacherArea = pathname.includes('/teacher');
  const effectiveRole = isTeacherArea ? 'TEACHER' : 'STUDENT';
  const base = `/${locale}/${effectiveRole === 'TEACHER' ? 'teacher' : 'student'}`;

  const links: NavLink[] =
    effectiveRole === 'STUDENT'
      ? [
          { label: 'الرئيسية',       href: base },
          { label: 'الاختبارات',     href: `${base}/quizzes` },
          { label: 'الواجبات',       href: `${base}/assignments` },
          { label: 'البث المباشر',   href: `${base}/live` },
          { label: 'الدرجات',        href: `${base}/grades` },
          { label: 'الجدول',         href: `${base}/schedule` },
        ]
      : [
          { label: 'الرئيسية',         href: base },
          { label: 'الفصول',           href: `${base}/classrooms` },
          { label: 'الواجبات',         href: `${base}/assignments` },
          { label: 'الامتحانات',       href: `${base}/quizzes` },
          { label: 'البث المباشر',     href: `${base}/live` },
          { label: 'الطلاب',          href: `${base}/students` },
          { label: 'التقارير',         href: `${base}/reports` },
        ];

  const isActive = (href: string) =>
    href === base ? pathname === href : pathname.startsWith(href);

  const displayUserName =
    effectiveRole === 'STUDENT'
      ? (userName && !userName.includes('سارة') ? userName : 'الطالب')
      : (userName || 'أ/ سارة أحمد');

  const initials = displayUserName
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <>
      {/* ── Top navigation bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-n-100 border-b border-n-200 dark:border-n-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* ── Brand (right in RTL) ─────────────────────────────────── */}
          <Link href={base} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="hidden sm:block text-sm font-bold text-n-800 dark:text-n-700 leading-none">
              {brandName}
            </span>
          </Link>

          {/* ── Center nav links (desktop only) ─────────────────────── */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-[140ms] whitespace-nowrap',
                  isActive(href)
                    ? 'bg-accent-light text-accent-text'
                    : 'text-n-600 dark:text-n-400 hover:text-n-800 dark:hover:text-n-700 hover:bg-n-100 dark:hover:bg-n-200',
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
            <div className="hidden sm:flex items-center gap-2 ms-1 ps-3 border-s border-n-200 dark:border-n-300">
              <div className="w-7 h-7 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-accent-text leading-none">{initials}</span>
              </div>
              <span className="text-xs font-semibold text-n-700 dark:text-n-600 max-w-[110px] truncate">
                {displayUserName}
              </span>
              <Link
                href={`/${locale}/logout`}
                className="p-1.5 rounded-md text-n-400 hover:text-bad hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-[140ms]"
                title="تسجيل الخروج"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-[140ms]"
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {menuOpen ? <X className="h-4 w-4" strokeWidth={2} /> : <Menu className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ─────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden border-t border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-4 py-3 space-y-1">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-[140ms]',
                  isActive(href)
                    ? 'bg-accent-light text-accent-text'
                    : 'text-n-600 dark:text-n-400 hover:bg-n-100 dark:hover:bg-n-200',
                )}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-n-100 dark:border-n-200 flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-accent-text">{initials}</span>
                </div>
                <span className="text-xs font-semibold text-n-700 dark:text-n-600 truncate max-w-[120px]">
                  {displayUserName}
                </span>
              </div>
              <Link
                href={`/${locale}/logout`}
                className="text-xs text-bad flex items-center gap-1 font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                خروج
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

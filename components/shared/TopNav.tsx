'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Menu, X, GraduationCap, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { cn } from '@/lib/utils';

interface NavLink {
  label: string;
  href: string;
}

interface TopNavProps {
  role?: 'TEACHER' | 'STUDENT';
  userName?: string;
  brandName?: string;
}

export function TopNav({ role: initialRole, userName: initialName, brandName = 'منصة التعليم' }: TopNavProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto-detect role strictly from the URL path so tabs are always 100% accurate
  const isTeacher = pathname.includes('/teacher');
  const role = isTeacher ? 'TEACHER' : 'STUDENT';
  const userName = initialName || (isTeacher ? 'أ/ أحمد محمود' : 'يوسف الطالب');

  const base = `/${locale}/${isTeacher ? 'teacher' : 'student'}`;

  const links: NavLink[] =
    role === 'STUDENT'
      ? [
          { label: 'الرئيسية',       href: `/${locale}/student` },
          { label: 'الاختبارات',     href: `/${locale}/student/quizzes` },
          { label: 'الواجبات',       href: `/${locale}/student/assignments` },
          { label: 'سجل الدرجات',   href: `/${locale}/student/grades` },
          { label: 'لوحة الشرف',    href: `/${locale}/student/leaderboard` },
          { label: 'البث المباشر',   href: `/${locale}/student/live` },
        ]
      : [
          { label: 'الرئيسية',         href: `/${locale}/teacher` },
          { label: 'الفصول',           href: `/${locale}/teacher/classrooms` },
          { label: 'الواجبات',         href: `/${locale}/teacher/assignments` },
          { label: 'الامتحانات',       href: `/${locale}/teacher/quizzes` },
          { label: 'الطلاب',          href: `/${locale}/teacher/students` },
          { label: 'البث المباشر',     href: `/${locale}/teacher/live` },
        ];

  const isActive = (href: string) => {
    if (href === base) return pathname === href || pathname === `/${locale}`;
    return pathname.startsWith(href);
  };

  const initials = userName
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  function handleNavigate(href: string) {
    setMenuOpen(false);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <>
      {/* ── Top navigation bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-n-100 border-b border-n-200 dark:border-n-300">
        {/* Subtle instant loading bar during tab transitions */}
        {isPending && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent animate-pulse z-50" />
        )}

        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* ── Brand (right in RTL) ─────────────────────────────────── */}
          <Link
            href={base}
            prefetch={true}
            className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="hidden sm:block text-sm font-bold text-n-800 dark:text-n-700 leading-none">
              {brandName}
            </span>
          </Link>

          {/* ── Center nav links (desktop only) ─────────────────────── */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {links.map(({ label, href }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  onClick={() => handleNavigate(href)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-100 whitespace-nowrap cursor-pointer',
                    active
                      ? 'bg-accent-light text-accent-text font-bold shadow-xs'
                      : 'text-n-600 dark:text-n-400 hover:text-n-800 dark:hover:text-n-700 hover:bg-n-100 dark:hover:bg-n-200 active:scale-95',
                  )}
                >
                  {label}
                </Link>
              );
            })}
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
              <span className="text-xs font-medium text-n-700 dark:text-n-600 max-w-[96px] truncate">
                {userName}
              </span>
              <Link
                href={`/${locale}/login`}
                prefetch={true}
                className="p-1.5 rounded-md text-n-400 hover:text-bad hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-100"
                title="تسجيل الخروج"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-md border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-100"
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {menuOpen ? <X className="h-4 w-4" strokeWidth={2} /> : <Menu className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ─────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden border-t border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-4 py-3 space-y-0.5">
            {links.map(({ label, href }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  onClick={() => handleNavigate(href)}
                  className={cn(
                    'flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100',
                    active
                      ? 'bg-accent-light text-accent-text font-bold'
                      : 'text-n-600 dark:text-n-400 hover:bg-n-100 dark:hover:bg-n-200',
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-n-100 dark:border-n-200 flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-accent-text">{initials}</span>
                </div>
                <span className="text-xs font-medium text-n-700 dark:text-n-600 truncate max-w-[120px]">
                  {userName}
                </span>
              </div>
              <Link
                href={`/${locale}/login`}
                prefetch={true}
                className="text-xs text-bad flex items-center gap-1 font-medium"
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

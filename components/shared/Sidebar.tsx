'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutDashboard, BookOpen, FileText,
  ClipboardList, Video, Users, Trophy, LogOut,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: 'TEACHER' | 'STUDENT';
  userName: string;
  onNavClick?: () => void; // optional: close drawer on mobile
}

export function Sidebar({ role, userName, onNavClick }: SidebarProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const isRtl = locale === 'ar';

  const base = `/${locale}/${role === 'TEACHER' ? 'teacher' : 'student'}`;

  const nav =
    role === 'TEACHER'
      ? [
          { label: t('dashboard'), href: base, icon: LayoutDashboard },
          { label: t('classrooms'), href: `${base}/classrooms`, icon: BookOpen },
          { label: t('assignments'), href: `${base}/assignments`, icon: FileText },
          { label: t('quizzes'), href: `${base}/quizzes`, icon: ClipboardList },
          { label: t('live'), href: `${base}/live`, icon: Video },
          { label: t('students'), href: `${base}/students`, icon: Users },
        ]
      : [
          { label: t('dashboard'), href: base, icon: LayoutDashboard },
          { label: t('assignments'), href: `${base}/assignments`, icon: FileText },
          { label: t('quizzes'), href: `${base}/quizzes`, icon: ClipboardList },
          { label: t('grades'), href: `${base}/grades`, icon: Trophy },
          { label: t('live'), href: `${base}/live`, icon: Video },
        ];

  return (
    <aside
      className={cn(
        'flex flex-col h-full w-full transition-colors duration-150',
        'bg-white dark:bg-slate-900',
        // Border on the correct edge depending on reading direction
        isRtl ? 'border-l border-slate-200 dark:border-slate-800' : 'border-r border-slate-200 dark:border-slate-800',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'px-5 py-5 border-b border-slate-200 dark:border-slate-800',
          isRtl ? 'text-right' : 'text-left',
        )}
      >
        <p className="text-label font-bold text-slate-900 dark:text-white leading-none">
          {isRtl ? 'منصة التعليم' : 'EduPlatform'}
        </p>
        <p className="text-caption text-slate-500 dark:text-slate-400 mt-1">
          {role === 'TEACHER' ? t('teacher') : t('student')}
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href || (href !== base && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-label font-medium',
                'transition-colors duration-150 w-full',
                isRtl ? 'flex-row-reverse' : 'flex-row',
                active
                  ? 'bg-accent-light text-accent-text dark:bg-accent/20 dark:text-accent-text border border-accent/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent',
              )}
            >
              <Icon
                className="h-[18px] w-[18px] flex-shrink-0"
                strokeWidth={active ? 2 : 1.75}
              />
              <span className={cn('truncate', isRtl ? 'text-right' : 'text-left')}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: controls + user + logout */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Theme + Language toggles */}
        <div
          className={cn(
            'flex items-center gap-1 px-1',
            isRtl ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* User info */}
        <div className={cn('px-3', isRtl ? 'text-right' : 'text-left')}>
          <p className="text-label font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">
            {userName}
          </p>
          <p className="text-caption text-slate-500 dark:text-slate-400 mt-0.5">
            {role === 'TEACHER' ? t('teacher') : t('student')}
          </p>
        </div>

        {/* Logout */}
        <Link
          href={`/${locale}/login`}
          onClick={onNavClick}
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg',
            'text-label text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-bad',
            'transition-colors duration-150',
            isRtl ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.75} />
          <span>{t('logout')}</span>
        </Link>
      </div>
    </aside>
  );
}

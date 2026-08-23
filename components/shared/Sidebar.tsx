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
        'flex flex-col h-full w-full',
        'bg-white dark:bg-n-100',
        // Border on the correct edge depending on reading direction
        isRtl ? 'border-l border-n-200 dark:border-n-300' : 'border-r border-n-200 dark:border-n-300',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'px-5 py-5 border-b border-n-200 dark:border-n-300',
          isRtl ? 'text-right' : 'text-left',
        )}
      >
        <p className="text-label font-semibold text-n-800 dark:text-n-700 leading-none">
          منصة التعليم
        </p>
        <p className="text-caption text-n-400 mt-1">
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
                'transition-colors duration-[140ms] w-full',
                isRtl ? 'flex-row-reverse' : 'flex-row',
                active
                  ? 'bg-accent-light text-accent-text border border-accent/20'
                  : 'text-n-600 dark:text-n-400 hover:bg-n-100 dark:hover:bg-n-200 hover:text-n-800 border border-transparent',
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
      <div className="px-3 py-4 border-t border-n-200 dark:border-n-300 space-y-3">
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
          <p className="text-label font-semibold text-n-700 dark:text-n-600 truncate leading-tight">
            {userName}
          </p>
          <p className="text-caption text-n-400 mt-0.5">
            {role === 'TEACHER' ? t('teacher') : t('student')}
          </p>
        </div>

        {/* Logout */}
        <Link
          href={`/${locale}/login`}
          onClick={onNavClick}
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg',
            'text-label text-n-500 hover:bg-n-100 dark:hover:bg-n-200 hover:text-bad',
            'transition-colors duration-[140ms]',
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

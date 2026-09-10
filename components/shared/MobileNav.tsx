'use client';

import { X, Menu } from 'lucide-react';
import { Sidebar } from '@/components/shared/Sidebar';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface MobileNavProps {
  role: 'TEACHER' | 'STUDENT';
  userName: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function MobileNav({ role, userName, isOpen, onOpen, onClose }: MobileNavProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <>
      {/* ── Top header bar (mobile/tablet only) ──────────────────────── */}
      <header
        className={cn(
          'lg:hidden flex items-center justify-between',
          'px-4 h-14 border-b border-slate-200 dark:border-slate-800',
          'bg-white dark:bg-slate-900 sticky top-0 z-40 transition-colors duration-150',
        )}
      >
        {/* Brand name */}
        <span className="text-label font-bold text-slate-900 dark:text-white">
          منصة التعليم
        </span>

        {/* Hamburger button */}
        <button
          onClick={onOpen}
          aria-label="فتح القائمة"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg',
            'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300',
            'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150',
          )}
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      {/* ── Backdrop ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-over drawer ─────────────────────────────────────────── */}
      <div
        className={cn(
          'lg:hidden fixed top-0 z-50 h-full w-72',
          'bg-white dark:bg-slate-900',
          'transition-transform duration-200 ease-out',
          // Slide from the correct edge
          isRtl
            ? cn('right-0', isOpen ? 'translate-x-0' : 'translate-x-full')
            : cn('left-0', isOpen ? 'translate-x-0' : '-translate-x-full'),
        )}
        aria-label="القائمة الجانبية"
      >
        {/* Close button inside drawer */}
        <div
          className={cn(
            'flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-800',
            isRtl ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span className="text-label font-bold text-slate-900 dark:text-white">
            منصة التعليم
          </span>
          <button
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Reuse the same Sidebar component */}
        <div className="h-[calc(100%-56px)] overflow-y-auto">
          <Sidebar role={role} userName={userName} onNavClick={onClose} />
        </div>
      </div>
    </>
  );
}

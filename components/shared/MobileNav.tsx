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
          'px-4 h-14 border-b border-n-200 dark:border-n-300',
          'bg-white dark:bg-n-100 sticky top-0 z-40',
        )}
      >
        {/* Brand name */}
        <span className="text-label font-semibold text-n-800 dark:text-n-700">
          منصة التعليم
        </span>

        {/* Hamburger button */}
        <button
          onClick={onOpen}
          aria-label="فتح القائمة"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg',
            'border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400',
            'hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-[140ms]',
          )}
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      {/* ── Backdrop ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-n-900/50 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-over drawer ─────────────────────────────────────────── */}
      <div
        className={cn(
          'lg:hidden fixed top-0 z-50 h-full w-72',
          'bg-white dark:bg-n-100',
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
            'flex items-center justify-between px-4 h-14 border-b border-n-200 dark:border-n-300',
            isRtl ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span className="text-label font-semibold text-n-800 dark:text-n-700">
            منصة التعليم
          </span>
          <button
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-n-500 hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-[140ms]"
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

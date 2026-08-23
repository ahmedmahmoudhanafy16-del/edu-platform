'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileNav } from '@/components/shared/MobileNav';
import { AnnouncementBanner } from '@/components/shared/AnnouncementBanner';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface DashboardShellProps {
  role: 'TEACHER' | 'STUDENT';
  userName: string;
  children: React.ReactNode;
}

/**
 * Proper two-column dashboard shell:
 * - Desktop: sticky sidebar + flex-1 main content (NO fixed positioning)
 * - Mobile/Tablet: top header bar + slide-over drawer
 */
export function DashboardShell({ role, userName, children }: DashboardShellProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={cn('min-h-screen flex flex-col bg-n-50 dark:bg-n-50')}>
      {/* ── Announcement strip (full-width above everything) ─────────── */}
      <AnnouncementBanner />

      {/* ── Mobile header (hidden on lg+) ───────────────────────────── */}
      <MobileNav
        role={role}
        userName={userName}
        isOpen={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />

      {/* ── Body: sidebar + main ────────────────────────────────────── */}
      <div className={cn('flex flex-1', isRtl ? 'flex-row-reverse' : 'flex-row')}>
        {/* ── Desktop sidebar (hidden on mobile) ──────────────────── */}
        <div className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <Sidebar role={role} userName={userName} />
          </div>
        </div>

        {/* ── Main content area ────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

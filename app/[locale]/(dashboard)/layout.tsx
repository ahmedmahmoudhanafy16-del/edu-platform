import { TopNav } from '@/components/shared/TopNav';
import { AnnouncementBanner } from '@/components/shared/AnnouncementBanner';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let currentUser = null;
  try {
    currentUser = await getCurrentUser();
  } catch (err) {
    console.warn('[DashboardLayout] User session lookup warning:', err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <AnnouncementBanner />
      <TopNav
        role={currentUser?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT'}
        userName={currentUser?.name}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

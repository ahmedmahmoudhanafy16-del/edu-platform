import { TopNav } from '@/components/shared/TopNav';
import { AnnouncementBanner } from '@/components/shared/AnnouncementBanner';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

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

  if (currentUser && currentUser.role === 'STUDENT' && currentUser.isActive === false) {
    redirect('/ar/suspended');
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

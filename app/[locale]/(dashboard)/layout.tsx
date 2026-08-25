import { TopNav } from '@/components/shared/TopNav';
import { AnnouncementBanner } from '@/components/shared/AnnouncementBanner';
import { getCurrentUser } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

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

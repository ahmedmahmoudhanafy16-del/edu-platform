import { TopNav } from '@/components/shared/TopNav';
import { AnnouncementBanner } from '@/components/shared/AnnouncementBanner';

/**
 * Shared layout for all (dashboard) routes — teacher & student.
 * Extremely lightweight and fast — zero blocking queries.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-n-50 dark:bg-n-50">
      <AnnouncementBanner />
      <TopNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

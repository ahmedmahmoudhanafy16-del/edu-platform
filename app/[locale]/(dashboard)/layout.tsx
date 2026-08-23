import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/shared/TopNav';
import { AnnouncementBanner } from '@/components/shared/AnnouncementBanner';

/**
 * Shared layout for all (dashboard) routes — teacher & student.
 * Provides: AnnouncementBanner + TopNav + page container.
 * Individual pages just render their content inside <main>.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Determine role from DB — in production replace with session/cookie
  const user = await prisma.user.findFirst({
    where: { role: { in: ['TEACHER', 'STUDENT'] } },
    orderBy: { createdAt: 'asc' },
    select: { name: true, role: true },
  });

  const role = (user?.role as 'TEACHER' | 'STUDENT') ?? 'STUDENT';
  const userName = user?.name ?? 'المستخدم';

  return (
    <div className="min-h-screen flex flex-col bg-n-50 dark:bg-n-50">
      <AnnouncementBanner />
      <TopNav role={role} userName={userName} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

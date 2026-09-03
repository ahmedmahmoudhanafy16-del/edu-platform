import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const user = await getCurrentUser();

  // 1. If not logged in, redirect to student login
  if (!user) {
    redirect(`/${locale}/student-login`);
  }

  // 2. If logged in as TEACHER/ADMIN, redirect to teacher dashboard
  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    redirect(`/${locale}/teacher/live`);
  }

  // 3. If suspended
  if (user.role === 'STUDENT' && user.isActive === false) {
    redirect(`/${locale}/suspended`);
  }

  return <>{children}</>;
}

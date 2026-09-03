import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const user = await getCurrentUser();

  // 1. If not logged in, redirect to teacher login
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // 2. If logged in as STUDENT, forbid access to teacher section and redirect to student dashboard
  if (user.role === 'STUDENT') {
    redirect(`/${locale}/student`);
  }

  return <>{children}</>;
}

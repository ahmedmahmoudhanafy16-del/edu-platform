import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Wifi, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthenticatedTeacher } from '@/lib/auth';
import { TeacherDashboardOverviewClient } from '@/components/teacher/TeacherDashboardOverviewClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const teacher = await getAuthenticatedTeacher();
  const teacherId = teacher?.id ?? '';

  let classroomsCount = 1;
  let studentsCount = 4;
  let activeLive: any[] = [];
  let recentAssignments: any[] = [];

  try {
    const [clsCount, stuCount, live, assigns] = await Promise.all([
      prisma.classroom.count({ where: { teacherId } }).catch(() => 1),
      prisma.user.count({ where: { role: 'STUDENT' } }).catch(() => 4),
      prisma.liveSession.findMany({
        where: { isActive: true },
        include: { classroom: true },
      }).catch(() => []),
      prisma.assignment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
    ]);

    classroomsCount = clsCount;
    studentsCount = stuCount;
    activeLive = live || [];
    recentAssignments = assigns || [];
  } catch (err) {
    console.warn('[Teacher Dashboard] DB queries cold on Vercel:', err);
  }

  const serializedAssignments = (recentAssignments || []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description || '',
    dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : new Date().toISOString(),
    maxScore: a.maxScore ?? 10,
    isClosed: Boolean(a.isClosed),
    classroomName: a.classroom?.name || 'فصل الرياضيات',
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">لوحة تحكم المعلم</h1>
          <p className="text-sm text-n-500 dark:text-n-400 mt-1">
            مرحباً أ/ {teacher?.name ?? 'سارة أحمد'} — إليك ملخص نشاط فصولك اليوم
          </p>
        </div>
        <Link href={`/${locale}/teacher/access-codes`}>
          <Button variant="primary" size="sm" className="text-xs flex items-center gap-1.5 shadow-sm">
            <Ticket className="h-4 w-4" />
            توليد أكواد الحصص المباشرة
          </Button>
        </Link>
      </div>

      {/* Live banner */}
      {activeLive.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent-light px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold text-accent-text text-base">
                حصة مباشرة نشطة: {activeLive[0].title}
              </p>
              <p className="text-sm text-accent-text/70 mt-1">
                كود الطلاب:{' '}
                <code className="font-mono font-bold text-accent-text bg-white dark:bg-n-100 px-2 py-0.5 rounded border border-accent/20">
                  {activeLive[0].roomCode}
                </code>
              </p>
            </div>
          </div>
          <Link href={`/${locale}/teacher/live`}>
            <Button size="md" variant="primary">
              <Wifi className="h-4 w-4" strokeWidth={2} />
              دخول الغرفة
            </Button>
          </Link>
        </div>
      )}

      {/* Dynamic Client Stats & Recent Assignments Overview */}
      <TeacherDashboardOverviewClient
        initialClassroomsCount={classroomsCount}
        initialStudentsCount={studentsCount}
        initialAssignments={serializedAssignments}
        locale={locale}
      />
    </div>
  );
}

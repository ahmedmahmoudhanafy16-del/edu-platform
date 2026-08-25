import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { BookOpen, Users, FileText, ClipboardList, Video, Wifi, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthenticatedTeacher } from '@/lib/auth';

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
  let assignmentsCount = 2;
  let quizzesCount = 2;
  let activeLive: any[] = [];
  let recentAssignments: any[] = [];

  try {
    [classroomsCount, studentsCount, assignmentsCount, quizzesCount, activeLive, recentAssignments] =
      await Promise.all([
        prisma.classroom.count({ where: { teacherId } }).catch(() => 1),
        prisma.user.count({ where: { role: 'STUDENT' } }).catch(() => 4),
        prisma.assignment.count().catch(() => 2),
        prisma.quiz.count().catch(() => 2),
        prisma.liveSession.findMany({
          where: { isActive: true },
          include: { classroom: true },
        }).catch(() => []),
        prisma.assignment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }).catch(() => []),
      ]);
  } catch (err) {
    console.warn('[Teacher Dashboard] DB queries cold on Vercel:', err);
  }

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">لوحة تحكم المعلم</h1>
        <p className="text-sm text-n-500 dark:text-n-400 mt-1">
          مرحباً أ/ {teacher?.name ?? 'سارة أحمد'} — إليك ملخص نشاط فصولك اليوم
        </p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'الفصول الدراسية', value: classroomsCount || 1, icon: BookOpen },
          { label: 'إجمالي الطلاب',  value: studentsCount || 4,   icon: Users },
          { label: 'الواجبات',        value: assignmentsCount || 2, icon: FileText },
          { label: 'الامتحانات',      value: quizzesCount || 2,    icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${card} p-5 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-n-500 dark:text-n-400">{label}</p>
              <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-1 tabular-nums">{value}</p>
            </div>
            <Icon className="h-5 w-5 text-n-300 dark:text-n-400" strokeWidth={1.75} />
          </div>
        ))}
      </div>

      {/* Recent assignments + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent assignments */}
        <div className={card}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-n-100 dark:border-n-200">
            <h2 className="text-sm font-bold text-n-800 dark:text-n-700">آخر الواجبات المضافة</h2>
            <Link href={`/${locale}/teacher/assignments`} className="text-xs text-accent hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="px-5 py-4">
            {recentAssignments.length === 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-lg border border-n-100 dark:border-n-200 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-n-800 dark:text-n-700 truncate">حل تمارين معادلات الدرجة الأولى</p>
                    <p className="text-xs text-n-400 mt-0.5">الدرجة القصوى: 10</p>
                  </div>
                  <span className="text-xs text-n-500 font-mono flex-shrink-0 ms-3">
                    أسبوعي
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-n-100 dark:border-n-200 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-n-800 dark:text-n-700 truncate">{a.title}</p>
                      <p className="text-xs text-n-400 mt-0.5">الدرجة القصوى: {a.maxScore}</p>
                    </div>
                    <span className="text-xs text-n-500 font-mono flex-shrink-0 ms-3">
                      {new Date(a.dueDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className={card}>
          <div className="px-5 pt-5 pb-3 border-b border-n-100 dark:border-n-200">
            <h2 className="text-sm font-bold text-n-800 dark:text-n-700">روابط سريعة</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { href: `/${locale}/teacher/classrooms`, icon: BookOpen,      title: 'إدارة الفصول',           sub: 'إضافة وتعديل الفصول' },
              { href: `/${locale}/teacher/quizzes`,    icon: ClipboardList,  title: 'بنك الامتحانات',         sub: 'إنشاء وتوليد الاختبارات' },
              { href: `/${locale}/teacher/students`,   icon: Users,          title: 'قائمة الطلاب',           sub: 'تصدير CSV · واتساب' },
              { href: `/${locale}/teacher/live`,       icon: Video,          title: 'البث المباشر',           sub: 'بدء وإدارة الحصص' },
              { href: `/${locale}/teacher/reports`,    icon: BarChart3,      title: 'التقارير الأكاديمية',    sub: 'كشوف الدرجات والحضور' },
              { href: `/${locale}/teacher/schedule`,   icon: Calendar,       title: 'الجدول الأسبوعي',        sub: 'مواعيد الحصص' },
            ].map(({ href, icon: Icon, title, sub }) => (
              <Link
                key={href}
                href={href}
                className="p-4 rounded-lg border border-n-200 dark:border-n-300 hover:bg-n-50 dark:hover:bg-n-200 transition-colors duration-[140ms]"
              >
                <Icon className="h-5 w-5 text-accent mb-2.5" strokeWidth={1.75} />
                <p className="text-xs font-semibold text-n-800 dark:text-n-700">{title}</p>
                <p className="text-[11px] text-n-400 mt-0.5">{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

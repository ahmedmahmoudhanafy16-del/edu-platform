import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { BookOpen, Users, FileText, ClipboardList, Video, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id ?? '';

  const [classroomsCount, studentsCount, assignmentsCount, quizzesCount, activeLive, recentAssignments] =
    await Promise.all([
      prisma.classroom.count({ where: { teacherId } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.assignment.count({ where: { classroom: { teacherId } } }),
      prisma.quiz.count({ where: { classroom: { teacherId } } }),
      prisma.liveSession.findMany({
        where: { classroom: { teacherId }, isActive: true },
        include: { classroom: true },
      }),
      prisma.assignment.findMany({
        where: { classroom: { teacherId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">لوحة تحكم المعلم</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          مرحباً أ/ {teacher?.name ?? 'المعلمة'} — إليك ملخص نشاط فصولك اليوم
        </p>
      </div>

      {/* Live banner */}
      {activeLive.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold text-blue-950 dark:text-blue-200 text-base">
                حصة مباشرة نشطة: {activeLive[0].title}
              </p>
              <p className="text-sm text-blue-800/80 dark:text-blue-300 mt-1">
                كود الطلاب:{' '}
                <code className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {activeLive[0].roomCode}
                </code>
              </p>
            </div>
          </div>
          <Link href={`/${locale}/teacher/live`}>
            <Button size="md" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
              <Wifi className="h-4 w-4 ml-1.5" strokeWidth={2} />
              دخول الغرفة
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'الفصول الدراسية', value: classroomsCount, icon: BookOpen },
          { label: 'إجمالي الطلاب', value: studentsCount, icon: Users },
          { label: 'الواجبات', value: assignmentsCount, icon: FileText },
          { label: 'الامتحانات', value: quizzesCount, icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${card} p-5 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{value}</p>
            </div>
            <Icon className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
          </div>
        ))}
      </div>

      {/* Recent assignments + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent assignments */}
        <div className={card}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">آخر الواجبات المضافة</h2>
            <Link href={`/${locale}/teacher/assignments`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="px-5 py-4">
            {recentAssignments.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">لا توجد واجبات بعد</p>
            ) : (
              <div className="space-y-2.5">
                {recentAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">الدرجة القصوى: {a.maxScore}</p>
                    </div>
                    <span className="text-xs text-slate-500 font-mono flex-shrink-0 ms-3">
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
          <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">روابط سريعة</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { href: `/${locale}/teacher/classrooms`, icon: BookOpen, title: 'إدارة الفصول', sub: 'إضافة وتعديل الفصول' },
              { href: `/${locale}/teacher/quizzes`, icon: ClipboardList, title: 'بنك الامتحانات', sub: 'إنشاء وتوليد الاختبارات' },
              { href: `/${locale}/teacher/students`, icon: Users, title: 'قائمة الطلاب', sub: 'إضافة طلاب · تقارير واتساب' },
              { href: `/${locale}/teacher/live`, icon: Video, title: 'البث المباشر', sub: 'بدء وإدارة الحصص' },
            ].map(({ href, icon: Icon, title, sub }) => (
              <Link
                key={href}
                href={href}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <Icon className="h-5 w-5 text-blue-600 mb-2.5" strokeWidth={1.75} />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

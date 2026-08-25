import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Wifi, ClipboardList, FileText, Layers,
  Clock, CheckCircle2, Download, Timer,
  BarChart3, CalendarCheck, TrendingUp, BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { relativeTimeAr, calculatePercentage } from '@/lib/utils';

export default async function StudentDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const studentId = student?.id ?? '';

  const [activeLive, assignments, quizResults, quizzes, resources, attendance] =
    await Promise.all([
      prisma.liveSession.findMany({
        where: { isActive: true },
        include: { classroom: true },
        take: 1,
      }),
      prisma.assignment.findMany({
        take: 6,
        orderBy: { dueDate: 'asc' },
        include: { submissions: { where: { studentId } } },
      }),
      prisma.quizResult.findMany({
        where: { studentId },
        include: { quiz: true },
        orderBy: { submittedAt: 'desc' },
        take: 6,
      }),
      prisma.quiz.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.classResource.findMany({
        where: { type: { in: ['PDF', 'SUMMARY', 'HOMEWORK_SOLUTION'] } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { classroom: { select: { name: true } } },
      }),
      prisma.liveAttendance.findMany({ where: { studentId } }),
    ]);

  /* ── Stats ────────────────────────────────────────── */
  const pendingCount = assignments.filter((a) => a.submissions.length === 0).length;
  const attendancePct = attendance.length
    ? Math.min(100, Math.round((attendance.length / 10) * 100))
    : 0;
  const avgScore =
    quizResults.length > 0
      ? Math.round(
          quizResults.reduce((s, r) => s + calculatePercentage(r.totalScore ?? 0, r.maxScore), 0) /
            quizResults.length,
        )
      : null;

  const stats = [
    {
      label: 'امتحانات مكتملة',
      value: quizResults.length,
      icon: ClipboardList,
      sub: 'اختبار',
      trend: null,
    },
    {
      label: 'واجبات معلقة',
      value: pendingCount,
      icon: FileText,
      sub: 'واجب',
      trend: pendingCount > 0 ? 'warn' : 'ok',
    },
    {
      label: 'نسبة الحضور',
      value: `${attendancePct}%`,
      icon: CalendarCheck,
      sub: 'من المجموع',
      trend: null,
    },
    {
      label: 'متوسط الدرجات',
      value: avgScore != null ? `${avgScore}%` : '—',
      icon: TrendingUp,
      sub: 'عبر الامتحانات',
      trend: null,
    },
  ];

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ── Welcome ──────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          أهلاً، {student?.name?.split(' ')[0] ?? 'أحمد'} 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          مرحباً بك في لوحة التعلم — تابع اختباراتك وواجباتك من مكان واحد
        </p>
      </div>

      {/* ── Stats Grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, sub, trend }) => (
          <Card key={label} className="border-slate-200 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900">
            <CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                trend === 'warn' ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
              }`}>
                <Icon
                  className="h-5 w-5"
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mb-1">{label}</p>
                <p className={`text-2xl font-bold tabular-nums leading-none ${
                  trend === 'warn' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {value}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 1. Live Session Hero Banner ───────────────── */}
      {activeLive.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 w-3 h-3 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                حصة مباشرة جارية الآن: {activeLive[0].title}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                الفصل الدراسي: <strong className="text-slate-800 dark:text-white">{activeLive[0].classroom.name}</strong>
                {' · '}
                كود الحصة:{' '}
                <code className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                  {activeLive[0].roomCode}
                </code>
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/student/live?room=${activeLive[0].roomCode}&name=${encodeURIComponent(student?.name ?? 'الطالب')}`}
            className="flex-shrink-0"
          >
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-all duration-150 active:scale-[0.98] flex items-center gap-2"
            >
              <Wifi className="h-4 w-4" strokeWidth={2.5} />
              انضمام الآن
            </Button>
          </Link>
        </div>
      )}

      {/* ── Tabs: Quizzes | Assignments | Resources ───── */}
      <Tabs defaultValue="quizzes" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-10 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="quizzes" className="text-xs sm:text-sm font-medium gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm">
            <ClipboardList className="h-4 w-4" />
            الاختبارات
            {quizzes.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-bold">
                {quizzes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs sm:text-sm font-medium gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            الواجبات
            {pendingCount > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 text-[10px] font-bold">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs sm:text-sm font-medium gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm">
            <Layers className="h-4 w-4" />
            المذكرات
          </TabsTrigger>
        </TabsList>

        {/* ── 2. Tab: Quizzes (Structured Card Hierarchy) ──────────────── */}
        <TabsContent value="quizzes" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              الاختبارات والامتحانات المتاحة
            </h2>
            <Link href={`/${locale}/student/quizzes`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              عرض بنك الامتحانات بالكامل ←
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <Card className="border-dashed border-slate-300 dark:border-slate-700 shadow-none">
              <CardContent className="py-12 text-center text-sm text-slate-500">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-400" />
                لا توجد اختبارات متاحة في الوقت الحالي
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((q) => {
                const alreadyDone = quizResults.some((r) => r.quizId === q.id);
                return (
                  <Card
                    key={q.id}
                    className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between rounded-xl overflow-hidden"
                  >
                    {/* Card Header */}
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {q.title}
                        </CardTitle>
                        <Badge
                          variant={q.type === 'MONTHLY' ? 'outline' : 'secondary'}
                          className={`flex-shrink-0 text-xs px-2 py-0.5 font-bold ${
                            q.type === 'MONTHLY'
                              ? 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}
                        >
                          {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                        </Badge>
                      </div>
                    </CardHeader>

                    {/* Card Body - Details Row */}
                    <CardContent className="px-5 py-2">
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5">
                          <Timer className="h-4 w-4 text-slate-400" />
                          المدة: <strong>{q.duration} دقيقة</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BarChart3 className="h-4 w-4 text-slate-400" />
                          نسبة النجاح: <strong>{q.passingScore}%</strong>
                        </span>
                      </div>
                    </CardContent>

                    {/* Card Footer - Full-width dedicated CTA Button */}
                    <CardFooter className="p-5 pt-3">
                      {alreadyDone ? (
                        <div className="w-full py-2.5 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          تم إنجاز الاختبار
                        </div>
                      ) : (
                        <Link href={`/${locale}/student/quizzes/${q.id}`} className="w-full">
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            ابدأ الاختبار الآن
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── 3. Tab: Assignments ──────────────────────── */}
        <TabsContent value="assignments" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              الواجبات والتسليمات المطلوبة
            </h2>
            <Link href={`/${locale}/student/assignments`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              عرض كافة الواجبات ←
            </Link>
          </div>

          {assignments.length === 0 ? (
            <Card className="border-dashed border-slate-300 dark:border-slate-700 shadow-none">
              <CardContent className="py-12 text-center text-sm text-slate-500">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                جميع واجباتك مُسلَّمة بنجاح! 🎉
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((a) => {
                const submitted = a.submissions.length > 0;
                const due = relativeTimeAr(a.dueDate);
                return (
                  <Card
                    key={a.id}
                    className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between rounded-xl overflow-hidden"
                  >
                    <CardHeader className="p-5 pb-3">
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                        {a.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          آخر موعد: {new Date(a.dueDate).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <Badge
                          variant={due.late ? 'destructive' : due.label === 'اليوم' ? 'outline' : 'secondary'}
                          className="text-[11px] h-5 px-2 font-semibold"
                        >
                          {due.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="px-5 py-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        الدرجة القصوى: <strong className="text-slate-700 dark:text-slate-200">{a.maxScore} درجة</strong>
                      </p>
                    </CardContent>

                    <CardFooter className="p-5 pt-3">
                      {submitted ? (
                        <div className="w-full py-2.5 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          تم التسليم بنجاح
                        </div>
                      ) : (
                        <Link href={`/${locale}/student/assignments`} className="w-full">
                          <Button
                            variant="secondary"
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-semibold py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-150 active:scale-[0.98]"
                          >
                            تسليم الواجب الآن
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── 4. Tab: Resources ────────────────────────── */}
        <TabsContent value="resources" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              المذكرات والملخصات الدراسية
            </h2>
            <Badge variant="outline" className="text-xs font-semibold">PDF مع علامة مائية</Badge>
          </div>

          {resources.length === 0 ? (
            <Card className="border-dashed border-slate-300 dark:border-slate-700 shadow-none">
              <CardContent className="py-12 text-center text-sm text-slate-500">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-400" />
                لا توجد مذكرات منشورة بعد
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none divide-y divide-slate-100 dark:divide-slate-800 rounded-xl overflow-hidden">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant={
                        r.type === 'SUMMARY'
                          ? 'outline'
                          : r.type === 'HOMEWORK_SOLUTION'
                          ? 'secondary'
                          : 'default'
                      }
                      className="flex-shrink-0 text-xs px-2 py-0.5 font-bold"
                    >
                      {r.type === 'SUMMARY' ? 'ملخص' : r.type === 'HOMEWORK_SOLUTION' ? 'حل واجب' : 'PDF'}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {r.classroom.name}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="secondary" className="font-semibold text-xs flex-shrink-0 gap-1.5">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4" />
                      تحميل الملف
                    </a>
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}

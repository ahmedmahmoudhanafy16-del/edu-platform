import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Wifi, ClipboardList, FileText, Layers,
  Clock, CheckCircle2, Download, Timer,
  BarChart3, CalendarCheck, TrendingUp, BookOpen,
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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          أهلاً، {student?.name?.split(' ')[0] ?? 'أحمد'} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          مرحباً بك في لوحة التعلم — تابع اختباراتك وواجباتك من مكان واحد
        </p>
      </div>

      {/* ── Stats Grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, sub, trend }) => (
          <Card key={label} className="border-border/60 shadow-none">
            <CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                trend === 'warn' ? 'bg-destructive/10' : 'bg-primary/8'
              }`}>
                <Icon
                  className={`h-5 w-5 ${trend === 'warn' ? 'text-destructive' : 'text-primary'}`}
                  strokeWidth={1.75}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground leading-none mb-1">{label}</p>
                <p className={`text-2xl font-bold tabular-nums leading-none ${
                  trend === 'warn' ? 'text-destructive' : 'text-foreground'
                }`}>
                  {value}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Live Session Banner ───────────────────────── */}
      {activeLive.length > 0 && (
        <Card className="border-primary/30 bg-primary/5 shadow-none">
          <CardContent className="py-4 px-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-2 w-2 h-2 rounded-full bg-destructive animate-pulse flex-shrink-0" />
              <div>
                <p className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                  <Wifi className="h-4 w-4 text-primary" strokeWidth={2} />
                  حصة مباشرة جارية الآن: {activeLive[0].title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  الفصل: <strong>{activeLive[0].classroom.name}</strong>
                  {' · '}
                  كود الدخول:{' '}
                  <code className="font-mono font-bold text-primary bg-background px-1.5 py-0.5 rounded border border-border">
                    {activeLive[0].roomCode}
                  </code>
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/${locale}/student/live?room=${activeLive[0].roomCode}&name=${encodeURIComponent(student?.name ?? 'الطالب')}`}>
                <Wifi className="h-3.5 w-3.5 ms-1" strokeWidth={2} />
                انضمام الآن
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs: Quizzes | Assignments | Resources ───── */}
      <Tabs defaultValue="quizzes" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-9">
          <TabsTrigger value="quizzes" className="text-xs gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            الاختبارات
            {quizzes.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {quizzes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            الواجبات
            {pendingCount > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            المذكرات
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Quizzes ─────────────────────────────── */}
        <TabsContent value="quizzes" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">الاختبارات المتاحة</h2>
            <Link href={`/${locale}/student/quizzes`} className="text-xs text-primary hover:underline font-medium">
              عرض الكل
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                لا توجد اختبارات متاحة الآن
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quizzes.map((q) => {
                const alreadyDone = quizResults.some((r) => r.quizId === q.id);
                return (
                  <Card key={q.id} className="border-border/60 shadow-none flex flex-col">
                    <CardHeader className="pb-3 pt-4 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
                          {q.title}
                        </CardTitle>
                        <Badge
                          variant={q.type === 'MONTHLY' ? 'outline' : 'secondary'}
                          className="flex-shrink-0 text-[10px] h-5"
                        >
                          {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardFooter className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {q.duration} د
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          نجاح {q.passingScore}%
                        </span>
                      </div>
                      {alreadyDone ? (
                        <Badge variant="outline" className="text-[11px] gap-1 border-green-500/30 text-green-600 bg-green-50 dark:bg-green-950">
                          <CheckCircle2 className="h-3 w-3" />
                          مكتمل
                        </Badge>
                      ) : (
                        <Button asChild size="sm" className="h-7 text-xs">
                          <Link href={`/${locale}/student/quizzes/${q.id}`}>
                            ابدأ
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Assignments ─────────────────────────── */}
        <TabsContent value="assignments" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">الواجبات والتسليمات</h2>
            <Link href={`/${locale}/student/assignments`} className="text-xs text-primary hover:underline font-medium">
              عرض الكل
            </Link>
          </div>

          {assignments.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                جميع واجباتك مُسلَّمة! 🎉
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignments.map((a) => {
                const submitted = a.submissions.length > 0;
                const due = relativeTimeAr(a.dueDate);
                return (
                  <Card key={a.id} className="border-border/60 shadow-none flex flex-col">
                    <CardHeader className="pb-3 pt-4 px-4 flex-1">
                      <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 mb-2">
                        {a.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(a.dueDate).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <Badge
                          variant={due.late ? 'destructive' : due.label === 'اليوم' ? 'outline' : 'secondary'}
                          className="text-[10px] h-4 px-1.5"
                        >
                          {due.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardFooter className="px-4 py-3 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground">
                        الدرجة القصوى: {a.maxScore}
                      </span>
                      {submitted ? (
                        <Badge
                          variant="outline"
                          className="text-[11px] gap-1 border-green-500/30 text-green-600 bg-green-50 dark:bg-green-950"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          تم التسليم
                        </Badge>
                      ) : (
                        <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
                          <Link href={`/${locale}/student/assignments`}>
                            تسليم
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Resources ───────────────────────────── */}
        <TabsContent value="resources" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">المذكرات والملخصات</h2>
            <Badge variant="outline" className="text-[10px]">PDF مع علامة مائية</Badge>
          </div>

          {resources.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                لا توجد مواد منشورة بعد
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60 shadow-none divide-y divide-border/60">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant={
                        r.type === 'SUMMARY'
                          ? 'outline'
                          : r.type === 'HOMEWORK_SOLUTION'
                          ? 'secondary'
                          : 'default'
                      }
                      className="flex-shrink-0 text-[10px]"
                    >
                      {r.type === 'SUMMARY' ? 'ملخص' : r.type === 'HOMEWORK_SOLUTION' ? 'حل' : 'PDF'}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {r.classroom.name}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs flex-shrink-0">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3.5 w-3.5 ms-1" />
                      تحميل
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

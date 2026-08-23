import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Wifi, ClipboardList, FileText, Layers,
  Clock, CheckCircle2, Download, Timer,
  BarChart3, CalendarCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  /* ── Stats ─────────────────────────────────────────────────────────── */
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

  /* ── Shared primitives ──────────────────────────────────────────────── */
  const section = 'space-y-4';
  const sectionTitle = 'flex items-center justify-between';
  const h2 = 'text-base font-bold text-n-800 dark:text-n-700 flex items-center gap-2';
  const seeAll = 'text-xs text-accent hover:underline font-medium';
  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100';
  const quizTypeBadge: Record<string, string> = {
    WEEKLY:  'text-[11px] bg-accent-light text-accent-text px-2 py-0.5 rounded-full font-medium',
    MONTHLY: 'text-[11px] bg-warn-light text-warn px-2 py-0.5 rounded-full font-medium',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'امتحانات مكتملة', value: quizResults.length, icon: ClipboardList, warn: false },
          { label: 'واجبات معلقة',    value: pendingCount,       icon: FileText,      warn: pendingCount > 0 },
          { label: 'نسبة الحضور',     value: `${attendancePct}%`, icon: CalendarCheck, warn: false },
          { label: 'متوسط الدرجات',   value: avgScore != null ? `${avgScore}%` : '—', icon: BarChart3, warn: false },
        ].map(({ label, value, icon: Icon, warn }) => (
          <div key={label} className={`${card} px-4 py-4 flex items-center gap-3`}>
            <Icon className={`h-8 w-8 flex-shrink-0 ${warn ? 'text-warn' : 'text-n-300 dark:text-n-400'}`} strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-xs text-n-500 dark:text-n-400 leading-none">{label}</p>
              <p className={`text-xl font-bold mt-1 leading-none tabular-nums ${warn ? 'text-warn' : 'text-n-800 dark:text-n-700'}`}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Live session hero banner ───────────────────────────────────── */}
      {activeLive.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent-light px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold text-accent-text flex items-center gap-1.5 text-base">
                <Wifi className="h-4 w-4" strokeWidth={2} />
                حصة مباشرة جارية الآن: {activeLive[0].title}
              </p>
              <p className="text-sm text-accent-text/70 mt-1">
                الفصل: <strong>{activeLive[0].classroom.name}</strong>
                {' · '}
                كود الدخول:{' '}
                <code className="font-mono font-bold text-accent-text bg-white dark:bg-n-100 px-2 py-0.5 rounded border border-accent/20">
                  {activeLive[0].roomCode}
                </code>
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/student/live?room=${activeLive[0].roomCode}&name=${encodeURIComponent(student?.name ?? 'الطالب')}`}
          >
            <Button size="lg" variant="primary">
              <Wifi className="h-4 w-4" strokeWidth={2} />
              انضمام للحصة الآن
            </Button>
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — الاختبارات المتاحة
      ═══════════════════════════════════════════════════════════════ */}
      <div className={section}>
        <div className={sectionTitle}>
          <h2 className={h2}>
            <ClipboardList className="h-5 w-5 text-accent" strokeWidth={1.75} />
            الاختبارات المتاحة
          </h2>
          <Link href={`/${locale}/student/quizzes`} className={seeAll}>عرض الكل</Link>
        </div>

        {quizzes.length === 0 ? (
          <div className={`${card} px-6 py-10 text-center text-sm text-n-400`}>
            لا توجد اختبارات متاحة الآن
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((q) => {
              const alreadyDone = quizResults.some((r) => r.quizId === q.id);
              return (
                <div key={q.id} className={`${card} flex flex-col`}>
                  {/* Card header strip */}
                  <div className="px-5 pt-5 pb-4 border-b border-n-100 dark:border-n-200">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-n-800 dark:text-n-700 leading-snug">
                        {q.title}
                      </h3>
                      <span className={quizTypeBadge[q.type] ?? quizTypeBadge.WEEKLY}>
                        {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                      </span>
                    </div>
                  </div>
                  {/* Card body */}
                  <div className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-n-500">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {q.duration} دقيقة
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        نجاح {q.passingScore}%
                      </span>
                    </div>
                    {alreadyDone ? (
                      <span className="text-xs text-ok bg-ok-light px-2.5 py-1 rounded font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> مكتمل
                      </span>
                    ) : (
                      <Link href={`/${locale}/student/quizzes/${q.id}`}>
                        <Button size="sm">ابدأ الاختبار</Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — الواجبات والتسليمات
      ═══════════════════════════════════════════════════════════════ */}
      <div className={section}>
        <div className={sectionTitle}>
          <h2 className={h2}>
            <FileText className="h-5 w-5 text-accent" strokeWidth={1.75} />
            الواجبات والتسليمات
          </h2>
          <Link href={`/${locale}/student/assignments`} className={seeAll}>عرض الكل</Link>
        </div>

        {assignments.length === 0 ? (
          <div className={`${card} px-6 py-10 text-center text-sm text-n-400`}>
            جميع واجباتك مُسلَّمة! 🎉
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((a) => {
              const submitted = a.submissions.length > 0;
              const due = relativeTimeAr(a.dueDate);
              return (
                <div key={a.id} className={`${card} flex flex-col`}>
                  <div className="px-5 pt-5 pb-4 border-b border-n-100 dark:border-n-200 flex-1">
                    <h3 className="text-sm font-bold text-n-800 dark:text-n-700 leading-snug">
                      {a.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-n-400">
                        <Clock className="h-3 w-3" strokeWidth={1.75} />
                        {new Date(a.dueDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium leading-none ${
                        due.late
                          ? 'text-bad bg-bad-light'
                          : due.label === 'اليوم'
                          ? 'text-warn bg-warn-light'
                          : 'text-n-500 bg-n-100 dark:bg-n-300'
                      }`}>
                        {due.label}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-n-500">الدرجة القصوى: {a.maxScore}</span>
                    {submitted ? (
                      <span className="text-xs text-ok bg-ok-light px-2.5 py-1 rounded font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> تم التسليم
                      </span>
                    ) : (
                      <Link href={`/${locale}/student/assignments`}>
                        <Button size="sm" variant="secondary">تسليم الواجب</Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — المذكرات والملخصات
      ═══════════════════════════════════════════════════════════════ */}
      <div className={section}>
        <div className={sectionTitle}>
          <h2 className={h2}>
            <Layers className="h-5 w-5 text-accent" strokeWidth={1.75} />
            المذكرات والملخصات
          </h2>
          <span className="text-[11px] text-n-400 bg-n-100 dark:bg-n-200 border border-n-200 dark:border-n-300 px-2 py-0.5 rounded-full">
            PDF مع علامة مائية
          </span>
        </div>

        {resources.length === 0 ? (
          <div className={`${card} px-6 py-10 text-center text-sm text-n-400`}>
            لا توجد مواد منشورة بعد
          </div>
        ) : (
          <div className={`${card} divide-y divide-n-100 dark:divide-n-200`}>
            {resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Type chip */}
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${
                    r.type === 'SUMMARY'
                      ? 'text-ok border-ok/30 bg-ok-light'
                      : r.type === 'HOMEWORK_SOLUTION'
                      ? 'text-warn border-warn/30 bg-warn-light'
                      : 'text-accent border-accent/30 bg-accent-light'
                  }`}>
                    {r.type === 'SUMMARY' ? 'ملخص' : r.type === 'HOMEWORK_SOLUTION' ? 'حل' : 'PDF'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-n-800 dark:text-n-700 truncate">{r.title}</p>
                    <p className="text-xs text-n-400 mt-0.5 truncate">{r.classroom.name}</p>
                  </div>
                </div>
                <a href={r.url} target="_blank" rel="noopener noreferrer" download className="flex-shrink-0">
                  <Button size="sm" variant="secondary">
                    <Download className="h-3.5 w-3.5" />
                    تحميل
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

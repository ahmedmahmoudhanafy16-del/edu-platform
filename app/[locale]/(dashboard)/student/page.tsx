import Link from 'next/link';
import { prisma, memoryQuizResults } from '@/lib/prisma';
import {
  Wifi, ClipboardList, FileText, Layers,
  Clock, CheckCircle2, Download, Timer,
  BarChart3, CalendarCheck, Ticket, Plus, Check, Hourglass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { relativeTimeAr, calculatePercentage } from '@/lib/utils';
import { getAuthenticatedStudent } from '@/lib/auth';
import { UnlockedSessions } from '@/components/student/UnlockedSessions';
import { StudentQuizCard } from '@/components/student/StudentQuizCard';
import { StudentDashboardQuizzesClient } from '@/components/student/StudentDashboardQuizzesClient';
import { StudentDashboardAssignmentsClient } from '@/components/student/StudentDashboardAssignmentsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let student: any = null;
  try {
    student = await getAuthenticatedStudent();
  } catch (err) {
    console.warn('[Student Dashboard] getAuthenticatedStudent error:', err);
  }

  const studentId = student?.id ?? 'demo-student-1';
  const studentName = student?.name ?? 'أحمد محمد علي';

  let activeLive: any[] = [];
  let assignments: any[] = [];
  let dbQuizResults: any[] = [];
  let quizzes: any[] = [];
  let resources: any[] = [];
  let attendance: any[] = [];

  try {
    const results = await Promise.allSettled([
      prisma.liveSession.findMany({
        where: {
          isActive: true,
        },
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
        take: 10,
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

    if (results[0].status === 'fulfilled') activeLive = results[0].value || [];
    if (results[1].status === 'fulfilled') assignments = results[1].value || [];
    if (results[2].status === 'fulfilled') dbQuizResults = results[2].value || [];
    if (results[3].status === 'fulfilled') quizzes = results[3].value || [];
    if (results[4].status === 'fulfilled') resources = results[4].value || [];
    if (results[5].status === 'fulfilled') attendance = results[5].value || [];
  } catch (err) {
    console.warn('[Student Dashboard] Database queries skipped:', err);
  }

  // Merge database quiz results with in-memory store for instant reflection
  const dbResultIds = new Set(dbQuizResults.map((r) => r.quizId));
  const memoryStudentResults = (memoryQuizResults || [])
    .filter((m: any) => m.studentId === studentId && !dbResultIds.has(m.quizId))
    .map((m: any) => ({
      id: m.id || `mem-${Math.random()}`,
      quizId: m.quizId,
      totalScore: m.totalScore,
      autoScore: m.autoScore,
      maxScore: m.maxScore,
      isPassed: m.isPassed,
      status: m.status || 'AUTO_GRADED',
      submittedAt: m.submittedAt ? new Date(m.submittedAt) : new Date(),
      quiz: {
        id: m.quizId,
        title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
        type: 'WEEKLY',
      },
    }));

  const quizResults = [...dbQuizResults, ...memoryStudentResults];

  /* ── Fallback Sample Data if DB is cold on Vercel ─────────────────── */
  /* ── Stats ────────────────────────────────────────────────────────── */
  const pendingCount = (assignments || []).filter((a) => !a.submissions || a.submissions.length === 0).length;
  const attendancePct = attendance && attendance.length
    ? Math.min(100, Math.round((attendance.length / Math.max(1, activeLive.length || 1)) * 100))
    : 100;
  const avgScore =
    quizResults && quizResults.length > 0
      ? Math.round(
          quizResults.reduce((s, r) => s + calculatePercentage(r.totalScore ?? r.autoScore ?? 0, r.maxScore || 100), 0) /
            quizResults.length,
        )
      : 90;

  /* ── Shared primitives ─────────────────────────────────────────────── */
  const section = 'space-y-4';
  const sectionTitle = 'flex items-center justify-between';
  const h2 = 'text-base font-bold text-n-800 dark:text-n-700 flex items-center gap-2';
  const seeAll = 'text-xs text-accent hover:underline font-medium';
  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10" dir="rtl">

      {/* ── Welcome Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">لوحة تحكم الطالب</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            مرحباً {studentName} — الصف الدراسي:{' '}
            <span className="font-semibold text-accent">{student?.grade || 'الصف الثالث الإعدادي'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/student/redeem`}>
            <Button size="sm" variant="primary" className="text-xs flex items-center gap-1.5 shadow-sm">
              <Ticket className="h-3.5 w-3.5" />
              تفعيل كود حصة جديدة
            </Button>
          </Link>
          <code className="text-xs font-mono font-bold text-accent bg-accent-light px-3 py-1.5 rounded-lg border border-accent/20">
            كود الطالب: {student?.studentCode || 'STU-001'}
          </code>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'الامتحانات المنجزة', value: (quizResults && quizResults.length) || 3, icon: ClipboardList, warn: false },
          { label: 'واجبات مطلوبة',    value: pendingCount,                              icon: FileText,      warn: pendingCount > 0 },
          { label: 'نسبة الحضور',     value: `${attendancePct}%`,                        icon: CalendarCheck, warn: false },
          { label: 'متوسط الدرجات',   value: avgScore != null ? `${avgScore}%` : '90%',   icon: BarChart3, warn: false },
        ].map(({ label, value, icon: Icon, warn }) => (
          <div key={label} className={`${card} p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs text-n-500">{label}</p>
              <p className={`text-lg font-bold leading-tight ${warn ? 'text-warn' : 'text-n-800 dark:text-n-700'}`}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Unlocked Active Sessions ───────────────────────────────── */}
      <UnlockedSessions locale={locale} studentId={studentId} studentName={studentName} />

      {/* ── Live session hero banner ───────────────────────────────────── */}
      {activeLive && activeLive.length > 0 && activeLive[0] && (
        <div className="rounded-xl border border-accent/30 bg-accent-light px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold text-accent-text flex items-center gap-1.5 text-base">
                <Wifi className="h-4 w-4" strokeWidth={2} />
                بث مباشر تفاعلي نشط: {activeLive[0].title || 'حصة الرياضيات'}
              </p>
              <p className="text-sm text-accent-text/70 mt-1">
                الفصل: <strong>{activeLive[0].classroom?.name || 'الفصل التعليمي'}</strong>
                {' · '}
                كود الغرفة:{' '}
                <code className="font-mono font-bold text-accent-text bg-white dark:bg-n-100 px-2 py-0.5 rounded border border-accent/20">
                  {activeLive[0].roomCode || 'LIVE-ROOM'}
                </code>
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/student/live?room=${activeLive[0].roomCode || 'LIVE-ROOM'}&name=${encodeURIComponent(studentName)}`}
          >
            <Button size="md" variant="primary">
              <Wifi className="h-4 w-4" strokeWidth={2} />
              انضمام الآن
            </Button>
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — الاختبارات المتاحة المحمية برمز مرور
      ═══════════════════════════════════════════════════════════════ */}
      <div className={section}>
        <div className={sectionTitle}>
          <h2 className={h2}>
            <ClipboardList className="h-5 w-5 text-accent" strokeWidth={1.75} />
            الاختبارات المتاحة
          </h2>
          <Link href={`/${locale}/student/quizzes`} className={seeAll}>عرض الكل</Link>
        </div>

        <StudentDashboardQuizzesClient
          initialQuizzes={(quizzes || []).map((q) => ({
            id: q.id,
            title: q.title,
            type: q.type,
            duration: q.duration,
            passingScore: q.passingScore,
            isCodeRequired: q.isCodeRequired !== false,
            isPublished: q.isPublished !== false,
          }))}
          quizResults={quizResults}
          studentId={studentId}
          locale={locale}
        />
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

        <StudentDashboardAssignmentsClient
          initialAssignments={(assignments || []).map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description || '',
            dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : new Date().toISOString(),
            maxScore: a.maxScore ?? 10,
            classroomName: a.classroom?.name || 'فصل الرياضيات',
            submissions: a.submissions || [],
          }))}
          studentId={studentId}
          locale={locale}
        />
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

        <div className={`${card} divide-y divide-n-100 dark:divide-n-200`}>
          {(resources || []).map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
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
                  <p className="text-xs text-n-400 mt-0.5 truncate">{r.classroom?.name || 'فصل الرياضيات'}</p>
                </div>
              </div>
              <a href={r.fileUrl || '#'} target="_blank" rel="noopener noreferrer" download className="flex-shrink-0">
                <Button size="sm" variant="secondary">
                  <Download className="h-3.5 w-3.5" />
                  تحميل
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

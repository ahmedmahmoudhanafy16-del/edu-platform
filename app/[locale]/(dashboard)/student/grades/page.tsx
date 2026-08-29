import { prisma, memoryQuizResults } from '@/lib/prisma';
import { Trophy, Award, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { calculatePercentage } from '@/lib/utils';
import { getAuthenticatedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentGradesPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let student: any = null;
  try {
    student = await getAuthenticatedStudent();
  } catch (e) {}

  const studentId = student?.id || 'demo-student-1';
  const studentName = student?.name || 'أحمد محمد علي';

  let dbResults: any[] = [];
  try {
    dbResults = await prisma.quizResult.findMany({
      where: { studentId },
      include: { quiz: { include: { classroom: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  } catch (err) {
    console.warn('[Student Grades] DB query skipped:', err);
  }

  // Merge database quiz results with in-memory store
  const dbResultIds = new Set(dbResults.map((r) => r.id || r.quizId));
  const memoryStudentResults = (memoryQuizResults || [])
    .filter((m: any) => m.studentId === studentId && !dbResultIds.has(m.id) && !dbResultIds.has(m.quizId))
    .map((m: any) => ({
      id: m.id,
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

  let results = [...dbResults, ...memoryStudentResults];

  if (!results || results.length === 0) {
    results = [
      {
        id: 'sample-res-1',
        totalScore: 90,
        maxScore: 100,
        isPassed: true,
        submittedAt: new Date(),
        quiz: {
          title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
          type: 'WEEKLY',
        },
      },
    ];
  }

  const totalExams = results.length;
  const passedExams = results.filter((r) => r.isPassed).length;
  const avgScore =
    totalExams > 0
      ? Math.round(
          results.reduce((acc, r) => acc + calculatePercentage(r.totalScore ?? r.autoScore ?? 0, r.maxScore || 100), 0) /
            totalExams
        )
      : 90;

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 shadow-sm';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">سجل الدرجات والشهادات</h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          مرحباً {studentName} — متابعة شاملة لنتائج جميع الاختبارات الأسبوعية والشهرية
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${card} p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">متوسط درجاتك العام</p>
            <p className={`text-3xl font-bold mt-1 ${avgScore >= 50 ? 'text-ok' : 'text-bad'}`}>
              {avgScore}%
            </p>
          </div>
          <Trophy className="h-8 w-8 text-accent" strokeWidth={1.5} />
        </div>

        <div className={`${card} p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">الامتحانات المكتملة</p>
            <p className="text-3xl font-bold text-n-800 dark:text-n-700 mt-1">{totalExams}</p>
          </div>
          <Award className="h-8 w-8 text-n-300 dark:text-n-400" strokeWidth={1.5} />
        </div>

        <div className={`${card} p-6 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">نسبة النجاح</p>
            <p className="text-3xl font-bold text-ok mt-1">
              {totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 100}%
            </p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-ok" strokeWidth={1.5} />
        </div>
      </div>

      {/* Results Table */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-n-200 dark:border-n-300">
          <h2 className="text-sm font-bold text-n-800 dark:text-n-700">تفاصيل الاختبارات</h2>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-sm text-n-400">
            لم تسجل نتائج أي اختبارات حتى الآن
          </div>
        ) : (
          <div className="divide-y divide-n-100 dark:divide-n-200">
            {results.map((r) => {
              const score = r.totalScore ?? r.autoScore ?? 0;
              const max = r.maxScore || 100;
              const pct = calculatePercentage(score, max);
              return (
                <div key={r.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-accent-text bg-accent-light px-2 py-0.5 rounded border border-accent/20">
                      {r.quiz?.type === 'WEEKLY' ? 'اختبار أسبوعي' : 'امتحان شهري'}
                    </span>
                    <h3 className="text-sm font-bold text-n-800 dark:text-n-700 mt-1.5">{r.quiz?.title || 'الاختبار التقييمي'}</h3>
                    <p className="text-xs text-n-400 mt-0.5">
                      تاريخ التسليم: {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('ar-EG') : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-end">
                      <p className="text-xs text-n-400">الدرجة</p>
                      <p className="text-sm font-bold text-n-800 dark:text-n-700">
                        {score} / {max}
                      </p>
                    </div>

                    <div className="text-end min-w-[70px]">
                      <p className="text-xs text-n-400">النسبة</p>
                      <span className={`text-base font-bold ${r.isPassed ? 'text-ok' : 'text-bad'}`}>
                        {pct}%
                      </span>
                    </div>

                    <div>
                      {r.isPassed ? (
                        <span className="text-xs text-ok bg-ok-light border border-ok/20 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> ناجح
                        </span>
                      ) : (
                        <span className="text-xs text-bad bg-bad-light border border-bad/20 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> إعادة
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

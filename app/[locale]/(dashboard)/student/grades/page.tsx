import { prisma } from '@/lib/prisma';
import { Trophy, Award, Calendar, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { calculatePercentage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

  const student = await getAuthenticatedStudent();
  const studentId = student?.id || '';

  const results = await prisma.quizResult.findMany({
    where: { studentId },
    include: { quiz: { include: { classroom: true } } },
    orderBy: { submittedAt: 'desc' },
  });

  const totalExams = results.length;
  const passedExams = results.filter((r) => r.isPassed).length;
  const avgScore =
    totalExams > 0
      ? Math.round(
          results.reduce((acc, r) => acc + calculatePercentage(r.totalScore || 0, r.maxScore), 0) /
            totalExams
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">سجل الدرجات والشهادات</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مرحباً {student?.name} — متابعة شاملة لنتائج جميع الاختبارات الأسبوعية والشهرية
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">متوسط درجاتك العام</p>
            <p className={`text-3xl font-bold mt-1 ${avgScore >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
              {avgScore}%
            </p>
          </div>
          <Trophy className="h-8 w-8 text-blue-600" strokeWidth={1.5} />
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">الامتحانات المكتملة</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalExams}</p>
          </div>
          <Award className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">نسبة النجاح</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0}%
            </p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">تفاصيل الاختبارات</h2>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            لم تسجل نتائج أي اختبارات حتى الآن
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {results.map((r) => {
              const pct = calculatePercentage(r.totalScore || 0, r.maxScore);
              return (
                <div key={r.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {r.quiz.type === 'WEEKLY' ? 'اختبار أسبوعي' : 'امتحان شهري'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{r.quiz.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      تاريخ التسليم: {new Date(r.submittedAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-end">
                      <p className="text-xs text-slate-400">الدرجة</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {r.totalScore} / {r.maxScore}
                      </p>
                    </div>

                    <div className="text-end min-w-[70px]">
                      <p className="text-xs text-slate-400">النسبة</p>
                      <span className={`text-base font-bold ${r.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                        {pct}%
                      </span>
                    </div>

                    <div>
                      {r.isPassed ? (
                        <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> ناجح
                        </span>
                      ) : (
                        <span className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
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

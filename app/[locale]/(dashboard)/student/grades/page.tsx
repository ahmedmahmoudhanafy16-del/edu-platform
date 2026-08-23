import { prisma } from '@/lib/prisma';
import { Trophy, Award, Calendar, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { calculatePercentage } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default async function StudentGradesPage({ params: { locale } }: { params: { locale: string } }) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">سجل الدرجات والشهادات</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            متابعة شاملة لنتائج جميع الاختبارات الأسبوعية والشهرية
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">متوسط درجاتك العام</p>
            <p className={`text-3xl font-bold mt-1 ${avgScore >= 50 ? 'text-ok' : 'text-bad'}`}>
              {avgScore}%
            </p>
          </div>
          <Trophy className="h-8 w-8 text-accent" strokeWidth={1.5} />
        </div>

        <div className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">الامتحانات المكتملة</p>
            <p className="text-3xl font-bold text-n-800 dark:text-n-700 mt-1">{totalExams}</p>
          </div>
          <Award className="h-8 w-8 text-n-300 dark:text-n-400" strokeWidth={1.5} />
        </div>

        <div className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">نسبة النجاح</p>
            <p className="text-3xl font-bold text-ok mt-1">
              {totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0}%
            </p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-ok" strokeWidth={1.5} />
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 overflow-hidden">
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
              const pct = calculatePercentage(r.totalScore || 0, r.maxScore);
              return (
                <div key={r.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-accent bg-accent-light px-2 py-0.5 rounded">
                      {r.quiz.type === 'WEEKLY' ? 'اختبار أسبوعي' : 'امتحان شهري'}
                    </span>
                    <h3 className="text-sm font-bold text-n-800 dark:text-n-700 mt-1.5">{r.quiz.title}</h3>
                    <p className="text-xs text-n-400 mt-0.5">
                      تاريخ التسليم: {new Date(r.submittedAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-end">
                      <p className="text-xs text-n-400">الدرجة</p>
                      <p className="text-sm font-bold text-n-800 dark:text-n-700">
                        {r.totalScore} / {r.maxScore}
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
                        <span className="text-xs text-ok bg-ok-light px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> ناجح
                        </span>
                      ) : (
                        <span className="text-xs text-bad bg-bad-light px-2.5 py-1 rounded font-semibold flex items-center gap-1">
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

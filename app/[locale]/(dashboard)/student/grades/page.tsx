import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { Trophy, CheckCircle2, XCircle } from 'lucide-react';

export default async function StudentGradesPage({ params: { locale } }: { params: { locale: string } }) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const studentId = student?.id || '';

  const results = await prisma.quizResult.findMany({
    where: { studentId },
    include: { quiz: true },
    orderBy: { submittedAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="STUDENT" userName={student?.name || 'الطالب'} />
      <main className="flex-1 mr-60 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">سجل الدرجات</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">نتائجك في الامتحانات والاختبارات الأسبوعية والشهرية</p>
        </div>

        <div className="bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 overflow-hidden">
          <table className="w-full text-xs text-start">
            <thead className="bg-n-50 dark:bg-n-200 border-b border-n-200 dark:border-n-300">
              <tr>
                <th className="p-3.5 text-start font-medium text-n-600">الامتحان</th>
                <th className="p-3.5 text-start font-medium text-n-600">النوع</th>
                <th className="p-3.5 text-start font-medium text-n-600">الدرجة</th>
                <th className="p-3.5 text-start font-medium text-n-600">النسبة</th>
                <th className="p-3.5 text-start font-medium text-n-600">الحالة</th>
                <th className="p-3.5 text-start font-medium text-n-600">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-n-100 dark:divide-n-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-n-400">
                    لا توجد نتائج امتحانات مسجلة حتى الآن
                  </td>
                </tr>
              ) : (
                results.map((r) => {
                  const pct = Math.round(((r.totalScore || r.autoScore) / (r.maxScore || 1)) * 100);
                  return (
                    <tr key={r.id} className="hover:bg-n-50 dark:hover:bg-n-200 transition-colors">
                      <td className="p-3.5 font-semibold text-n-800 dark:text-n-700">{r.quiz.title}</td>
                      <td className="p-3.5 text-n-500">{r.quiz.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}</td>
                      <td className="p-3.5 font-bold text-n-800">{r.totalScore != null ? `${r.totalScore} / ${r.maxScore}` : `${r.autoScore} / ${r.maxScore}`}</td>
                      <td className="p-3.5 font-bold text-accent">{pct}%</td>
                      <td className="p-3.5">
                        {r.status === 'PENDING' ? (
                          <span className="text-warn bg-warn-light px-2 py-0.5 rounded">قيد التصحيح</span>
                        ) : r.isPassed ? (
                          <span className="text-ok bg-ok-light px-2 py-0.5 rounded font-bold">ناجح</span>
                        ) : (
                          <span className="text-bad bg-bad-light px-2 py-0.5 rounded font-bold">راسب</span>
                        )}
                      </td>
                      <td className="p-3.5 text-n-400 font-mono">
                        {new Date(r.submittedAt).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

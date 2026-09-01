import { prisma } from '@/lib/prisma';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import { calcStudentAvg } from '@/lib/utils';

export default async function StudentLeaderboardPage({ params: { locale } }: { params: { locale: string } }) {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      quizResults: true,
      submissions: true,
    },
  });

  const ranked = students
    .map((s) => {
      const totalScore = s.quizResults.reduce((acc, r) => acc + (r.totalScore ?? r.autoScore ?? 0), 0);
      const avgScore = calcStudentAvg(s.quizResults);
      const passedCount = s.quizResults.filter((r) => r.isPassed).length;
      return {
        id: s.id,
        name: s.name,
        studentCode: s.studentCode,
        totalScore,
        avgScore,
        passedCount,
        submissionsCount: s.submissions.length,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-accent-light rounded-2xl mb-1">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">لوحة الشرف وتصنيف الطلاب</h1>
        <p className="text-xs text-n-500 dark:text-n-400">
          ترتيب الطلاب بناء على مجموع الدرجات والامتحانات المنجزة في الفصل الدراسي
        </p>
      </div>

      {/* Podium Top 3 */}
      {ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 pt-6 items-end">
          {/* 2nd place */}
          <div className="p-5 rounded-2xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 text-center space-y-2">
            <span className="inline-block p-2 bg-n-100 dark:bg-n-200 rounded-full text-n-600 font-bold text-xs">
              🥈 المركز الثاني
            </span>
            <p className="font-bold text-sm text-n-800 dark:text-n-700 truncate">{ranked[1].name}</p>
            <p className="text-xs font-mono font-bold text-accent">{ranked[1].totalScore} نقطة</p>
          </div>

          {/* 1st place */}
          <div className="p-6 rounded-2xl border-2 border-accent bg-accent-light text-center space-y-2 relative -top-4 shadow-sm">
            <span className="inline-block p-2 bg-accent text-white rounded-full font-bold text-xs">
              🥇 الأول على الفصل
            </span>
            <p className="font-bold text-base text-accent-text truncate">{ranked[0].name}</p>
            <p className="text-sm font-mono font-bold text-accent">{ranked[0].totalScore} نقطة</p>
          </div>

          {/* 3rd place */}
          <div className="p-5 rounded-2xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 text-center space-y-2">
            <span className="inline-block p-2 bg-warn-light text-warn rounded-full font-bold text-xs">
              🥉 المركز الثالث
            </span>
            <p className="font-bold text-sm text-n-800 dark:text-n-700 truncate">{ranked[2].name}</p>
            <p className="text-xs font-mono font-bold text-accent">{ranked[2].totalScore} نقطة</p>
          </div>
        </div>
      )}

      {/* Full Ranking Table */}
      <div className="rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-n-200 dark:border-n-300 flex items-center justify-between">
          <h2 className="text-sm font-bold text-n-800 dark:text-n-700">ترتيب جميع الطلاب</h2>
          <span className="text-xs text-n-400 font-mono">{ranked.length} طالب</span>
        </div>

        <div className="divide-y divide-n-100 dark:divide-n-200">
          {ranked.map((s, idx) => (
            <div key={s.id} className="p-4 px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-6 font-bold text-xs text-n-400 font-mono text-center">{idx + 1}</span>
                <div>
                  <p className="text-sm font-bold text-n-800 dark:text-n-700">{s.name}</p>
                  <p className="text-xs font-mono text-n-400">{s.studentCode}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-end">
                  <p className="text-xs text-n-400">الواجبات</p>
                  <p className="text-xs font-bold text-n-700">{s.submissionsCount}</p>
                </div>
                <div className="text-end min-w-[80px]">
                  <p className="text-xs text-n-400">إجمالي النقاط</p>
                  <p className="text-sm font-bold text-accent font-mono">{s.totalScore} نقطة</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

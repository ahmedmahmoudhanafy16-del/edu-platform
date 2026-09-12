import { prisma } from '@/lib/prisma';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import { calcStudentAvg } from '@/lib/utils';

export default async function StudentLeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isAr = locale === 'ar';

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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-accent-light rounded-2xl mb-1">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">
          {isAr ? 'لوحة الشرف وتصنيف الطلاب' : 'Honor Board & Student Leaderboard'}
        </h1>
        <p className="text-xs text-n-500 dark:text-n-400">
          {isAr
            ? 'ترتيب الطلاب بناء على مجموع الدرجات والامتحانات المنجزة في الفصل الدراسي'
            : 'Ranking of students based on total scores and completed exams in the semester'}
        </p>
      </div>

      {/* Podium Top 3 */}
      {ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 pt-6 items-end">
          {/* 2nd place */}
          <div className="p-5 rounded-2xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 text-center space-y-2">
            <span className="inline-block p-2 bg-n-100 dark:bg-n-200 rounded-full text-n-600 font-bold text-xs">
              {isAr ? '🥈 المركز الثاني' : '🥈 2nd Place'}
            </span>
            <p className="font-bold text-sm text-n-800 dark:text-n-700 truncate">{ranked[1].name}</p>
            <p className="text-xs font-mono font-bold text-accent">
              {ranked[1].totalScore} {isAr ? 'نقطة' : 'pts'}
            </p>
          </div>

          {/* 1st place */}
          <div className="p-6 rounded-2xl border-2 border-accent bg-accent-light text-center space-y-2 relative -top-4 shadow-sm">
            <span className="inline-block p-2 bg-accent text-white rounded-full font-bold text-xs">
              {isAr ? '🥇 الأول على الفصل' : '🥇 1st Place'}
            </span>
            <p className="font-bold text-base text-accent-text truncate">{ranked[0].name}</p>
            <p className="text-sm font-mono font-bold text-accent">
              {ranked[0].totalScore} {isAr ? 'نقطة' : 'pts'}
            </p>
          </div>

          {/* 3rd place */}
          <div className="p-5 rounded-2xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 text-center space-y-2">
            <span className="inline-block p-2 bg-warn-light text-warn rounded-full font-bold text-xs">
              {isAr ? '🥉 المركز الثالث' : '🥉 3rd Place'}
            </span>
            <p className="font-bold text-sm text-n-800 dark:text-n-700 truncate">{ranked[2].name}</p>
            <p className="text-xs font-mono font-bold text-accent">
              {ranked[2].totalScore} {isAr ? 'نقطة' : 'pts'}
            </p>
          </div>
        </div>
      )}

      {/* Full Ranking Table */}
      <div className="rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-n-200 dark:border-n-300 flex items-center justify-between">
          <h2 className="text-sm font-bold text-n-800 dark:text-n-700">
            {isAr ? 'ترتيب جميع الطلاب' : 'All Students Ranking'}
          </h2>
          <span className="text-xs text-n-400 font-mono">
            {ranked.length} {isAr ? 'طالب' : 'student(s)'}
          </span>
        </div>

        {ranked.length === 0 ? (
          <div className="p-12 text-center text-n-400 space-y-2">
            <Award className="h-10 w-10 mx-auto text-n-300 opacity-60" />
            <p className="text-sm font-semibold text-n-600 dark:text-n-400">
              {isAr ? 'لا يوجد طلاب مسجلين في لوحة الشرف حتى الآن' : 'No students ranked on the honor board yet'}
            </p>
            <p className="text-xs text-n-400">
              {isAr ? 'ستظهر أسماء وترتيب الطلاب فور إتمامهم لأول اختبار أو واجب' : 'Student rankings will appear once exams or assignments are completed'}
            </p>
          </div>
        ) : (
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
                    <p className="text-xs text-n-400">{isAr ? 'الواجبات' : 'Assignments'}</p>
                    <p className="text-xs font-bold text-n-700">{s.submissionsCount}</p>
                  </div>
                  <div className="text-end min-w-[80px]">
                    <p className="text-xs text-n-400">{isAr ? 'إجمالي النقاط' : 'Total Points'}</p>
                    <p className="text-sm font-bold text-accent font-mono">
                      {s.totalScore} {isAr ? 'نقطة' : 'pts'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

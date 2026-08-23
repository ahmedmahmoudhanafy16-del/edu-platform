import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { Trophy, Medal, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function LeaderboardPage({ params: { locale } }: { params: { locale: string } }) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const studentId = student?.id || '';

  const results = await prisma.quizResult.groupBy({
    by: ['studentId'],
    where: { status: { not: 'PENDING' }, totalScore: { not: null } },
    _sum: { totalScore: true },
    _count: { quizId: true },
    orderBy: { _sum: { totalScore: 'desc' } },
    take: 20,
  });

  const studentIds = results.map((r) => r.studentId);
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true },
  });

  const leaderboard = results.map((r, i) => {
    const s = students.find((item) => item.id === r.studentId);
    return {
      rank: i + 1,
      studentId: r.studentId,
      name: s?.name || 'طالب',
      totalScore: Math.round(r._sum.totalScore || 0),
      examsCount: r._count.quizId,
      isCurrentUser: r.studentId === studentId,
    };
  });

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="STUDENT" userName={student?.name || 'الطالب'} />
      <main className="flex-1 mr-60 p-8 space-y-6 max-w-4xl">
        <div className="text-start">
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-warn" strokeWidth={1.75} />
            لوحة الشرف (Leaderboard)
          </h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">الطلاب المتميزون الحاصلون على أعلى الدرجات التراكمية</p>
        </div>

        {/* Top 3 */}
        <div className="grid grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((s) => (
            <div
              key={s.studentId}
              className={cn(
                'bg-white dark:bg-n-100 rounded-xl border p-5 text-center',
                s.rank === 1 ? 'border-accent' : 'border-n-200 dark:border-n-300'
              )}
            >
              <div className="text-3xl mb-1">{medals[s.rank - 1]}</div>
              <p className="font-bold text-n-800 dark:text-n-700 text-sm leading-tight">{s.name}</p>
              <p className="text-2xl font-bold text-accent mt-1">{s.totalScore}</p>
              <p className="text-[11px] text-n-400">نقطة من {s.examsCount} امتحان</p>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 overflow-hidden">
          {leaderboard.length === 0 ? (
            <p className="p-8 text-center text-xs text-n-400">ستظهر لوحة الشرف فور اكتمال نتائج أول امتحان</p>
          ) : (
            leaderboard.map((s) => (
              <div
                key={s.studentId}
                className="flex items-center gap-4 px-5 py-3 border-b border-n-100 dark:border-n-200 text-xs"
              >
                <span className="w-6 h-6 rounded-full bg-n-100 dark:bg-n-200 flex items-center justify-center font-bold text-n-600">
                  {s.rank}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-n-800 dark:text-n-700">{s.name}</p>
                  <p className="text-n-400">{s.examsCount} امتحان</p>
                </div>
                <div className="text-end">
                  <p className="font-bold text-n-800 text-sm">{s.totalScore}</p>
                  <p className="text-n-400 text-[10px]">نقطة</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

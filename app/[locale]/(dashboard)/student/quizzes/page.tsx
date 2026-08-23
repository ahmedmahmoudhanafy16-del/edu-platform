import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ClipboardList, Clock, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function StudentQuizzesPage({ params: { locale } }: { params: { locale: string } }) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const studentId = student?.id || '';

  const [quizzes, results] = await Promise.all([
    prisma.quiz.findMany({
      where: { isPublished: true },
      include: { classroom: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quizResult.findMany({
      where: { studentId },
    }),
  ]);

  const completedMap = new Set(results.map((r) => r.quizId));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">بنك الاختبارات والامتحانات</h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">الاختبارات الأسبوعية والشهرية التفاعلية مع التصحيح الفوري</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((q) => {
          const isDone = completedMap.has(q.id);
          return (
            <div
              key={q.id}
              className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                    {q.classroom.name}
                  </span>
                  <span className="text-[11px] font-medium text-n-400">
                    {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-n-800 dark:text-n-700 leading-snug">{q.title}</h3>
                <div className="flex items-center gap-3 mt-3 text-xs text-n-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {q.duration} دقيقة
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" />
                    نسبة النجاح: {q.passingScore}%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-n-100 dark:border-n-200 flex items-center justify-between">
                {isDone ? (
                  <span className="text-xs text-ok bg-ok-light px-2.5 py-1 rounded font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> تم إنجاز الامتحان
                  </span>
                ) : (
                  <span className="text-xs text-n-400">متاح الآن</span>
                )}

                <Link href={isDone ? `/${locale}/student/grades` : `/${locale}/student/quizzes/${q.id}`}>
                  <Button size="sm" variant={isDone ? 'secondary' : 'primary'}>
                    {isDone ? 'عرض النتيجة' : 'بدء الاختبار'}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

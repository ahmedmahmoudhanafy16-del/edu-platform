import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ClipboardList, Clock, BarChart3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthenticatedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentQuizzesPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const student = await getAuthenticatedStudent();
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
  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 shadow-sm';

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-accent" />
          بنك الاختبارات والامتحانات
        </h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          مرحباً {student?.name} — الاختبارات الأسبوعية والشهرية التفاعلية مع رصد الدرجات والتصحيح الفوري
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((q) => {
          const isDone = completedMap.has(q.id);
          return (
            <div
              key={q.id}
              className={`${card} flex flex-col justify-between overflow-hidden`}
            >
              {/* Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold text-accent-text bg-accent-light px-2.5 py-0.5 rounded-md border border-accent/20">
                    {q.classroom.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 font-bold rounded-full ${
                      q.type === 'MONTHLY'
                        ? 'border border-warn/30 text-warn bg-warn-light'
                        : 'bg-n-100 text-n-700 dark:bg-n-200 dark:text-n-400'
                    }`}
                  >
                    {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-n-800 dark:text-n-700 leading-snug mt-2">
                  {q.title}
                </h3>
              </div>

              {/* Details */}
              <div className="px-5 py-2">
                <div className="flex items-center gap-4 text-xs font-medium text-n-500 bg-n-50 dark:bg-n-200 p-3 rounded-lg border border-n-100 dark:border-n-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-n-400" />
                    المدة: <strong>{q.duration} دقيقة</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-n-400" />
                    نسبة النجاح: <strong>{q.passingScore}%</strong>
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 pt-3">
                {isDone ? (
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 py-2 px-3 rounded-lg bg-ok-light border border-ok/20 text-ok text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      مكتمل
                    </div>
                    <Link href={`/${locale}/student/grades`}>
                      <Button variant="secondary" size="sm" className="font-semibold text-xs h-9 px-3">
                        عرض النتيجة
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href={`/${locale}/student/quizzes/${q.id}`} className="w-full">
                    <Button
                      variant="primary"
                      className="w-full"
                      size="md"
                    >
                      ابدأ الاختبار الآن
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

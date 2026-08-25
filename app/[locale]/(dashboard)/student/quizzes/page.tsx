import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ClipboardList, Clock, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          بنك الاختبارات والامتحانات
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          مرحباً {student?.name} — الاختبارات الأسبوعية والشهرية التفاعلية مع رصد الدرجات والتصحيح الفوري
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((q) => {
          const isDone = completedMap.has(q.id);
          return (
            <Card
              key={q.id}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between rounded-xl overflow-hidden"
            >
              {/* Card Header */}
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    {q.classroom.name}
                  </span>
                  <Badge
                    variant={q.type === 'MONTHLY' ? 'outline' : 'secondary'}
                    className={`text-xs px-2 py-0.5 font-bold ${
                      q.type === 'MONTHLY'
                        ? 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug mt-2">
                  {q.title}
                </CardTitle>
              </CardHeader>

              {/* Card Body - Details Row */}
              <CardContent className="px-5 py-2">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    المدة: <strong>{q.duration} دقيقة</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-slate-400" />
                    نسبة النجاح: <strong>{q.passingScore}%</strong>
                  </span>
                </div>
              </CardContent>

              {/* Card Footer */}
              <CardFooter className="p-5 pt-3">
                {isDone ? (
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      مكتمل
                    </div>
                    <Link href={`/${locale}/student/grades`}>
                      <Button variant="secondary" size="sm" className="font-semibold text-xs h-10 px-3">
                        عرض النتيجة
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href={`/${locale}/student/quizzes/${q.id}`} className="w-full">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      ابدأ الاختبار الآن
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

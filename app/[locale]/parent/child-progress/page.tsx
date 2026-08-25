import React from 'react';
import { prisma } from '@/lib/prisma';
import { Trophy, TrendingUp, CheckCircle2, Award, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParentChildProgressPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
    include: {
      quizResults: {
        include: { quiz: true },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  const totalScore = student?.quizResults.reduce((acc, r) => acc + (r.totalScore || 0), 0) || 0;
  const maxPossible = student?.quizResults.reduce((acc, r) => acc + (r.maxScore || 1), 0) || 1;
  const avgScore = Math.round((totalScore / maxPossible) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            تقرير درجات وامتحانات الطالب
          </h1>
          <p className="text-xs text-slate-500 mt-1">متابعة تفصيلية لنتائج الاختبارات والامتحانات الشهرية</p>
        </div>
        <Link href={`/${locale}/parent/dashboard`}>
          <Button variant="secondary" size="sm">العودة للبوابة</Button>
        </Link>
      </div>

      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">الطالب</p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{student?.name}</h2>
          <span className="text-xs text-slate-500">{student?.grade || 'الصف الثالث الإعدادي'}</span>
        </div>
        <div className="text-end">
          <p className="text-xs text-slate-500">المعدل العام</p>
          <p className="text-3xl font-bold text-emerald-600">{avgScore}%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">سجل الاختبارات المنجزة</h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {student?.quizResults.map((r) => {
            const pct = Math.round(((r.totalScore || 0) / (r.maxScore || 1)) * 100);
            return (
              <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold mb-1">
                    {r.quiz.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                  </Badge>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{r.quiz.title}</h4>
                  <p className="text-slate-400 mt-0.5">تاريخ التسليم: {new Date(r.submittedAt).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-end">
                    <p className="text-slate-400">الدرجة</p>
                    <strong className="text-sm text-slate-900 dark:text-white">{r.totalScore} / {r.maxScore}</strong>
                  </div>
                  <Badge variant={r.isPassed ? 'secondary' : 'outline'} className={r.isPassed ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-red-600'}>
                    {pct}% ({r.isPassed ? 'ناجح ✅' : 'يحتاج مراجعة'})
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { prisma } from '@/lib/prisma';
import { FileText, CheckCircle2, Clock, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParentChildHomeworkPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
    include: {
      submissions: {
        include: { assignment: true },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            سجل واجبات وملاحظات المعلم
          </h1>
          <p className="text-xs text-slate-500 mt-1">متابعة تسليمات الواجبات والدرجات والملاحظات التقييمية</p>
        </div>
        <Link href={`/${locale}/parent/dashboard`}>
          <Button variant="secondary" size="sm">العودة للبوابة</Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">الواجبات والتسليمات الخاصة بالطالب ({student?.name})</h3>
        </div>

        {(!student?.submissions || student.submissions.length === 0) ? (
          <p className="text-xs text-slate-400 py-12 text-center">لا توجد واجبات مسجلة حالياً</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {student.submissions.map((sub) => (
              <div key={sub.id} className="p-5 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sub.assignment.title}</h4>
                  <span className="font-bold text-sm text-emerald-600">
                    الدرجة: {sub.grade != null ? `${sub.grade} / ${sub.assignment.maxScore}` : 'قيد التصحيح'}
                  </span>
                </div>

                <p className="text-slate-500">{sub.assignment.description}</p>

                {sub.teacherNote && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p><strong>ملاحظة المعلم:</strong> "{sub.teacherNote}"</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>تاريخ التسليم: {new Date(sub.submittedAt).toLocaleDateString('ar-EG')}</span>
                  <span>حالة الواجب: {sub.status === 'GRADED' ? 'تم التصحيح والتقييم ✅' : 'قيد المراجعة'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

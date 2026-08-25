import React from 'react';
import { prisma } from '@/lib/prisma';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParentNotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            سجل إشعارات وتنبيهات الواتساب
          </h1>
          <p className="text-xs text-slate-500 mt-1">سجل الرسائل الآلية المرسلة لرقم ولي الأمر (درجات الواجبات، نتائج الامتحانات، وبث الحصص)</p>
        </div>
        <Link href={`/${locale}/parent/dashboard`}>
          <Button variant="secondary" size="sm">العودة للبوابة</Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">الرسائل الأخيرة المستلمة</h3>
          <span className="text-xs text-slate-400 font-mono">{logs.length} رسالة موثقة</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">لا توجد إشعارات مسجلة حتى الآن</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="p-5 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      {log.type === 'QUIZ_RESULT' ? 'نتيجة اختبار' : log.type === 'HOMEWORK_GRADED' ? 'تصحيح واجب' : 'تنبيه بث مباشر'}
                    </Badge>
                    <span className="font-mono text-slate-500">إلى: +{log.recipient}</span>
                  </div>
                  <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {new Date(log.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl text-slate-800 dark:text-slate-200 whitespace-pre-line font-sans leading-relaxed border border-slate-100 dark:border-slate-800">
                  {log.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

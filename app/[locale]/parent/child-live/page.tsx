import React from 'react';
import { prisma } from '@/lib/prisma';
import { Video, Clock, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParentChildLivePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const activeSessions = await prisma.liveSession.findMany({
    where: { isActive: true },
    include: { classroom: true },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-600" />
            الحصص المباشرة الجارية الآن
          </h1>
          <p className="text-xs text-slate-500 mt-1">متابعة الغرف التفاعلية النشطة لكافة الصفوف الدراسية</p>
        </div>
        <Link href={`/${locale}/parent/dashboard`}>
          <Button variant="secondary" size="sm">العودة للبوابة</Button>
        </Link>
      </div>

      {activeSessions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">لا يوجد بث مباشر نشط حالياً</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">سيتم إرسال إشعار WhatsApp فوري على رقم هاتفك المسجل فور بدء المعلم لحصة جديدة.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSessions.map((s) => (
            <div key={s.id} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-xs font-bold text-red-600">بث مباشر الآن</span>
                  {s.targetGrade && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold text-xs">
                      {s.targetGrade}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{s.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{s.classroom.name}</p>
              </div>

              <div className="flex items-center gap-3">
                <code className="bg-slate-100 dark:bg-slate-800 text-blue-600 font-mono font-bold px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700">
                  {s.roomCode}
                </code>
                <Link href={`/${locale}/student/live?room=${s.roomCode}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm">
                    دخول الطالب للحصة
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { prisma } from '@/lib/prisma';
import { Calendar, Clock, Video, BookOpen, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SCHEDULE_DATA = [
  { day: 'السبت', time: '05:00 م - 06:30 م', title: 'شرح الجبر والنسب المثلثية', grade: 'الصف الثالث الإعدادي', roomCode: 'LIVE-MATH1', isLive: true },
  { day: 'الأحد', time: '07:00 م - 08:30 م', title: 'حل بنك أسئلة الهندسة', grade: 'الصف الثاني الإعدادي', roomCode: 'LIVE-MATH2', isLive: false },
  { day: 'الثلاثاء', time: '05:00 م - 06:30 م', title: 'مراجعة نهائية ليلة الامتحان', grade: 'الصف الثالث الإعدادي', roomCode: 'LIVE-MATH3', isLive: true },
  { day: 'الخميس', time: '06:00 م - 07:30 م', title: 'اختبار تجريبي وبث مناقشة الإجابات', grade: 'الصف الأول الثانوي', roomCode: 'LIVE-MATH4', isLive: false },
];

export default async function TeacherSchedulePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            الجدول الأسبوعي للحصص والمحاضرات
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مواعيد البث المباشر التفاعلي لجميع الفصول والصفوف الدراسية
          </p>
        </div>
        <Link href={`/${locale}/teacher/live`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Video className="h-4 w-4 ml-1.5" />
            بدء حصة فورية الآن
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCHEDULE_DATA.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold mb-2">
                  {item.grade}
                </Badge>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                {item.day}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 gap-2">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {item.time}
              </span>
              <div className="flex items-center gap-2">
                <code className="bg-slate-100 dark:bg-slate-800 text-blue-600 font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                  {item.roomCode}
                </code>
                <Link href={`/${locale}/teacher/live`}>
                  <Button size="sm" variant="secondary" className="text-xs h-8">
                    إدارة الغرفة
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

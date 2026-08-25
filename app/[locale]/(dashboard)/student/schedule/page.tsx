import React from 'react';
import { Calendar, Clock, Video, BookOpen, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getAuthenticatedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STUDENT_SCHEDULE = [
  { day: 'السبت', time: '05:00 م - 06:30 م', subject: 'الرياضيات والجبر', teacher: 'أ/ سارة أحمد', roomCode: 'LIVE-MATH1', isLive: true },
  { day: 'الاثنين', time: '06:00 م - 07:30 م', subject: 'الهندسة وحساب المثلثات', teacher: 'أ/ سارة أحمد', roomCode: 'LIVE-MATH2', isLive: false },
  { day: 'الأربعاء', time: '05:00 م - 06:30 م', subject: 'مراجعة أسبوعية وحل التمارين', teacher: 'أ/ سارة أحمد', roomCode: 'LIVE-MATH3', isLive: false },
];

export default async function StudentSchedulePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const student = await getAuthenticatedStudent();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          جدول الحصص والمحاضرات الأسبوعي
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          مرحباً {student?.name} — مواعيد البث المباشر المخصصة لـ ({student?.grade || 'الصف الثالث الإعدادي'})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STUDENT_SCHEDULE.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                  {item.day}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2.5">{item.subject}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{item.teacher}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {item.time}
              </span>
              <Link href={`/${locale}/student/live?room=${item.roomCode}`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8">
                  <Video className="h-3.5 w-3.5 ml-1" />
                  دخول الحصة
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

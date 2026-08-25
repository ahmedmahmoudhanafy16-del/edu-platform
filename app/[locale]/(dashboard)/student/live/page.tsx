import nextDynamic from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import { ShieldCheck } from 'lucide-react';
import { getAuthenticatedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LiveClassroom = nextDynamic(
  () => import('@/components/LiveClassroom'),
  { ssr: false }
);

export default async function StudentLivePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }> | { locale: string };
  searchParams: Promise<{ room?: string; name?: string }> | { room?: string; name?: string };
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams?.locale || 'ar';

  const student = await getAuthenticatedStudent();
  const room = resolvedSearch?.room || 'LIVE-MATH1';
  const displayName = resolvedSearch?.name || student?.name || 'الطالب';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">البث المباشر والحصة التفاعلية</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مرحباً {student?.name} — غرفة الحصة المباشرة التفاعلية مع المعلم — كود الغرفة:{' '}
            <code className="font-mono font-bold text-blue-600 dark:text-blue-400">{room}</code>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          البث نشط ومتصل
        </div>
      </div>

      {/* Embedded Live Classroom Window */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-black aspect-video shadow-sm">
        <LiveClassroom
          roomCode={room}
          userName={displayName}
          isTeacher={false}
        />
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 shadow-sm">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          يتم تسجيل الحضور تلقائياً بمجرد دخولك إلى الحصة المباشرة
        </span>
        <span className="text-slate-400">تطبيق البث المباشر المدمج</span>
      </div>
    </div>
  );
}

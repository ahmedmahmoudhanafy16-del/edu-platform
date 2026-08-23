import dynamic from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import { ShieldCheck } from 'lucide-react';

const LiveClassroom = dynamic(
  () => import('@/components/LiveClassroom'),
  { ssr: false }
);

export default async function StudentLivePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { room?: string; name?: string };
}) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const room = searchParams.room || 'LIVE-MATH1';
  const displayName = searchParams.name || student?.name || 'أحمد الطالب';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">البث المباشر والحصة التفاعلية</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            غرفة الحصة المباشرة التفاعلية مع المعلم — كود الغرفة:{' '}
            <code className="font-mono font-bold text-accent">{room}</code>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ok bg-ok-light px-3 py-1.5 rounded-lg border border-ok/20 font-semibold">
          <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
          البث نشط ومتصل
        </div>
      </div>

      {/* Embedded Live Classroom Window */}
      <div className="rounded-2xl border border-n-200 dark:border-n-300 overflow-hidden bg-black aspect-video shadow-sm">
        <LiveClassroom
          roomCode={room}
          userName={displayName}
          isTeacher={false}
        />
      </div>

      <div className="p-4 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 flex items-center justify-between text-xs text-n-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-accent" />
          يتم تسجيل الحضور تلقائياً بمجرد دخولك إلى الحصة المباشرة
        </span>
        <span className="text-n-400">تطبيق البث المباشر المدمج</span>
      </div>
    </div>
  );
}

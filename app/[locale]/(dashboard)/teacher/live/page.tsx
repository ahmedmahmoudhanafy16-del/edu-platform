import { prisma } from '@/lib/prisma';
import { TeacherLiveClient } from './TeacherLiveClient';
import { getAuthenticatedTeacher } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherLivePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let teacher: any = null;
  try {
    teacher = await getAuthenticatedTeacher();
  } catch (e) {
    console.warn('[Teacher Live] Auth fallback:', e);
  }

  const teacherId = teacher?.id || '';
  const teacherName = teacher?.name || 'المعلم';

  let classrooms: any[] = [];
  let activeSessions: any[] = [];
  let pastSessions: any[] = [];

  try {
    const results = await Promise.allSettled([
      prisma.classroom.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.liveSession.findMany({
        where: { isActive: true },
        include: { classroom: true },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.liveSession.findMany({
        where: { isActive: false },
        include: { classroom: true },
        take: 5,
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    if (results[0].status === 'fulfilled') classrooms = results[0].value || [];
    if (results[1].status === 'fulfilled') activeSessions = results[1].value || [];
    if (results[2].status === 'fulfilled') pastSessions = results[2].value || [];
  } catch (err) {
    console.warn('[Teacher Live] DB query skipped:', err);
  }

  const isAr = locale === 'ar';

  const serializedClassrooms = (classrooms || []).map((c) => ({
    id: String(c.id || ''),
    name: String(c.name || (isAr ? 'فصل دراسي' : 'Classroom')),
    subject: String(c.subject || ''),
    code: String(c.code || ''),
    isActive: c.isActive !== false,
  }));

  function safeIsoString(dateVal: any): string {
    if (!dateVal) return new Date().toISOString();
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return new Date().toISOString();
      return d.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  const serializedActive = (activeSessions || []).map((s) => ({
    id: s.id || '',
    title: s.title || (isAr ? 'حصة البث المباشر' : 'Live Session'),
    roomCode: s.roomCode || 'LIVE-ROOM',
    isActive: Boolean(s.isActive),
    classroomId: s.classroomId || serializedClassrooms[0]?.id || '',
    classroom: { name: s.classroom?.name || serializedClassrooms[0]?.name || (isAr ? 'عام' : 'General') },
    startedAt: safeIsoString(s.startedAt),
  }));

  const serializedPast = (pastSessions || []).map((s) => ({
    id: s.id || '',
    title: s.title || (isAr ? 'حصة سابقة' : 'Past Session'),
    roomCode: s.roomCode || 'LIVE-ROOM',
    isActive: false,
    classroomId: s.classroomId || serializedClassrooms[0]?.id || '',
    classroom: { name: s.classroom?.name || serializedClassrooms[0]?.name || (isAr ? 'عام' : 'General') },
    startedAt: safeIsoString(s.startedAt),
    endedAt: s.endedAt ? safeIsoString(s.endedAt) : null,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">
          {isAr ? 'البث المباشر وغرفة التحكم' : 'Live Streaming & Control Room'}
        </h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          {isAr
            ? 'بدء الحصص التفاعلية، كتم الصوت، مشاركة الشاشة، وتسجيل حضور الطلاب التلقائي'
            : 'Start interactive sessions, mute controls, screen sharing, and automated student attendance logging'}
        </p>
      </div>

      <TeacherLiveClient
        classrooms={serializedClassrooms}
        activeSessions={serializedActive}
        pastSessions={serializedPast}
        teacherName={teacherName}
      />
    </div>
  );
}

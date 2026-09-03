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

  const teacherId = teacher?.id || 'demo-teacher-1';
  const teacherName = teacher?.name || 'أ/ سارة أحمد';

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

  // Fallback default classrooms if none exist
  if (!classrooms || classrooms.length === 0) {
    classrooms = [
      {
        id: 'class-science-4',
        name: 'الصف الرابع الابتدائي',
        subject: 'Science',
        code: 'LX2WJS',
        teacherId,
        createdAt: new Date(),
      },
    ];
  }

  const serializedActive = (activeSessions || []).map((s) => ({
    id: s.id || 'act-1',
    title: s.title || 'حصة البث المباشر',
    roomCode: s.roomCode || 'LIVE-ROOM',
    isActive: Boolean(s.isActive),
    classroomId: s.classroomId || classrooms[0]?.id || 'class-science-4',
    classroom: { name: s.classroom?.name || classrooms[0]?.name || 'الصف الرابع الابتدائي' },
    startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : new Date().toISOString(),
  }));

  const serializedPast = (pastSessions || []).map((s) => ({
    id: s.id || 'past-1',
    title: s.title || 'حصة سابقة',
    roomCode: s.roomCode || 'LIVE-ROOM',
    isActive: false,
    classroomId: s.classroomId || classrooms[0]?.id || 'class-science-4',
    classroom: { name: s.classroom?.name || classrooms[0]?.name || 'الصف الرابع الابتدائي' },
    startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : new Date().toISOString(),
    endedAt: s.endedAt ? new Date(s.endedAt).toISOString() : null,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">البث المباشر وغرفة التحكم</h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          بدء الحصص التفاعلية، كتم الصوت، مشاركة الشاشة، وتسجيل حضور الطلاب التلقائي
        </p>
      </div>

      <TeacherLiveClient
        classrooms={classrooms}
        activeSessions={serializedActive}
        pastSessions={serializedPast}
        teacherName={teacherName}
      />
    </div>
  );
}

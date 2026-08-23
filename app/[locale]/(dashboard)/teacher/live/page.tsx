import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { TeacherLiveClient } from './TeacherLiveClient';

export default async function TeacherLivePage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const [classrooms, activeSessions, pastSessions] = await Promise.all([
    prisma.classroom.findMany({ where: { teacherId } }),
    prisma.liveSession.findMany({
      where: { classroom: { teacherId }, isActive: true },
      include: { classroom: true },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.liveSession.findMany({
      where: { classroom: { teacherId }, isActive: false },
      include: { classroom: true },
      orderBy: { endedAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="TEACHER" userName={teacher?.name || 'المعلمة'} />
      <main className="flex-1 mr-60 p-8">
        <TeacherLiveClient
          teacherName={teacher?.name || 'المعلمة'}
          classrooms={classrooms}
          activeSessions={activeSessions as any}
          pastSessions={pastSessions as any}
        />
      </main>
    </div>
  );
}

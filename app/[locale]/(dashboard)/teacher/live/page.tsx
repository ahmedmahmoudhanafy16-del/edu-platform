import { prisma } from '@/lib/prisma';
import { TeacherLiveClient } from './TeacherLiveClient';

export default async function TeacherLivePage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const [classrooms, activeSession] = await Promise.all([
    prisma.classroom.findMany({ where: { teacherId } }),
    prisma.liveSession.findFirst({
      where: { classroom: { teacherId }, isActive: true },
      include: { classroom: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">البث المباشر وغرفة التحكم</h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          بدء الحصص التفاعلية، كتم الصوت، مشاركة الشاشة، وتسجيل حضور الطلاب التلقائي
        </p>
      </div>

      <TeacherLiveClient
        classrooms={classrooms}
        initialSession={activeSession}
        teacherName={teacher?.name || 'المعلمة'}
      />
    </div>
  );
}

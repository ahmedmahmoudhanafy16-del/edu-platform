import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { BookOpen, Users, Plus, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function TeacherClassroomsPage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    include: {
      enrollments: { include: { user: true } },
      assignments: true,
      quizzes: true,
    },
  });

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="TEACHER" userName={teacher?.name || 'المعلمة'} />
      <main className="flex-1 mr-60 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الفصول الدراسية</h1>
            <p className="text-xs text-n-500 dark:text-n-400 mt-1">إدارة فصولك ورموز الانضمام للطلاب</p>
          </div>
          <Button size="md">
            <Plus className="h-4 w-4 ml-1.5" />
            إنشاء فصل جديد
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((c) => (
            <div key={c.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-1 rounded">
                  {c.subject}
                </span>
                <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-2">{c.name}</h2>
              </div>

              <div className="pt-2 border-t border-n-100 dark:border-n-200 flex items-center justify-between text-xs text-n-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {c.enrollments.length} طالب
                </span>
                <span className="flex items-center gap-1 font-mono font-bold text-accent">
                  <KeyRound className="h-3.5 w-3.5 text-n-400" />
                  {c.code}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

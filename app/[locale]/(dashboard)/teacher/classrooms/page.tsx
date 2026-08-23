import { prisma } from '@/lib/prisma';
import { BookOpen, Plus, Users, Copy, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/CopyButton';

export default async function TeacherClassroomsPage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    include: {
      enrollments: { include: { user: true } },
      quizzes: true,
      assignments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الفصول والمجموعات الدراسية</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">إدارة فصولك والطلاب المسجلين وأكواد الانضمام</p>
        </div>
        <Button size="md">
          <Plus className="h-4 w-4 me-1.5" />
          إنشاء فصل دراسي جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classrooms.map((c) => (
          <div key={c.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                  {c.subject}
                </span>
                <h2 className="text-lg font-bold text-n-800 dark:text-n-700 mt-2">{c.name}</h2>
              </div>
              <div className="text-end">
                <span className="text-xs text-n-400">كود الانضمام</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <code className="text-xs font-mono font-bold text-accent bg-accent-light px-2 py-0.5 rounded border border-accent/20">
                    {c.code}
                  </code>
                  <CopyButton value={c.code} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-n-100 dark:border-n-200 text-center">
              <div>
                <p className="text-xs text-n-400">الطلاب</p>
                <p className="text-base font-bold text-n-800 dark:text-n-700 mt-0.5">{c.enrollments.length}</p>
              </div>
              <div>
                <p className="text-xs text-n-400">الامتحانات</p>
                <p className="text-base font-bold text-n-800 dark:text-n-700 mt-0.5">{c.quizzes.length}</p>
              </div>
              <div>
                <p className="text-xs text-n-400">الواجبات</p>
                <p className="text-base font-bold text-n-800 dark:text-n-700 mt-0.5">{c.assignments.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button variant="secondary" size="sm" className="flex-1">
                إضافة طلاب بالكود
              </Button>
              <Button variant="primary" size="sm" className="flex-1">
                عرض تفاصيل الفصل
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

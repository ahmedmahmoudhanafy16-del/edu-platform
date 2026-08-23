import { prisma } from '@/lib/prisma';
import { FileText, Plus, CheckCircle2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function TeacherAssignmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const assignments = await prisma.assignment.findMany({
    where: { classroom: { teacherId } },
    include: {
      classroom: true,
      submissions: { include: { student: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الواجبات والتصحيح السريع</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">متابعة تسليمات الطلاب وتصحيح الواجبات وتدوين الملاحظات</p>
        </div>
        <Button size="md">
          <Plus className="h-4 w-4 me-1.5" />
          إضافة واجب جديد
        </Button>
      </div>

      <div className="space-y-4">
        {assignments.map((a) => (
          <div key={a.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                  {a.classroom.name}
                </span>
                <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-2">{a.title}</h2>
                <p className="text-xs text-n-500 mt-1">{a.description}</p>
              </div>
              <div className="text-end">
                <span className="text-xs font-semibold text-n-600 dark:text-n-400">الدرجة القصوى: {a.maxScore}</span>
                <p className="text-xs text-n-400 mt-1 font-mono">
                  آخر موعد: {new Date(a.dueDate).toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-n-100 dark:border-n-200 flex items-center justify-between">
              <span className="text-xs text-n-600 dark:text-n-400 font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-accent" />
                إجمالي التسليمات: {a.submissions.length} طالب
              </span>
              <Button variant="secondary" size="sm">
                عرض تسليمات الطلاب والتصحيح
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

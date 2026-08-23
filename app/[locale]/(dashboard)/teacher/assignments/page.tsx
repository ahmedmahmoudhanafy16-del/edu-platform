import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { FileText, Plus, CheckCircle2, Clock } from 'lucide-react';
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
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="TEACHER" userName={teacher?.name || 'المعلمة'} />
      <main className="flex-1 mr-60 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الواجبات والتصحيح</h1>
            <p className="text-xs text-n-500 dark:text-n-400 mt-1">متابعة تسليمات الطلاب وتصحيح الواجبات</p>
          </div>
          <Button size="md">
            <Plus className="h-4 w-4 ml-1.5" />
            إضافة واجب جديد
          </Button>
        </div>

        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded">
                    {a.classroom.name}
                  </span>
                  <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-1.5">{a.title}</h2>
                  <p className="text-xs text-n-500 mt-1">{a.description}</p>
                </div>
                <div className="text-end">
                  <span className="text-xs text-n-400">الدرجة القصوى: {a.maxScore}</span>
                  <p className="text-xs text-n-500 mt-1 font-mono">
                    آخر موعد: {new Date(a.dueDate).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-n-100 dark:border-n-200 flex items-center justify-between">
                <span className="text-xs text-n-600 font-medium">
                  التسليمات: {a.submissions.length} طالب
                </span>
                <Button variant="secondary" size="sm">
                  عرض التسليمات والتصحيح السريع
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

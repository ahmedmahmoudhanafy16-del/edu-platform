import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function StudentAssignmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const studentId = student?.id || '';

  const assignments = await prisma.assignment.findMany({
    include: {
      classroom: true,
      submissions: {
        where: { studentId },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="STUDENT" userName={student?.name || 'الطالب'} />
      <main className="flex-1 mr-60 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الواجبات الدراسية</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">قائمة بالواجبات المطلوبة ومواعيد التسليم</p>
        </div>

        <div className="space-y-4">
          {assignments.map((a) => {
            const submission = a.submissions[0];
            const isSubmitted = !!submission;

            return (
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
                    <span className="text-xs text-n-400">الدرجة: {a.maxScore}</span>
                    <p className="text-xs text-n-500 mt-1 font-mono">
                      آخر موعد: {new Date(a.dueDate).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-n-100 dark:border-n-200 flex items-center justify-between">
                  {isSubmitted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ok bg-ok-light px-2.5 py-1 rounded font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تم التسليم
                      </span>
                      {submission.grade != null && (
                        <span className="text-xs font-bold text-n-800">
                          الدرجة: {submission.grade} / {a.maxScore}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-warn bg-warn-light px-2.5 py-1 rounded font-medium">
                      مطلوب التسليم
                    </span>
                  )}
                  <Button size="sm" variant={isSubmitted ? 'secondary' : 'primary'}>
                    {isSubmitted ? 'عرض الإجابة' : 'تسليم الحل الآن'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

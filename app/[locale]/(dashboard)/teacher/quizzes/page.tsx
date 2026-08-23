import { prisma } from '@/lib/prisma';
import { ClipboardList, Plus, Clock, Printer, FileText, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function TeacherQuizzesPage({ params: { locale } }: { params: { locale: string } }) {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher?.id || '';

  const quizzes = await prisma.quiz.findMany({
    where: { classroom: { teacherId } },
    include: {
      classroom: true,
      questions: true,
      results: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">بنك الامتحانات والطباعة</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            إنشاء الاختبارات الإلكترونية وتوليد نسخ الطباعة الورقية A4 للفصول والسناتر
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="md">
            <Plus className="h-4 w-4 me-1.5" />
            إنشاء امتحان جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((q) => (
          <div key={q.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                  {q.classroom.name}
                </span>
                <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-2">{q.title}</h2>
              </div>
              <span className="text-[11px] font-medium text-n-400">
                {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-n-100 dark:border-n-200 text-center text-xs">
              <div>
                <p className="text-n-400">الأسئلة</p>
                <p className="font-bold text-n-800 dark:text-n-700 mt-0.5">{q.questions.length}</p>
              </div>
              <div>
                <p className="text-n-400">المدة</p>
                <p className="font-bold text-n-800 dark:text-n-700 mt-0.5">{q.duration} دقيقة</p>
              </div>
              <div>
                <p className="text-n-400">الممتحنون</p>
                <p className="font-bold text-n-800 dark:text-n-700 mt-0.5">{q.results.length} طالب</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button variant="secondary" size="sm" className="flex-1">
                عرض النتائج
              </Button>
              <Button variant="primary" size="sm" className="flex-1">
                تعديل الأسئلة
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

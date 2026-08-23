import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { ClipboardList, Plus, Wand2 } from 'lucide-react';
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
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="TEACHER" userName={teacher?.name || 'المعلمة'} />
      <main className="flex-1 mr-60 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">بنك الأسئلة والامتحانات</h1>
            <p className="text-xs text-n-500 dark:text-n-400 mt-1">إنشاء الاختبارات وتوليد الامتحانات الشهرية</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md">
              <Wand2 className="h-4 w-4 ml-1.5" />
              توليد امتحان شهري
            </Button>
            <Button size="md">
              <Plus className="h-4 w-4 ml-1.5" />
              إنشاء امتحان جديد
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {quizzes.map((q) => (
            <div key={q.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded">
                    {q.type === 'WEEKLY' ? 'اختبار أسبوعي' : 'امتحان شهري'} — {q.classroom.name}
                  </span>
                  <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-1.5">{q.title}</h2>
                  <p className="text-xs text-n-500 mt-1">
                    المدة: {q.duration} دقيقة | نسبة النجاح: {q.passingScore}% | عدد الأسئلة: {q.questions.length}
                  </p>
                </div>
                <div className="text-end">
                  <span className="text-xs text-ok bg-ok-light px-2 py-1 rounded font-medium">منشور للطلاب</span>
                </div>
              </div>

              <div className="pt-4 border-t border-n-100 dark:border-n-200 flex items-center justify-between">
                <span className="text-xs text-n-600">النتائج: {q.results.length} طالب اختبر</span>
                <Button variant="secondary" size="sm">عرض كشف الدرجات</Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

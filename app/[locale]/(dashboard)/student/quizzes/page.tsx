import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/shared/Sidebar';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function StudentQuizzesListPage({ params: { locale } }: { params: { locale: string } }) {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });

  const quizzes = await prisma.quiz.findMany({
    where: { isPublished: true },
    include: { classroom: true, questions: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="STUDENT" userName={student?.name || 'الطالب'} />
      <main className="flex-1 mr-60 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الامتحانات والاختبارات</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">الامتحانات الأسبوعية والشهرية التفاعلية</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((q) => (
            <div key={q.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded">
                  {q.type === 'WEEKLY' ? 'اختبار أسبوعي' : 'امتحان شهري'} — {q.classroom.name}
                </span>
                <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-2">{q.title}</h2>
                <p className="text-xs text-n-500 mt-1">
                  المدة: {q.duration} دقيقة | نسبة النجاح: {q.passingScore}% | عدد الأسئلة: {q.questions.length}
                </p>
              </div>

              <div className="pt-3 border-t border-n-100 dark:border-n-200 flex justify-end">
                <Link href={`/${locale}/student/quizzes/${q.id}`}>
                  <Button size="sm">بدء الامتحان الآن</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

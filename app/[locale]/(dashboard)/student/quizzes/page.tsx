import Link from 'next/link';
import { prisma, memoryQuizResults } from '@/lib/prisma';
import { ClipboardList } from 'lucide-react';
import { getAuthenticatedStudent } from '@/lib/auth';
import { StudentQuizCard } from '@/components/student/StudentQuizCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentQuizzesPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let student: any = null;
  try {
    student = await getAuthenticatedStudent();
  } catch (e) {}

  const studentId = student?.id || 'demo-student-1';
  const studentName = student?.name || 'أحمد محمد علي';

  let quizzes: any[] = [];
  let dbResults: any[] = [];

  try {
    const res = await Promise.allSettled([
      prisma.quiz.findMany({
        where: { isPublished: true },
        include: { classroom: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quizResult.findMany({
        where: { studentId },
      }),
    ]);

    if (res[0].status === 'fulfilled') quizzes = res[0].value || [];
    if (res[1].status === 'fulfilled') dbResults = res[1].value || [];
  } catch (err) {
    console.warn('[Student Quizzes] DB query skipped:', err);
  }

  // Merge database quiz results with in-memory store
  const dbResultIds = new Set(dbResults.map((r) => r.quizId));
  const memoryStudentResults = (memoryQuizResults || [])
    .filter((m: any) => m.studentId === studentId && !dbResultIds.has(m.quizId))
    .map((m: any) => ({
      id: m.id,
      quizId: m.quizId,
      totalScore: m.totalScore,
      autoScore: m.autoScore,
      maxScore: m.maxScore,
      isPassed: m.isPassed,
      status: m.status || 'AUTO_GRADED',
      submittedAt: m.submittedAt ? new Date(m.submittedAt) : new Date(),
    }));

  const allResults = [...dbResults, ...memoryStudentResults];

  if (!quizzes || quizzes.length === 0) {
    quizzes = [
      {
        id: 'sample-q1',
        title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
        type: 'WEEKLY',
        duration: 20,
        passingScore: 60,
        isCodeRequired: true,
        accessCode: 'QUIZ-MATH-2026',
        classroom: { name: 'الصف الثالث الإعدادي - رياضيات' },
      },
    ];
  }

  const completedMap = new Set(
    allResults
      .filter((r) => r.status === 'AUTO_GRADED' || r.status === 'GRADED' || r.status === 'PENDING')
      .map((r) => r.quizId)
  );

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-accent" />
          بنك الاختبارات والامتحانات
        </h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          مرحباً {studentName} — الاختبارات الأسبوعية والشهرية التفاعلية مع رصد الدرجات والتصحيح الفوري
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(quizzes || []).map((q) => {
          const isDone = completedMap.has(q.id);
          return (
            <StudentQuizCard
              key={q.id}
              quiz={{
                id: q.id,
                title: q.title,
                type: q.type,
                duration: q.duration ?? 20,
                passingScore: q.passingScore ?? 60,
                isCodeRequired: q.isCodeRequired !== false,
                classroomName: q.classroom?.name || 'فصل الرياضيات',
              }}
              isCompleted={isDone}
              studentId={studentId}
              locale={locale}
            />
          );
        })}
      </div>
    </div>
  );
}

import { prisma, memoryQuizResults } from '@/lib/prisma';
import { getAuthenticatedStudent } from '@/lib/auth';
import { StudentGradesClient, GradeResultItem } from '@/components/student/StudentGradesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentGradesPage({
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

  const studentId = student?.id || '';
  const studentName = student?.name || 'طالب';

  let dbResults: any[] = [];
  try {
    dbResults = await prisma.quizResult.findMany({
      where: { studentId },
      include: { quiz: { include: { classroom: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  } catch (err) {
    console.warn('[Student Grades] DB query skipped:', err);
  }

  // Merge database quiz results with in-memory store
  const dbResultIds = new Set(dbResults.map((r) => r.id || r.quizId));
  const memoryStudentResults = (memoryQuizResults || [])
    .filter((m: any) => m.studentId === studentId && !dbResultIds.has(m.id) && !dbResultIds.has(m.quizId))
    .map((m: any) => ({
      id: m.id || `mem-${Math.random()}`,
      quizId: m.quizId,
      totalScore: m.totalScore ?? m.autoScore ?? 0,
      autoScore: m.autoScore ?? 0,
      maxScore: m.maxScore || 100,
      isPassed: Boolean(m.isPassed),
      status: m.status || 'AUTO_GRADED',
      submittedAt: m.submittedAt ? new Date(m.submittedAt) : new Date(),
      quiz: {
        id: m.quizId,
        title: m.quizTitle || 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
        type: 'WEEKLY',
      },
    }));

  const allResults = [...dbResults, ...memoryStudentResults];

  const formattedResults: GradeResultItem[] = (allResults || []).map((r) => {
    const s = r.totalScore ?? r.autoScore ?? 0;
    const m = r.maxScore || 100;
    const p = r.percentage !== undefined ? r.percentage : Math.round((s / m) * 100);

    return {
      id: r.id || `res-${r.quizId}`,
      quizId: r.quizId,
      totalScore: s,
      autoScore: r.autoScore ?? 0,
      maxScore: m,
      percentage: p,
      isPassed: Boolean(r.isPassed),
      submittedAt: r.submittedAt ? new Date(r.submittedAt) : new Date(),
      quiz: {
        id: r.quiz?.id || r.quizId,
        title: r.quiz?.title || 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
        type: r.quiz?.type || 'WEEKLY',
      },
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      <StudentGradesClient
        initialResults={formattedResults}
        studentName={studentName}
        studentId={studentId}
        locale={locale}
      />
    </div>
  );
}

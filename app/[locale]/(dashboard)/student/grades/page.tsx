import { prisma, memoryQuizResults } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
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
  const isAr = locale === 'ar';

  let student: any = null;
  try {
    student = await getAuthenticatedStudent();
  } catch (e) {}

  const studentId = student?.id || '';
  const studentName = student?.name || (isAr ? 'طالب' : 'Student');

  let sbResults: any[] = [];
  // 1. Fetch completed exam attempts from central Supabase database
  try {
    if (studentId) {
      const { data: sbAttempts } = await supabase
        .from('exam_attempts')
        .select('id, exam_id, final_score, status, completed_at, exams(id, title, total_marks, passing_score)')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (sbAttempts && sbAttempts.length > 0) {
        sbResults = sbAttempts.map((a: any) => {
          const examInfo = Array.isArray(a.exams) ? a.exams[0] : a.exams;
          const totalMarks = Number(examInfo?.total_marks) || 100;
          const finalScore = Number(a.final_score) || 0;
          const passingScore = Number(examInfo?.passing_score) || 50;

          return {
            id: a.id,
            quizId: a.exam_id,
            totalScore: finalScore,
            autoScore: finalScore,
            maxScore: totalMarks,
            percentage: totalMarks > 0 ? Math.round((finalScore / totalMarks) * 100) : 0,
            isPassed: finalScore >= passingScore,
            submittedAt: a.completed_at ? new Date(a.completed_at) : new Date(),
            quiz: {
              id: a.exam_id,
              title: examInfo?.title || (isAr ? 'امتحان مركزي' : 'Central Exam'),
              type: 'EXAM',
            },
          };
        });
      }
    }
  } catch (sbErr) {
    console.warn('[Student Grades] Supabase lookup notice:', sbErr);
  }

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

  // Merge database quiz results with in-memory and Supabase stores
  const existingIds = new Set(sbResults.map((r) => r.quizId));
  const filteredDbResults = dbResults.filter((r) => !existingIds.has(r.quizId));
  filteredDbResults.forEach((r) => existingIds.add(r.id || r.quizId));

  const memoryStudentResults = (memoryQuizResults || [])
    .filter((m: any) => m.studentId === studentId && !existingIds.has(m.id) && !existingIds.has(m.quizId))
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
        title: m.quizTitle || (isAr ? 'امتحان تقييمي' : 'Evaluation Quiz'),
        type: 'WEEKLY',
      },
    }));

  const allResults = [...sbResults, ...filteredDbResults, ...memoryStudentResults];

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
        title: r.quiz?.title || (isAr ? 'امتحان تقييمي' : 'Evaluation Quiz'),
        type: r.quiz?.type || 'WEEKLY',
      },
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      <StudentGradesClient
        initialResults={formattedResults}
        studentName={studentName}
        studentId={studentId}
        locale={locale}
      />
    </div>
  );
}

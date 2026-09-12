import Link from 'next/link';
import { prisma, memoryQuizResults, memoryQuizzes } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { ClipboardList } from 'lucide-react';
import { getAuthenticatedStudent } from '@/lib/auth';
import { StudentQuizzesListClient } from '@/components/student/StudentQuizzesListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentQuizzesPage({
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

  let quizzes: any[] = [];
  let dbResults: any[] = [];

  // 1. Fetch published exams from central Supabase database
  try {
    const { data: sbExams } = await supabase
      .from('exams')
      .select('id, title, description, duration_minutes, passing_score, total_marks, is_published, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (sbExams && sbExams.length > 0) {
      quizzes = sbExams.map((e) => ({
        id: e.id,
        title: e.title,
        type: 'EXAM',
        duration: e.duration_minutes || 30,
        passingScore: Number(e.passing_score) || 50,
        isCodeRequired: false,
        classroom: { name: isAr ? 'الامتحان المركزي' : 'Central Exam' },
      }));
    }

    if (studentId) {
      const { data: sbAttempts } = await supabase
        .from('exam_attempts')
        .select('id, exam_id, final_score, status, completed_at')
        .eq('student_id', studentId);

      if (sbAttempts && sbAttempts.length > 0) {
        dbResults = sbAttempts.map((a) => ({
          quizId: a.exam_id,
          totalScore: Number(a.final_score) || 0,
          autoScore: Number(a.final_score) || 0,
          maxScore: 100,
          isPassed: Number(a.final_score) >= 50,
          status: a.status === 'completed' ? 'GRADED' : 'IN_PROGRESS',
        }));
      }
    }
  } catch (sbErr) {
    console.warn('[Student Quizzes] Supabase query notice:', sbErr);
  }

  // 2. Secondary fallback: Local/Relational Prisma Database
  try {
    const res = await Promise.allSettled([
      prisma.quiz.findMany({
        where: {
          OR: [
            {
              isPublished: true,
              OR: [
                { classroomId: null },
                { classroom: { isActive: true } },
              ],
            },
            ...(studentId
              ? [
                  {
                    results: {
                      some: { studentId },
                    },
                  },
                ]
              : []),
          ],
        },
        include: { classroom: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quizResult.findMany({
        where: { studentId },
      }),
    ]);

    if (res[0].status === 'fulfilled' && res[0].value?.length > 0) {
      const existingIds = new Set(quizzes.map((q) => q.id));
      for (const pq of res[0].value) {
        if (!existingIds.has(pq.id)) {
          quizzes.push(pq);
        }
      }
    }
    if (res[1].status === 'fulfilled' && res[1].value?.length > 0) {
      const existingResultIds = new Set(dbResults.map((r) => r.quizId));
      for (const pr of res[1].value) {
        if (!existingResultIds.has(pr.quizId)) {
          dbResults.push(pr);
        }
      }
    }
  } catch (err) {
    console.warn('[Student Quizzes] DB query skipped:', err);
  }

  // Memory fallback if DB returned empty
  if ((!quizzes || quizzes.length === 0) && memoryQuizzes && memoryQuizzes.length > 0) {
    const completedMemoryQuizIds = new Set(
      (memoryQuizResults || [])
        .filter((m: any) => m.studentId === studentId)
        .map((m: any) => m.quizId)
    );

    quizzes = memoryQuizzes.filter((q: any) => {
      if (
        completedMemoryQuizIds.has(q.id) ||
        (q.accessCode && completedMemoryQuizIds.has(q.accessCode))
      ) {
        return true;
      }
      return q.isPublished !== false && !q.isHidden;
    });
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

  const formattedQuizzes = (quizzes || []).map((q) => ({
    id: q.id,
    title: q.title || 'اختبار تقييمي',
    type: q.type || 'WEEKLY',
    duration: q.duration ?? 20,
    passingScore: q.passingScore ?? 60,
    isCodeRequired: q.isCodeRequired !== false,
    classroomName: q.classroom?.name || (isAr ? 'عام' : 'General'),
  }));

  const completedQuizIds = allResults
    .filter((r) => r.status === 'AUTO_GRADED' || r.status === 'GRADED' || r.status === 'PENDING')
    .map((r) => r.quizId);

  const initialResults = allResults.map((r) => ({
    quizId: r.quizId,
    score: r.totalScore ?? r.autoScore,
    maxScore: r.maxScore,
    percentage: r.maxScore ? Math.round(((r.totalScore ?? r.autoScore ?? 0) / r.maxScore) * 100) : undefined,
    isPassed: Boolean(r.isPassed),
  }));

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-accent" />
          {isAr ? 'بنك الاختبارات والامتحانات' : 'Exams & Quizzes Bank'}
        </h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          {isAr
            ? `مرحباً ${studentName} — الاختبارات الأسبوعية والشهرية التفاعلية مع رصد الدرجات والتصحيح الفوري`
            : `Welcome ${studentName} — Interactive weekly and monthly exams with instant grading and scoring`}
        </p>
      </div>

      <StudentQuizzesListClient
        initialQuizzes={formattedQuizzes}
        completedQuizIds={completedQuizIds}
        initialResults={initialResults}
        studentId={studentId}
        locale={locale}
      />
    </div>
  );
}

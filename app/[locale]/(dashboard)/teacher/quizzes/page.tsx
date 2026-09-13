import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { TeacherQuizzesClient } from './TeacherQuizzesClient';
import { getAuthenticatedTeacher } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherQuizzesPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isAr = locale === 'ar';

  let teacher: any = null;
  try {
    teacher = await getAuthenticatedTeacher();
  } catch (e) {}

  const teacherId = teacher?.id || '';

  let classrooms: any[] = [];
  let quizzes: any[] = [];

  try {
    const results = await Promise.allSettled([
      prisma.classroom.findMany({
        where: teacherId ? { teacherId } : {},
        select: { id: true, name: true },
      }),
      prisma.quiz.findMany({
        include: {
          classroom: true,
          questions: true,
          results: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (results[0].status === 'fulfilled') classrooms = results[0].value || [];
    if (results[1].status === 'fulfilled') quizzes = results[1].value || [];
  } catch (err) {
    console.warn('[Teacher Quizzes] DB query skipped:', err);
  }

  // Primary Authoritative Cloud Sync: Fetch exams from Supabase
  try {
    const { data: sbExams } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        passing_score,
        total_marks,
        is_published,
        created_at,
        questions ( id, question_text, options, correct_answer, score, order_index )
      `)
      .order('created_at', { ascending: false });

    if (sbExams && sbExams.length > 0) {
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('exam_id');

      const attemptCounts = new Map<string, number>();
      if (attempts) {
        for (const a of attempts) {
          attemptCounts.set(a.exam_id, (attemptCounts.get(a.exam_id) || 0) + 1);
        }
      }

      const existingQuizIds = new Set(quizzes.map((q) => q.id));
      for (const e of sbExams) {
        if (!existingQuizIds.has(e.id)) {
          const qs = (e.questions || []).map((qn: any) => ({
            id: qn.id,
            text: qn.question_text || '',
            type: 'MCQ',
            options: JSON.stringify(qn.options || []),
            correctAnswer: qn.correct_answer || '',
            maxScore: Number(qn.score) || 1,
          }));
          quizzes.push({
            id: e.id,
            title: e.title,
            type: 'EXAM',
            duration: e.duration_minutes || 30,
            passingScore: Number(e.passing_score) || 50,
            accessCode: '',
            isCodeRequired: false,
            isPublished: e.is_published !== false,
            classroom: { id: '', name: isAr ? 'الامتحان المركزي' : 'Central Exam' },
            classroomId: '',
            questions: qs,
            results: new Array(attemptCounts.get(e.id) || 0).fill({}),
          });
          existingQuizIds.add(e.id);
        }
      }
    }
  } catch (sbErr) {
    console.warn('[Teacher Quizzes Page] Supabase sync notice:', sbErr);
  }

  // Clean classrooms
  classrooms = classrooms || [];

  const formatted = (quizzes || []).map((q) => {
    const questionsList = (q.questions || []).map((qn: any) => ({
      id: qn.id || 'qn-1',
      text: qn.text || '',
      type: qn.type || 'MCQ',
      options: qn.options || '[]',
      correctAnswer: qn.correctAnswer || '',
      maxScore: Number(qn.maxScore) || 5,
    }));
    const totalScore = questionsList.length > 0
      ? questionsList.reduce((acc: number, qn: any) => acc + (Number(qn.maxScore) || 0), 0)
      : 10;

    return {
      id: q.id,
      title: q.title || '',
      type: q.type || 'WEEKLY',
      duration: q.duration ?? 20,
      passingScore: q.passingScore ?? 60,
      accessCode: q.accessCode || '',
      isCodeRequired: Boolean(q.isCodeRequired),
      isPublished: q.isPublished !== false,
      classroomName: q.classroom?.name || '',
      classroomId: q.classroomId || '',
      questionsCount: questionsList.length,
      resultsCount: q.results?.length ?? 0,
      totalScore,
      questions: questionsList,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <TeacherQuizzesClient initialQuizzes={formatted} classrooms={classrooms} />
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { supabase, getClassroomsFromSupabase, getQuizzesFromSupabase } from '@/lib/supabase';
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

  try {
    const sbClassrooms = await getClassroomsFromSupabase();
    if (sbClassrooms && sbClassrooms.length > 0) {
      const existingIds = new Set(classrooms.map((c) => c.id));
      for (const sb of sbClassrooms) {
        if (!existingIds.has(sb.id)) {
          classrooms.push({ id: sb.id, name: sb.name });
          existingIds.add(sb.id);
        }
      }
    }
  } catch (e) {}

  // Primary Authoritative Cloud Sync: Fetch exams from Supabase
  try {
    const sbQuizzes = await getQuizzesFromSupabase();
    if (Array.isArray(sbQuizzes) && sbQuizzes.length > 0) {
      const existingQuizIds = new Set(quizzes.map((q) => q.id));
      for (const e of sbQuizzes) {
        if (!existingQuizIds.has(e.id)) {
          const qs = (e.questions || []).map((qn: any, i: number) => ({
            id: qn.id || `qn-${i + 1}`,
            text: qn.text || '',
            type: qn.type || 'MCQ',
            options: typeof qn.options === 'string' ? qn.options : JSON.stringify(qn.options || []),
            correctAnswer: qn.correctAnswer || '',
            maxScore: Number(qn.maxScore) || 5,
          }));

          const matchedClass = classrooms.find((c) => c.id === e.classroomId || c.name === e.classroomName);

          quizzes.push({
            id: e.id,
            title: e.title,
            type: e.type || 'WEEKLY',
            duration: Number(e.duration) || 20,
            passingScore: Number(e.passingScore) || 60,
            accessCode: e.accessCode || '',
            isCodeRequired: Boolean(e.isCodeRequired),
            isPublished: e.isPublished !== false,
            classroom: {
              id: e.classroomId || matchedClass?.id || '',
              name: e.classroomName || matchedClass?.name || (isAr ? 'عام' : 'General'),
            },
            classroomId: e.classroomId || matchedClass?.id || '',
            questions: qs,
            results: new Array(e.resultsCount || 0).fill({}),
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

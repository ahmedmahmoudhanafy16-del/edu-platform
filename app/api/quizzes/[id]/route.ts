import { NextResponse } from 'next/server';
import { prisma, memoryQuizzes } from '@/lib/prisma';
import { supabase, getQuizzesFromSupabase } from '@/lib/supabase';
import { shuffleArray } from '@/lib/shuffle';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id?.trim();
    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الاختبار مفقود' }, { status: 400 });
    }

    let quiz: any = null;
    try {
      quiz = await prisma.quiz.findFirst({
        where: {
          OR: [{ id }, { accessCode: id }],
        },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });
    } catch (err) {
      console.warn('[API Quiz GET] DB query warning:', err);
    }

    if (!quiz) {
      const mem = (memoryQuizzes || []).find((m: any) => m.id === id || m.accessCode === id);
      if (mem) quiz = mem;
    }

    // ── Supabase Production Central Store Lookup ───────────────────────────
    if (!quiz) {
      try {
        const sbQuizzes = await getQuizzesFromSupabase();
        const matched = sbQuizzes.find((q) => q.id === id || q.accessCode === id);
        if (matched) {
          quiz = {
            id: matched.id,
            title: matched.title,
            type: matched.type || 'WEEKLY',
            duration: matched.duration || 20,
            passingScore: Number(matched.passingScore) || 60,
            isPublished: matched.isPublished !== false,
            isCodeRequired: matched.isCodeRequired !== false,
            accessCode: matched.accessCode,
            totalScore: matched.totalScore,
            classroomName: matched.classroomName,
            questions: (matched.questions || []).map((q: any) => ({
              id: q.id,
              text: q.text,
              type: q.type || 'MCQ',
              options: q.options,
              correctAnswer: q.correctAnswer,
              maxScore: Number(q.maxScore) || 5,
            })),
          };
        }
      } catch (err: any) {
        console.warn('[API Quiz GET] Supabase central store lookup notice:', err?.message);
      }
    }

    // ── Supabase Production Exams Lookup ──────────────────────────────────
    if (!quiz) {
      try {
        const { data: examData } = await supabase
          .from('exams')
          .select('id, title, description, duration_minutes, passing_score, total_marks, is_published')
          .eq('id', id)
          .maybeSingle();

        if (examData) {
          const { data: sbQuestions } = await supabase
            .from('questions')
            .select('id, question_text, options, score, order_index')
            .eq('exam_id', examData.id)
            .order('order_index', { ascending: true });

          quiz = {
            id: examData.id,
            title: examData.title,
            type: 'EXAM',
            duration: examData.duration_minutes || 30,
            passingScore: Number(examData.passing_score) || 50,
            isPublished: examData.is_published,
            isCodeRequired: false,
            questions: (sbQuestions || []).map((q) => {
              let parsedOpts: string[] = [];
              if (Array.isArray(q.options)) parsedOpts = q.options;
              else if (typeof q.options === 'string') {
                try {
                  parsedOpts = JSON.parse(q.options);
                } catch {
                  parsedOpts = [q.options];
                }
              }
              return {
                id: q.id,
                text: q.question_text,
                type: 'MCQ',
                options: parsedOpts,
                maxScore: Number(q.score) || 1,
              };
            }),
          };
        }
      } catch (sbErr: any) {
        console.warn('[API Quiz GET] Supabase lookup error:', sbErr?.message);
      }
    }

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على هذا الاختبار في قاعدة البيانات' },
        { status: 404 }
      );
    }

    const sanitizedQuestions = (quiz.questions || []).map((q: any) => {
      let parsedOptions: string[] = [];
      try {
        if (Array.isArray(q.options)) {
          parsedOptions = q.options;
        } else if (typeof q.options === 'string') {
          parsedOptions = JSON.parse(q.options || '[]');
        }
      } catch (e) {
        parsedOptions = [];
      }

      // Server-side shuffle of MCQ choices
      const safeOptions = Array.isArray(parsedOptions) ? parsedOptions.filter(Boolean) : [];
      const shuffledOptions = q.type === 'MCQ' && safeOptions.length > 1 ? shuffleArray(safeOptions) : safeOptions;

      return {
        id: q.id || `q-${Math.random()}`,
        text: q.text || 'سؤال بدون نص',
        type: q.type || 'MCQ',
        options: shuffledOptions,
        maxScore: q.maxScore ?? 5,
        order: q.order ?? 0,
        // CRITICAL SECURITY: correctAnswer is NEVER returned in the student API payload
      };
    });

    // Server-side shuffle of questions array
    const randomizedQuestions = shuffleArray(sanitizedQuestions);

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title || 'الاختبار الأكاديمي',
        duration: quiz.duration || 20,
        passingScore: quiz.passingScore || 60,
        accessCode: quiz.accessCode || '',
        isCodeRequired: quiz.isCodeRequired !== false,
        isPublished: quiz.isPublished !== false,
        shuffleQuestions: true,
        preventBackNavigation: quiz.preventBackNavigation !== false,
        timePerQuestion: Number(quiz.timePerQuestion) || 60,
        maxViolations: quiz.maxViolations ?? 2,
        questions: randomizedQuestions,
      },
    });
  } catch (err: any) {
    console.error('[API Quiz GET Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

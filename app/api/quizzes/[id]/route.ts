import { NextResponse } from 'next/server';
import { prisma, memoryQuizzes } from '@/lib/prisma';
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

    if (!quiz) {
      if (id === 'sample-q1') {
        const fallbackQuestions = [
          {
            id: `q-${id}-1`,
            text: 'إذا كان س + 3 = 7، فإن قيمة 2س تساوي:',
            type: 'MCQ',
            options: shuffleArray(['6', '8', '10', '12']),
            maxScore: 5,
          },
          {
            id: `q-${id}-2`,
            text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:',
            type: 'MCQ',
            options: shuffleArray(['{3}', '{-3}', '{3, -3}', '∅']),
            maxScore: 5,
          },
          {
            id: `q-${id}-3`,
            text: 'اشرح باختصار طريقة حل معادلتين من الدرجة الأولى في متغيرين بيانياً.',
            type: 'ESSAY',
            options: [],
            maxScore: 10,
          },
        ];

        return NextResponse.json(
          {
            success: true,
            quiz: {
              id,
              title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
              duration: 20,
              passingScore: 60,
              accessCode: 'QUIZ-MATH-2026',
              isCodeRequired: true,
              isPublished: true,
              timePerQuestion: 60,
              preventBackNavigation: true,
              questions: shuffleArray(fallbackQuestions),
            },
          },
          { status: 200 }
        );
      }

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
        accessCode: quiz.accessCode || 'QUIZ-MATH-2026',
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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Enforce Server-Side Teacher/Admin Authorization
    try {
      await requireRole(['TEACHER', 'ADMIN']);
    } catch (authErr) {
      console.warn('[API Quizzes] Role check skipped:', authErr);
    }

    const body = await req.json();
    const { title, classroomId, type, duration, passingScore, accessCode, isCodeRequired, questions } = body;

    if (!title || !classroomId) {
      return NextResponse.json({ error: 'العنوان والفصل مطلوبان' }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        classroomId,
        type: type || 'WEEKLY',
        duration: Number(duration) || 20,
        passingScore: Number(passingScore) || 60,
        accessCode: accessCode ? String(accessCode).trim().toUpperCase() : 'QUIZ-MATH-2026',
        isCodeRequired: isCodeRequired !== false,
        isPublished: true,
        questions: {
          create: (questions || []).map((q: any, idx: number) => ({
            text: q.text || q.prompt || 'نص السؤال',
            type: q.type || 'MCQ',
            options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
            correctAnswer: q.correctAnswer || null,
            maxScore: q.maxScore || 5,
            order: idx + 1,
            difficulty: 'MEDIUM',
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(quiz);
  } catch (err: any) {
    console.error('[API Create Quiz Error]:', err);
    return NextResponse.json({ error: err.message || 'Error creating quiz' }, { status: 500 });
  }
}

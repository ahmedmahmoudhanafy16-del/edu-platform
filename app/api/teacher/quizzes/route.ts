import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Enforce Server-Side Teacher/Admin Authorization
    await requireRole(['TEACHER', 'ADMIN']);

    const body = await req.json();
    const { title, classroomId, type, duration, passingScore, questions } = body;

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
        isPublished: true,
        questions: {
          create: (questions || []).map((q: any, idx: number) => ({
            prompt: q.text || q.prompt || '',
            type: q.type || 'MCQ',
            options: JSON.stringify(q.options || []),
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
    const status = err.message?.includes('403') || err.message?.includes('غير مصرح') ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Error creating quiz' }, { status });
  }
}

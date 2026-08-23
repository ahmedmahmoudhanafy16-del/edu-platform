import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, classroomId, type, duration, passingScore, questions } = body;

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
            text: q.text,
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
    return NextResponse.json({ error: err.message || 'Error creating quiz' }, { status: 500 });
  }
}

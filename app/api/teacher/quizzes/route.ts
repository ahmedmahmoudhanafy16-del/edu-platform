import { NextResponse } from 'next/server';
import { createQuiz } from '@/actions/quiz';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createQuiz(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'فشل إنشاء الاختبار' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      quiz: result.quiz,
      accessCode: result.accessCode,
      message: result.message,
    });
  } catch (err: any) {
    console.error('[API Create Quiz Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'حدث خطأ في الخادم أثناء إنشاء الاختبار' },
      { status: 500 }
    );
  }
}

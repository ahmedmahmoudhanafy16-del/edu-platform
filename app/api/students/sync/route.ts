import { NextRequest, NextResponse } from 'next/server';
import { getDynamicStudents, saveDynamicStudents } from '@/lib/dynamic-students';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const students = body.students || (body.student ? [body.student] : []);

    if (Array.isArray(students) && students.length > 0) {
      saveDynamicStudents(students);
    }

    const current = getDynamicStudents();
    return NextResponse.json({
      success: true,
      count: current.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const students = getDynamicStudents();
    return NextResponse.json({
      success: true,
      students,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

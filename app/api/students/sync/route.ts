import { NextRequest, NextResponse } from 'next/server';
import { getDynamicStudents, saveDynamicStudents } from '@/lib/dynamic-students';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const students = body.students || (body.student ? [body.student] : []);

    if (Array.isArray(students) && students.length > 0) {
      saveDynamicStudents(students);

      // Upsert into DB so server queries find them
      for (const s of students) {
        if (s && (s.studentCode || s.id)) {
          const code = String(s.studentCode || s.id).trim();
          const pass = String(s.defaultPassword || s.password || '1234').trim();
          try {
            await prisma.user.upsert({
              where: { id: code },
              update: {
                name: s.name || 'طالب',
                phone: s.phone || null,
                parentPhone: s.parentPhone || null,
                parentWhatsapp: s.parentWhatsapp || null,
                grade: s.grade || s.gradeLevel || 'الصف الثالث الإعدادي',
                defaultPassword: pass,
                isActive: s.isActive !== false,
              },
              create: {
                id: code,
                studentCode: code,
                name: s.name || 'طالب',
                phone: s.phone || null,
                parentPhone: s.parentPhone || null,
                parentWhatsapp: s.parentWhatsapp || null,
                grade: s.grade || s.gradeLevel || 'الصف الثالث الإعدادي',
                defaultPassword: pass,
                role: 'STUDENT',
                isActive: s.isActive !== false,
              },
            });
          } catch (dbErr) {}
        }
      }
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

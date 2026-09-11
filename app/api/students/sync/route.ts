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

      // Robust DB synchronization to prevent unique constraint conflicts
      for (const s of students) {
        if (s && (s.studentCode || s.id)) {
          const sId = String(s.id || '').trim();
          const sCode = String(s.studentCode || '').trim();
          const pass = String(s.defaultPassword || s.password || '').trim();
          const grade = s.grade || s.gradeLevel || 'الصف الثالث الإعدادي';

          try {
            const existing = await prisma.user.findFirst({
              where: {
                OR: [
                  ...(sId ? [{ id: sId }] : []),
                  ...(sCode ? [{ studentCode: sCode }] : []),
                ],
              },
            });

            if (existing) {
              await prisma.user.update({
                where: { id: existing.id },
                data: {
                  name: s.name || existing.name,
                  phone: s.phone ?? existing.phone,
                  parentPhone: s.parentPhone ?? existing.parentPhone,
                  parentWhatsapp: s.parentWhatsapp ?? existing.parentWhatsapp,
                  grade: grade,
                  gradeLevel: grade,
                  defaultPassword: pass || existing.defaultPassword,
                  isActive: s.isActive !== false,
                },
              });
            } else {
              await prisma.user.create({
                data: {
                  id: sId || undefined,
                  studentCode: sCode || undefined,
                  name: s.name || 'طالب',
                  phone: s.phone || null,
                  parentPhone: s.parentPhone || null,
                  parentWhatsapp: s.parentWhatsapp || null,
                  grade: grade,
                  gradeLevel: grade,
                  defaultPassword: pass || '1234',
                  role: 'STUDENT',
                  isActive: s.isActive !== false,
                },
              });
            }
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

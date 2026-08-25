'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';

export async function createClassroom(name: string, subject: string, teacherId: string) {
  // Enforce Teacher Role
  await requireRole(['TEACHER', 'ADMIN']);

  if (!name || !name.trim()) {
    throw new Error('اسم الفصل الدراسي مطلوب');
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const classroom = await prisma.classroom.create({
    data: {
      name: name.trim(),
      subject: subject ? subject.trim() : 'عام',
      code,
      teacherId,
    },
  });
  revalidatePath('/[locale]/teacher/classrooms');
  return classroom;
}

export async function addStudentToClassroom(
  data:
    | {
        name: string;
        phone: string;
        classroomId: string;
        grade?: string;
        parentPhone?: string;
        password?: string;
      }
    | string,
  phoneArg?: string,
  classroomIdArg?: string
) {
  // Support both object and positional params for backward compatibility
  const name = typeof data === 'object' ? data.name : data;
  const phone = typeof data === 'object' ? data.phone : (phoneArg || '');
  const classroomId = typeof data === 'object' ? data.classroomId : (classroomIdArg || '');
  const grade = typeof data === 'object' ? data.grade : undefined;
  const parentPhone = typeof data === 'object' ? data.parentPhone : phone;
  const password = typeof data === 'object' ? (data.password || '1234') : '1234';

  // 1. Enforce Teacher Role (properly awaited)
  await requireRole(['TEACHER', 'ADMIN']);

  if (!name || !name.trim()) {
    throw new Error('اسم الطالب مطلوب');
  }
  if (!classroomId) {
    throw new Error('يرجى تحديد الفصل الدراسي');
  }

  // 2. Generate unique studentCode
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const studentCode = `STU-${randomSuffix}`;

  const student = await prisma.user.create({
    data: {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      parentPhone: parentPhone ? parentPhone.trim() : (phone ? phone.trim() : null),
      grade: grade || 'الصف الثالث الإعدادي',
      studentCode,
      password,
      role: 'STUDENT',
      enrollments: {
        create: {
          classroomId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      studentCode: true,
      phone: true,
      parentPhone: true,
      grade: true,
      role: true,
      createdAt: true,
    },
  });

  revalidatePath('/[locale]/teacher/students');
  revalidatePath('/[locale]/teacher');
  return student;
}

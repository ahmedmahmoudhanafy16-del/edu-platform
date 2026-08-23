'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createClassroom(name: string, subject: string, teacherId: string) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const classroom = await prisma.classroom.create({
    data: {
      name,
      subject,
      code,
      teacherId,
    },
  });
  revalidatePath('/[locale]/teacher/classrooms');
  return classroom;
}

export async function addStudentToClassroom(name: string, phone: string, classroomId: string) {
  const studentCode = `STU-${Math.floor(100 + Math.random() * 900)}`;
  const student = await prisma.user.create({
    data: {
      name,
      phone,
      studentCode,
      password: '1234',
      role: 'STUDENT',
      enrollments: {
        create: {
          classroomId,
        },
      },
    },
  });
  revalidatePath('/[locale]/teacher/students');
  return student;
}

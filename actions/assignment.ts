'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createAssignment(data: {
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  classroomId: string;
}) {
  const assignment = await prisma.assignment.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      maxScore: data.maxScore,
      classroomId: data.classroomId,
    },
  });
  revalidatePath('/[locale]/teacher/assignments');
  return assignment;
}

export async function submitAssignment(assignmentId: string, studentId: string, answerText: string, fileUrl?: string) {
  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
    update: {
      answerText,
      fileUrl,
      submittedAt: new Date(),
      status: 'SUBMITTED',
    },
    create: {
      assignmentId,
      studentId,
      answerText,
      fileUrl,
      status: 'SUBMITTED',
    },
  });
  revalidatePath('/[locale]/student/assignments');
  return submission;
}

export async function gradeSubmission(submissionId: string, grade: number, teacherNote?: string) {
  const submission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      grade,
      teacherNote,
      status: 'GRADED',
      gradedAt: new Date(),
    },
  });
  revalidatePath('/[locale]/teacher/assignments');
  return submission;
}

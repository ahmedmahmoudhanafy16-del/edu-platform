'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole, requireStudentOwnership } from '@/lib/auth';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function createAssignment(data: {
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  classroomId: string;
}) {
  // Enforce Teacher/Admin RBAC
  await requireRole(['TEACHER', 'ADMIN']);

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

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  answerText: string,
  fileMeta?: { name: string; type?: string; sizeBytes?: number; dataUrl?: string } | null
) {
  // Enforce IDOR Protection: Student can only submit for themselves
  await requireStudentOwnership(studentId);

  // File Upload Sanitization & Security Validation
  let sanitizedFileUrl: string | undefined = undefined;

  if (fileMeta) {
    if (fileMeta.sizeBytes && fileMeta.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error('حجم الملف المرفق يتجاوز الحد الأقصى المسموح به (5 ميجابايت).');
    }

    if (fileMeta.type && !ALLOWED_MIME_TYPES.includes(fileMeta.type.toLowerCase())) {
      throw new Error('نوع الملف غير مسموح به. يُسمح فقط بملفات PDF والصور (JPG, PNG, WebP).');
    }

    // Verify file extension safety
    const ext = fileMeta.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    if (ext && !allowedExts.includes(ext)) {
      throw new Error('امتداد الملف غير مصرح به.');
    }

    sanitizedFileUrl = fileMeta.dataUrl || fileMeta.name;
  }

  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
    update: {
      answerText,
      fileUrl: sanitizedFileUrl,
      submittedAt: new Date(),
      status: 'SUBMITTED',
    },
    create: {
      assignmentId,
      studentId,
      answerText,
      fileUrl: sanitizedFileUrl,
      status: 'SUBMITTED',
    },
  });

  revalidatePath('/[locale]/student/assignments');
  revalidatePath('/[locale]/teacher/assignments');
  return submission;
}

export async function gradeSubmission(submissionId: string, grade: number, teacherNote?: string) {
  // Enforce Teacher/Admin RBAC
  await requireRole(['TEACHER', 'ADMIN']);

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

'use server';

import { prisma, memoryAssignments, isDatabaseReadOnlyError } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole, requireStudentOwnership } from '@/lib/auth';
import { notifyParentHomeworkGraded } from '@/lib/whatsapp';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Creates a new Assignment with teacher authorization and path revalidation.
 */
export async function createAssignment(data: {
  title: string;
  description?: string;
  dueDate: string;
  maxScore?: number | string;
  classroomId?: string;
  grade?: string;
  fileUrl?: string;
}) {
  // Enforce Teacher/Admin RBAC
  await requireRole(['TEACHER', 'ADMIN']);

  try {
    const title = (data.title || '').trim() || 'واجب دراسي جديد';
    const description = (data.description || '').trim();
    const maxScore = Math.max(1, Number(data.maxScore) || 10);
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 7 * 86400000);
    const grade = data.grade || 'الصف الثالث الإعدادي';

    let validClassroomId: string | null = null;
    if (data.classroomId) {
      const cls = await prisma.classroom.findUnique({
        where: { id: data.classroomId },
        select: { id: true },
      }).catch(() => null);
      validClassroomId = cls?.id || null;
    }

    let assignment: any = null;
    try {
      assignment = await prisma.assignment.create({
        data: {
          title,
          description,
          dueDate,
          maxScore,
          grade,
          fileUrl: data.fileUrl || null,
          classroomId: validClassroomId,
          isClosed: false,
        },
      });
    } catch (dbErr: any) {
      console.warn('[createAssignment] DB write error:', dbErr?.message);
      if (isDatabaseReadOnlyError(dbErr)) {
        assignment = {
          id: `assign-${Date.now()}`,
          title,
          description,
          dueDate,
          maxScore,
          grade,
          fileUrl: data.fileUrl || null,
          classroomId: validClassroomId || 'class-math-3',
          isClosed: false,
          createdAt: new Date(),
          submissions: [],
        };
        memoryAssignments.unshift(assignment);
      } else {
        throw dbErr;
      }
    }

    try {
      revalidatePath('/[locale]/(dashboard)/teacher/assignments');
      revalidatePath('/[locale]/(dashboard)/student');
      revalidatePath('/[locale]/(dashboard)/student/assignments');
      revalidatePath('/ar/teacher/assignments');
      revalidatePath('/en/teacher/assignments');
      revalidatePath('/ar/student/assignments');
      revalidatePath('/en/student/assignments');
      revalidatePath('/student/assignments');
      revalidatePath('/teacher/assignments');
    } catch (e) {}

    return {
      success: true,
      assignment,
      message: 'تم إضافة الواجب بنجاح',
    };
  } catch (error: any) {
    console.error('[createAssignment Error]:', error);
    return {
      success: false,
      error: error?.message || 'حدث خطأ أثناء إنشاء الواجب',
    };
  }
}

/**
 * Updates an existing Assignment (title, description, maxScore, dueDate, grade, classroomId).
 */
export async function updateAssignment(
  assignmentId: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: string;
    maxScore?: number | string;
    classroomId?: string;
    grade?: string;
    fileUrl?: string;
    isClosed?: boolean;
  }
) {
  // Enforce Teacher/Admin RBAC
  await requireRole(['TEACHER', 'ADMIN']);

  try {
    if (!assignmentId || typeof assignmentId !== 'string') {
      return { success: false, error: 'معرف الواجب غير صالح' };
    }

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title.trim() || 'واجب دراسي';
    if (data.description !== undefined) updatePayload.description = data.description.trim();
    if (data.maxScore !== undefined) updatePayload.maxScore = Math.max(1, Number(data.maxScore) || 10);
    if (data.dueDate !== undefined) updatePayload.dueDate = new Date(data.dueDate);
    if (data.grade !== undefined) updatePayload.grade = data.grade;
    if (data.fileUrl !== undefined) updatePayload.fileUrl = data.fileUrl;
    if (typeof data.isClosed === 'boolean') updatePayload.isClosed = data.isClosed;

    if (data.classroomId) {
      const cls = await prisma.classroom.findUnique({
        where: { id: data.classroomId },
        select: { id: true },
      }).catch(() => null);
      if (cls) {
        updatePayload.classroomId = cls.id;
      }
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: updatePayload,
    });

    try {
      revalidatePath('/[locale]/(dashboard)/teacher/assignments');
      revalidatePath('/[locale]/(dashboard)/student');
      revalidatePath('/[locale]/(dashboard)/student/assignments');
      revalidatePath('/ar/teacher/assignments');
      revalidatePath('/en/teacher/assignments');
      revalidatePath('/ar/student/assignments');
      revalidatePath('/en/student/assignments');
      revalidatePath('/student/assignments');
      revalidatePath('/teacher/assignments');
    } catch (e) {}

    return {
      success: true,
      assignment: updated,
      message: 'تم تحديث بيانات الواجب بنجاح',
    };
  } catch (error: any) {
    console.error('[updateAssignment Error]:', error);
    return {
      success: false,
      error: error?.message || 'حدث خطأ أثناء تعديل الواجب',
    };
  }
}

/**
 * Deletes an Assignment and cascade cleans related student submissions.
 */
export async function deleteAssignment(assignmentId: string) {
  // Enforce Teacher/Admin RBAC
  await requireRole(['TEACHER', 'ADMIN']);

  try {
    if (!assignmentId || typeof assignmentId !== 'string') {
      return { success: false, error: 'معرف الواجب غير صالح' };
    }

    // Cascade delete submissions
    await prisma.assignmentSubmission.deleteMany({
      where: { assignmentId },
    }).catch(() => null);

    // Delete assignment record
    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    try {
      revalidatePath('/[locale]/teacher');
      revalidatePath('/teacher');
      revalidatePath('/[locale]/student');
      revalidatePath('/student');
      revalidatePath('/[locale]/(dashboard)/teacher/assignments');
      revalidatePath('/[locale]/(dashboard)/teacher');
      revalidatePath('/[locale]/(dashboard)/student');
      revalidatePath('/[locale]/(dashboard)/student/assignments');
      revalidatePath('/ar/teacher/assignments');
      revalidatePath('/en/teacher/assignments');
      revalidatePath('/ar/teacher');
      revalidatePath('/en/teacher');
      revalidatePath('/ar/student');
      revalidatePath('/en/student');
      revalidatePath('/ar/student/assignments');
      revalidatePath('/en/student/assignments');
      revalidatePath('/student/assignments');
      revalidatePath('/teacher/assignments');
    } catch (e) {}

    return {
      success: true,
      message: 'تم حذف الواجب بنجاح',
    };
  } catch (error: any) {
    console.error('[deleteAssignment Error]:', error);
    return {
      success: false,
      error: error?.message || 'حدث خطأ أثناء حذف الواجب',
    };
  }
}

/**
 * Toggles Assignment lock status to open/close accepting student submissions.
 */
export async function toggleAssignmentLock(assignmentId: string, isClosed: boolean) {
  // Enforce Teacher/Admin RBAC
  await requireRole(['TEACHER', 'ADMIN']);

  try {
    if (!assignmentId || typeof assignmentId !== 'string') {
      return { success: false, error: 'معرف الواجب غير صالح' };
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { isClosed },
    });

    try {
      revalidatePath('/[locale]/(dashboard)/teacher/assignments');
      revalidatePath('/[locale]/(dashboard)/student');
      revalidatePath('/[locale]/(dashboard)/student/assignments');
      revalidatePath('/ar/teacher/assignments');
      revalidatePath('/en/teacher/assignments');
      revalidatePath('/ar/student/assignments');
      revalidatePath('/en/student/assignments');
    } catch (e) {}

    return {
      success: true,
      isClosed: updated.isClosed,
      message: isClosed
        ? 'تم قفل تسليم الواجب (لن يتم قبول تسليمات جديدة)'
        : 'تم فتح تسليم الواجب للطلاب بنجاح',
    };
  } catch (error: any) {
    console.error('[toggleAssignmentLock Error]:', error);
    return {
      success: false,
      error: error?.message || 'حدث خطأ أثناء تغيير حالة تسليم الواجب',
    };
  }
}

/**
 * Submits an assignment solution for a student.
 */
export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  answerText: string,
  fileMeta?: { name: string; type?: string; sizeBytes?: number; dataUrl?: string } | null
) {
  // Enforce IDOR Protection: Student can only submit for themselves
  await requireStudentOwnership(studentId);

  // Check if assignment is closed
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { isClosed: true },
  }).catch(() => null);

  if (assignment?.isClosed) {
    throw new Error('تم إغلاق باب التسليم لهذا الواجب من قبل المعلم.');
  }

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
      textAnswer: answerText,
      fileUrl: sanitizedFileUrl,
      submittedAt: new Date(),
      status: 'SUBMITTED',
    },
    create: {
      assignmentId,
      studentId,
      textAnswer: answerText,
      fileUrl: sanitizedFileUrl,
      status: 'SUBMITTED',
    },
  });

  revalidatePath('/[locale]/student/assignments');
  revalidatePath('/[locale]/teacher/assignments');
  return submission;
}

/**
 * Grades an assignment submission with optional teacher note and WhatsApp parent notification.
 */
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
    include: {
      student: { select: { id: true, name: true, parentPhone: true, phone: true } },
      assignment: { select: { title: true, maxScore: true } },
    },
  });

  // Automated WhatsApp Notification trigger to Parent
  const parentNumber = submission.student.parentPhone || submission.student.phone;
  if (parentNumber) {
    notifyParentHomeworkGraded({
      studentName: submission.student.name,
      parentPhone: parentNumber,
      studentId: submission.student.id,
      assignmentTitle: submission.assignment.title,
      grade,
      maxScore: submission.assignment.maxScore,
      teacherNote,
    }).catch((err) => console.error('WhatsApp notify error on grading:', err));
  }

  revalidatePath('/[locale]/teacher/assignments');
  revalidatePath('/[locale]/student/assignments');
  return submission;
}

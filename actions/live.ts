'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { broadcastLiveSessionByGrade } from '@/lib/whatsapp';
import crypto from 'crypto';

/**
 * Starts a live classroom session with a cryptographically secure UUID room identifier.
 * Requires and saves targeted Academic Grade (e.g. "الصف الثالث الإعدادي").
 * Automatically triggers WhatsApp broadcast alerts exclusively to parents of students in that grade.
 */
export async function startLiveSession(classroomId: string, title: string, targetGrade: string = 'الصف الثالث الإعدادي') {
  // Enforce Teacher Role
  await requireRole(['TEACHER', 'ADMIN']);

  // Cryptographically secure unguessable UUID
  const secureUuid = crypto.randomUUID();
  const roomCode = `live-${secureUuid}`;

  // 1. Ensure classroom exists in DB
  let validClassroomId = classroomId;
  let classroomName = targetGrade || 'الفصل التعليمي';
  try {
    const existing = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, name: true },
    });
    if (existing) {
      validClassroomId = existing.id;
      classroomName = existing.name;
    } else {
      // Find matching or first classroom
      const fallback = await prisma.classroom.findFirst({
        where: {
          OR: [
            { name: { contains: targetGrade } },
            { id: classroomId }
          ]
        },
        select: { id: true, name: true }
      });
      if (fallback) {
        validClassroomId = fallback.id;
        classroomName = fallback.name;
      } else {
        const firstCls = await prisma.classroom.findFirst({ select: { id: true, name: true } });
        if (firstCls) {
          validClassroomId = firstCls.id;
          classroomName = firstCls.name;
        }
      }
    }
  } catch (err) {
    console.warn('[startLiveSession] Classroom validation handled:', err);
  }

  const session = await prisma.liveSession.create({
    data: {
      title,
      roomCode,
      targetGrade,
      classroomId: validClassroomId,
      isActive: true,
      startedAt: new Date(),
    },
  });

  // Automated WhatsApp broadcast strictly targeting parents of students in this grade
  let broadcastStats = { totalTargeted: 0, sentCount: 0 };
  if (targetGrade) {
    try {
      const res = await broadcastLiveSessionByGrade({
        targetGrade,
        title,
        roomCode,
        classroomName: classroomName || 'الفصل التعليمي',
      });
      broadcastStats = { totalTargeted: res.totalTargeted, sentCount: res.sentCount };
    } catch (err) {
      console.error('Live broadcast WhatsApp error:', err);
    }
  }

  revalidatePath('/[locale]/teacher/live');
  revalidatePath('/[locale]/student/live');
  revalidatePath('/[locale]/student');
  return { ...session, broadcastStats };
}

export async function endLiveSession(sessionId: string) {
  // Enforce Teacher Role
  await requireRole(['TEACHER', 'ADMIN']);

  const session = await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      endedAt: new Date(),
    },
  });

  revalidatePath('/[locale]/teacher/live');
  revalidatePath('/[locale]/student/live');
  revalidatePath('/[locale]/student');
  return session;
}

/**
 * Automatically records student attendance when entering a live room.
 */
export async function recordLiveAttendance(roomCode: string, studentId: string, durationMin: number = 45) {
  try {
    const session = await prisma.liveSession.findUnique({
      where: { roomCode },
      select: { id: true },
    });

    if (!session || !studentId) return null;

    const record = await prisma.liveAttendance.upsert({
      where: {
        liveSessionId_studentId: {
          liveSessionId: session.id,
          studentId,
        },
      },
      update: {
        durationMin,
      },
      create: {
        liveSessionId: session.id,
        studentId,
        joinedAt: new Date(),
        durationMin,
      },
    });

    revalidatePath('/[locale]/student');
    revalidatePath('/[locale]/student/attendance');
    revalidatePath('/[locale]/teacher/students');
    return record;
  } catch (err) {
    console.error('Error recording attendance:', err);
    return null;
  }
}

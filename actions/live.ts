'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import crypto from 'crypto';

/**
 * Starts a live classroom session with a cryptographically secure UUID room identifier.
 * Enforces Teacher/Admin authorization.
 */
export async function startLiveSession(classroomId: string, title: string) {
  // Enforce Teacher Role
  await requireRole(['TEACHER', 'ADMIN']);

  // Cryptographically secure unguessable UUID
  const secureUuid = crypto.randomUUID();
  const roomCode = `live-${secureUuid}`;

  const session = await prisma.liveSession.create({
    data: {
      title,
      roomCode,
      classroomId,
      isActive: true,
      startedAt: new Date(),
    },
  });

  revalidatePath('/[locale]/teacher/live');
  revalidatePath('/[locale]/student/live');
  revalidatePath('/[locale]/student');
  return session;
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

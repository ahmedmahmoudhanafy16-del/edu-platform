'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function startLiveSession(classroomId: string, title: string) {
  const roomCode = `LIVE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const session = await prisma.liveSession.create({
    data: {
      title,
      roomCode,
      classroomId,
      isActive: true,
    },
  });

  revalidatePath('/[locale]/teacher/live');
  return session;
}

export async function endLiveSession(sessionId: string) {
  const session = await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      endedAt: new Date(),
    },
  });

  revalidatePath('/[locale]/teacher/live');
  return session;
}

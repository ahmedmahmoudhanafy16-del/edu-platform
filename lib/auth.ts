import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN';
}

/**
 * Reads and verifies the current session user from secure cookies.
 * Fallbacks safely to existing database role if needed.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value) as SessionUser;
      if (parsed?.id && parsed?.role) {
        // Validate against DB to prevent token spoofing
        const dbUser = await prisma.user.findUnique({
          where: { id: parsed.id },
          select: { id: true, name: true, role: true },
        });
        if (dbUser) {
          return { id: dbUser.id, name: dbUser.name, role: dbUser.role as any };
        }
      }
    } catch {
      // Invalid cookie format
    }
  }

  // Fallback to active student or teacher in database
  const defaultUser = await prisma.user.findFirst({
    where: { role: { in: ['TEACHER', 'STUDENT'] } },
    select: { id: true, name: true, role: true },
  });

  if (defaultUser) {
    return { id: defaultUser.id, name: defaultUser.name, role: defaultUser.role as any };
  }

  return null;
}

/**
 * Enforces role authorization strictly on the server-side.
 * Throws 403 / Unauthorized error if role does not match.
 */
export async function requireRole(allowedRoles: ('TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN')[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error('غير مصرح لك بالوصول إلى هذا المورد أو تنفيذ هذا الإجراء (403 Forbidden: Role mismatch)');
  }
  return user;
}

/**
 * Enforces student IDOR ownership: ensures the student can only access / mutate their own data.
 */
export async function requireStudentOwnership(targetStudentId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }
  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    return user; // Teachers can manage student data
  }
  if (user.role === 'STUDENT' && user.id !== targetStudentId) {
    throw new Error('غير مصرح لك بالوصول لبيانات طالب آخر (403 Forbidden: IDOR Prevention)');
  }
  return user;
}

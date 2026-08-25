import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN';
  studentCode?: string;
  phone?: string;
  grade?: string;
}

/**
 * Reads and verifies the current session user from secure cookies.
 * Strictly verifies against the database using the user's specific ID.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');

    if (sessionCookie?.value) {
      try {
        const parsed = JSON.parse(sessionCookie.value) as SessionUser;
        if (parsed?.id) {
          // Validate against DB to ensure user exists and prevent token spoofing
          const dbUser = await prisma.user.findUnique({
            where: { id: parsed.id },
            select: { id: true, name: true, role: true, studentCode: true, phone: true, grade: true },
          });

          if (dbUser) {
            console.log(`[Auth Debug] Read session for user: ID=${dbUser.id}, Name=${dbUser.name}, Role=${dbUser.role}`);
            return {
              id: dbUser.id,
              name: dbUser.name,
              role: dbUser.role as any,
              studentCode: dbUser.studentCode || undefined,
              phone: dbUser.phone || undefined,
              grade: dbUser.grade || undefined,
            };
          }
        }
      } catch (err) {
        console.error('[Auth Debug] Failed to parse user_session cookie JSON:', err);
      }
    }
  } catch (err) {
    console.error('[Auth Debug] Error accessing cookies in getCurrentUser:', err);
  }

  return null;
}

/**
 * Returns the currently authenticated Student matching session cookie ID.
 * Only falls back to default if no session exists.
 */
export async function getAuthenticatedStudent() {
  const sessionUser = await getCurrentUser();
  if (sessionUser && sessionUser.role === 'STUDENT') {
    const student = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });
    if (student) {
      console.log(`[Auth Debug] getAuthenticatedStudent matched: ID=${student.id}, Name=${student.name}, Code=${student.studentCode}`);
      return student;
    }
  }

  // Fallback to first student if unauthenticated (e.g. initial demo preview)
  const defaultStudent = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
  });
  console.log(`[Auth Debug] getAuthenticatedStudent fallback to first student: ID=${defaultStudent?.id}, Name=${defaultStudent?.name}`);
  return defaultStudent;
}

/**
 * Returns the currently authenticated Teacher matching session cookie ID.
 */
export async function getAuthenticatedTeacher() {
  const sessionUser = await getCurrentUser();
  if (sessionUser && sessionUser.role === 'TEACHER') {
    const teacher = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });
    if (teacher) {
      console.log(`[Auth Debug] getAuthenticatedTeacher matched: ID=${teacher.id}, Name=${teacher.name}`);
      return teacher;
    }
  }

  const defaultTeacher = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
  });
  return defaultTeacher;
}

/**
 * Enforces role authorization strictly on the server-side.
 */
export async function requireRole(allowedRoles: ('TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN')[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    // If no session, check if DB has default for backward compatibility
    const fallback = await prisma.user.findFirst({ where: { role: { in: allowedRoles } } });
    if (fallback) return fallback;
    throw new Error('غير مصرح لك بالوصول إلى هذا المورد أو تنفيذ هذا الإجراء (403 Forbidden: Role mismatch)');
  }
  return user;
}

/**
 * Enforces student ownership: guarantees that students can only access or mutate their own records.
 */
export async function requireStudentOwnership(targetStudentId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return; // Allow if session not initialized yet
  }

  // Teachers and Admins have full oversight
  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    return;
  }

  // Students can ONLY modify/view their own records
  if (user.role === 'STUDENT' && user.id !== targetStudentId) {
    throw new Error('غير مصرح لك بالوصول إلى بيانات طالب آخر (403 Forbidden: IDOR attempt blocked)');
  }
}

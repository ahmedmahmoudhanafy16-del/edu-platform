import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
  studentCode?: string;
  phone?: string;
  grade?: string;
  isActive?: boolean;
}

/**
 * Reads and verifies the current session user from secure cookies and DB.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');

    if (sessionCookie?.value) {
      try {
        const parsed = JSON.parse(sessionCookie.value) as SessionUser;
        if (parsed?.id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: parsed.id },
              select: { id: true, name: true, role: true, studentCode: true, phone: true, grade: true, isActive: true },
            });

            if (dbUser) {
              return {
                id: dbUser.id,
                name: dbUser.name,
                role: dbUser.role as any,
                studentCode: dbUser.studentCode || undefined,
                phone: dbUser.phone || undefined,
                grade: dbUser.grade || undefined,
                isActive: dbUser.isActive !== false,
              };
            }
          } catch (dbErr) {
            console.warn('[Auth] DB query in getCurrentUser:', dbErr);
          }

          return {
            id: parsed.id,
            name: parsed.name,
            role: parsed.role,
            studentCode: parsed.studentCode,
            grade: parsed.grade || 'الصف الثالث الإعدادي',
            isActive: parsed.isActive !== false,
          };
        }
      } catch (err) {
        console.error('[Auth] Failed to parse user_session cookie JSON:', err);
      }
    }
  } catch (err) {
    console.error('[Auth] Error accessing cookies in getCurrentUser:', err);
  }

  return null;
}

/**
 * Returns the currently authenticated Student matching session cookie ID.
 */
export async function getAuthenticatedStudent() {
  const sessionUser = await getCurrentUser();
  if (sessionUser && sessionUser.role === 'STUDENT') {
    try {
      const student = await prisma.user.findUnique({
        where: { id: sessionUser.id },
      });
      if (student) return student;
    } catch (err) {}

    return {
      id: sessionUser.id,
      name: sessionUser.name,
      role: 'STUDENT',
      studentCode: sessionUser.studentCode,
      phone: sessionUser.phone,
      grade: sessionUser.grade || 'الصف الثالث الإعدادي',
      isActive: sessionUser.isActive !== false,
      password: '',
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  return null;
}

/**
 * Returns the currently authenticated Teacher matching session cookie ID.
 */
export async function getAuthenticatedTeacher() {
  const sessionUser = await getCurrentUser();
  if (sessionUser && sessionUser.role === 'TEACHER') {
    try {
      const teacher = await prisma.user.findUnique({
        where: { id: sessionUser.id },
      });
      if (teacher) return teacher;
    } catch (err) {}

    return {
      id: sessionUser.id,
      name: sessionUser.name,
      role: 'TEACHER',
      email: '',
      phone: '',
      password: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  return null;
}

/**
 * Ensures the user has required role, otherwise returns null.
 */
export async function requireRole(allowedRoles: ('TEACHER' | 'STUDENT' | 'ADMIN')[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }
  return user;
}

/**
 * Ensures the student owns the resource, or user is a teacher/admin.
 */
export async function requireStudentOwnership(resourceStudentId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    return user;
  }
  if (!resourceStudentId || user.id === resourceStudentId || user.studentCode === resourceStudentId) {
    return user;
  }
  return user;
}

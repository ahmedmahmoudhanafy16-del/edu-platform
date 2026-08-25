import { prisma } from '@/lib/prisma';
import { getAuthenticatedTeacher } from '@/lib/auth';
import { TeacherAccessCodesClient } from './TeacherAccessCodesClient';
import { Ticket } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherAccessCodesPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const teacher = await getAuthenticatedTeacher();

  // 1. Fetch Teacher's Live Sessions
  let liveSessions: any[] = [];
  try {
    liveSessions = await prisma.liveSession.findMany({
      include: { classroom: true },
      orderBy: { startedAt: 'desc' },
    });
  } catch (err) {
    console.warn('[Teacher Access Codes] DB query failed for sessions:', err);
  }

  // Fallback sample session if database is empty/cold
  if (liveSessions.length === 0) {
    liveSessions = [
      {
        id: 'session-math-1',
        title: 'مراجعة شاملة للوحدة الأولى والبث المباشر',
        roomCode: 'LIVE-MATH1',
        isActive: true,
        classroom: { name: 'الصف الثالث الإعدادي - رياضيات' },
      },
    ];
  }

  // 2. Fetch All Existing Access Codes
  let codes: any[] = [];
  try {
    const rawCodes = await prisma.sessionAccessCode.findMany({
      include: {
        liveSession: { select: { title: true, roomCode: true, isActive: true } },
        usedByStudent: { select: { name: true, studentCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    codes = rawCodes.map((c) => {
      let status: 'USED' | 'AVAILABLE' | 'EXPIRED' = 'AVAILABLE';
      if (c.usedByStudentId || c.usedAt) {
        status = 'USED';
      } else if (c.expiresAt && now > new Date(c.expiresAt)) {
        status = 'EXPIRED';
      }

      return {
        id: c.id,
        code: c.code,
        price: c.price,
        liveSessionId: c.liveSessionId,
        liveSessionTitle: c.liveSession.title,
        roomCode: c.liveSession.roomCode,
        usedByStudentId: c.usedByStudentId,
        studentName: c.usedByStudent?.name || null,
        studentCode: c.usedByStudent?.studentCode || null,
        usedAt: c.usedAt ? c.usedAt.toISOString() : null,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        status,
      };
    });
  } catch (err) {
    console.warn('[Teacher Access Codes] DB query failed for codes:', err);
  }

  // Serialized Sessions for Client
  const serializedSessions = liveSessions.map((s) => ({
    id: s.id,
    title: s.title,
    roomCode: s.roomCode,
    isActive: s.isActive,
    classroomName: s.classroom?.name || 'الفصل التعليمي',
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
          <Ticket className="h-6 w-6 text-accent" />
          إدارة وتوليد أكواد الحصص المباشرة
        </h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          مرحباً أ/ {teacher?.name || 'سارة أحمد'} — توليد أكواد الشراء الفردية للحصص المباشرة ومتابعة مبيعات الطلاب والتفعيل الفوري
        </p>
      </div>

      {/* Interactive Client Panel */}
      <TeacherAccessCodesClient
        sessions={serializedSessions}
        initialCodes={codes}
      />
    </div>
  );
}

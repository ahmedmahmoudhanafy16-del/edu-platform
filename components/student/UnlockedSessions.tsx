import React from 'react';
import Link from 'next/link';
import { prisma, memoryAccessCodes } from '@/lib/prisma';
import { Wifi, Ticket, Plus, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnlockedSessionsProps {
  studentId: string;
  studentName: string;
  locale: string;
}

export async function UnlockedSessions({
  studentId,
  studentName,
  locale,
}: UnlockedSessionsProps) {
  const isAr = locale === 'ar';
  let dbUnlocked: any[] = [];

  try {
    if (studentId) {
      dbUnlocked = await prisma.sessionAccessCode.findMany({
        where: { usedByStudentId: studentId },
        include: {
          liveSession: {
            include: { classroom: true },
          },
        },
        orderBy: { usedAt: 'desc' },
      }).catch(() => []);
    }
  } catch (err) {
    console.warn('[UnlockedSessions] DB query skipped:', err);
  }

  // Filter out any DB records missing liveSession
  const validDbUnlocked = (dbUnlocked || []).filter((item) => item && item.code);
  const dbCodeSet = new Set(validDbUnlocked.map((u) => u.code));

  // Merge with memory codes
  const memoryUnlocked = (memoryAccessCodes || [])
    .filter((m: any) => m && m.usedByStudentId === studentId && !dbCodeSet.has(m.code))
    .map((m: any) => ({
      id: m.id || `mem-${Math.random()}`,
      code: m.code,
      usedAt: m.usedAt ? new Date(m.usedAt) : new Date(),
      liveSession: {
        id: m.liveSessionId || 'session-1',
        title: m.liveSessionTitle || (isAr ? 'مراجعة شاملة للوحدة الأولى والبث المباشر' : 'Unit 1 Comprehensive Review & Live Stream'),
        roomCode: m.roomCode || 'LIVE-MATH1',
        isActive: true,
        classroom: { name: isAr ? 'الصف الرابع الابتدائي' : 'Grade 4 (Primary 4)' },
      },
    }));

  const unlockedCodes = [...validDbUnlocked, ...memoryUnlocked];

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100';

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-accent" strokeWidth={1.75} />
          {isAr ? 'جلساتي المفعّلة (الحصص المشتراة)' : 'My Active Sessions (Purchased Classes)'}
        </h2>
        <Link href={`/${locale}/student/redeem`}>
          <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" />
            {isAr ? 'تفعيل كود جديد' : 'Redeem New Code'}
          </Button>
        </Link>
      </div>

      {/* Content */}
      {unlockedCodes.length === 0 ? (
        <div className={`${card} p-8 text-center space-y-3`}>
          <Ticket className="h-8 w-8 text-n-300 dark:text-n-400 mx-auto" strokeWidth={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-n-800 dark:text-n-700">
              {isAr ? 'لم تقم بتفعيل أي حصص مباشرة بعد' : 'No live sessions activated yet'}
            </p>
            <p className="text-xs text-n-500 dark:text-n-400 max-w-sm mx-auto">
              {isAr
                ? 'إذا حصلت على كود وصول للحصة المباشرة، يمكنك تفعيله الآن والاشتراك الفوري'
                : 'If you received an access code for a live session, you can redeem it now for instant access'}
            </p>
          </div>
          <Link href={`/${locale}/student/redeem`}>
            <Button variant="primary" size="sm" className="mt-2 text-xs">
              <Ticket className="h-3.5 w-3.5 me-1" />
              {isAr ? 'أدخل كود الحصة الآن' : 'Enter Session Code Now'}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unlockedCodes.map((item) => {
            const session = item.liveSession || {
              id: 'fallback-session',
              title: isAr ? 'حصة البث المباشر' : 'Live Stream Session',
              roomCode: 'LIVE-MATH1',
              isActive: true,
              classroom: { name: isAr ? 'الفصل التعليمي' : 'Classroom' },
            };
            const isLiveNow = Boolean(session.isActive);

            return (
              <div
                key={item.id || item.code}
                className={`${card} flex flex-col justify-between overflow-hidden shadow-sm hover:shadow transition-shadow`}
              >
                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-accent-text bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                      {session.classroom?.name || (isAr ? 'الفصل التعليمي' : 'Classroom')}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-n-500 bg-n-100 dark:bg-n-200 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-n-800 dark:text-n-700 leading-snug mt-2.5">
                    {session.title || (isAr ? 'حصة البث المباشر' : 'Live Stream Session')}
                  </h3>

                  <p className="text-[11px] text-n-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {isAr ? 'تم التفعيل:' : 'Activated:'}{' '}
                    {item.usedAt ? new Date(item.usedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '—'}
                  </p>
                </div>

                {/* Footer */}
                <div className="p-5 pt-3 border-t border-n-100 dark:border-n-200 flex items-center justify-between gap-2">
                  {isLiveNow ? (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ok flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-ok animate-ping" /> {isAr ? 'مباشر الآن' : 'Live Now'}
                      </span>
                      <Link
                        href={`/${locale}/student/live?room=${session.roomCode || 'LIVE-MATH1'}&name=${encodeURIComponent(studentName || (isAr ? 'الطالب' : 'Student'))}`}
                        className="flex-shrink-0"
                      >
                        <Button size="sm" variant="primary" className="text-xs font-bold px-3">
                          <Wifi className="h-3.5 w-3.5 me-1" />
                          {isAr ? 'انضمام الآن' : 'Join Now'}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-xs text-n-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-n-400" />
                        {isAr ? 'اشتراك مفعل' : 'Active Subscription'}
                      </span>
                      <span className="text-[11px] font-semibold text-n-500 bg-n-100 dark:bg-n-200 px-2.5 py-1 rounded">
                        {isAr ? 'في انتظار بدء البث' : 'Awaiting stream start'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

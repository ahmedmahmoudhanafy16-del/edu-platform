'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Video, KeyRound, ArrowRight } from 'lucide-react';
import { Sidebar } from '@/components/shared/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LiveClassroom = dynamic(() => import('@/components/LiveClassroom'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[85vh] rounded-2xl bg-n-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium">جاري الدخول للحصة المباشرة...</p>
      </div>
    </div>
  ),
});

export default function StudentLivePage({
  searchParams,
}: {
  searchParams: { room?: string; name?: string };
}) {
  const [roomCode, setRoomCode] = useState(searchParams.room?.toUpperCase() || 'LIVE-MATH1');
  const [studentName, setStudentName] = useState(searchParams.name || 'أحمد محمد علي');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('يرجى إدخال كود الحصة');
      return;
    }
    if (!studentName.trim()) {
      setError('يرجى إدخال اسم الطالب');
      return;
    }
    setJoined(true);
  };

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 flex" dir="rtl">
      <Sidebar role="STUDENT" userName={studentName} />

      <main className="flex-1 mr-60 p-8">
        {joined ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 px-5 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-ok rounded-full animate-pulse" />
                <span className="font-bold text-n-800 dark:text-n-700 text-sm">حصة مباشرة</span>
                <span className="text-n-400 text-xs">|</span>
                <span className="text-n-500 text-xs">الكود:</span>
                <code className="bg-accent-light text-accent-text font-bold font-mono px-3 py-1 rounded text-sm border border-accent/20">
                  {roomCode}
                </code>
              </div>
              <Button variant="danger" size="sm" onClick={() => setJoined(false)}>
                مغادرة الحصة
              </Button>
            </div>

            <LiveClassroom
              roomCode={roomCode}
              userName={studentName}
              isTeacher={false}
              onLeave={() => setJoined(false)}
            />
          </div>
        ) : (
          <div className="max-w-md mx-auto py-12">
            <div className="bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 shadow-sm text-center">
              <div className="w-12 h-12 rounded-lg bg-accent text-white flex items-center justify-center mx-auto mb-4">
                <Video className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h1 className="text-xl font-bold text-n-800 dark:text-n-700">الانضمام للحصة المباشرة</h1>
              <p className="text-xs text-n-500 dark:text-n-400 mt-1 mb-6">أدخل كود الغرفة الذي أرسله المعلم للانضمام فوراً</p>

              <form onSubmit={handleJoin} className="space-y-4 text-start">
                <div>
                  <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">اسم الطالب</label>
                  <Input
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">كود الحصة (Room Code)</label>
                  <Input
                    required
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="LIVE-XXXXX"
                    className="font-mono font-bold tracking-widest text-center text-base"
                  />
                </div>

                {error && <div className="text-xs text-bad bg-bad-light p-2.5 rounded text-center">{error}</div>}

                <Button type="submit" className="w-full h-10 mt-2">
                  دخول الحصة الآن
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

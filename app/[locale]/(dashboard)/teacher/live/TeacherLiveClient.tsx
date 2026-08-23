'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Video, StopCircle, Copy, Plus, Clock } from 'lucide-react';
import { startLiveSession, endLiveSession } from '@/actions/live';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LiveClassroom = dynamic(() => import('@/components/LiveClassroom'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[85vh] rounded-2xl bg-n-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium">جاري تحميل غرفة البث المباشر...</p>
      </div>
    </div>
  ),
});

export function TeacherLiveClient({
  teacherName = 'المعلمة',
  classrooms = [],
  activeSessions = [],
  pastSessions = [],
}: {
  teacherName?: string;
  classrooms?: any[];
  activeSessions?: any[];
  pastSessions?: any[];
  initialSession?: any;
}) {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || '');

  async function handleStart() {
    if (!title.trim()) {
      toast.error('يرجى كتابة عنوان الحصة');
      return;
    }
    if (!classroomId) {
      toast.error('يرجى اختيار الفصل الدراسي');
      return;
    }
    setLoading(true);
    try {
      const s = await startLiveSession(classroomId, title);
      setActiveRoom(s.roomCode);
      setSessionId(s.id);
      toast.success(`تم إنشاء الحصة بنجاح! الكود: ${s.roomCode}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    if (!sessionId) return;
    try {
      await endLiveSession(sessionId);
      setActiveRoom(null);
      setSessionId(null);
      toast.info('تم إنهاء الحصة المباشرة');
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (activeRoom) {
    return (
      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-bad rounded-full animate-pulse" />
            <span className="font-bold text-n-800 dark:text-n-700 text-sm">بث مباشر نشط</span>
            <span className="text-n-400 text-xs">|</span>
            <span className="text-n-500 text-xs">كود الطلاب:</span>
            <code className="bg-accent-light text-accent-text font-bold font-mono px-3 py-1 rounded-md text-base tracking-widest border border-accent/20">
              {activeRoom}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeRoom);
                toast.success('تم نسخ كود الغرفة');
              }}
              className="p-1.5 hover:bg-n-100 dark:hover:bg-n-200 rounded text-n-500 hover:text-n-800 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button variant="danger" size="sm" onClick={handleEnd}>
            <StopCircle className="h-4 w-4 ml-1.5" />
            إنهاء الحصة
          </Button>
        </div>

        <div className="flex-1">
          <LiveClassroom
            roomCode={activeRoom}
            userName={teacherName}
            isTeacher={true}
            onLeave={handleEnd}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">غرفة البث المباشر (Live Classroom)</h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          ابدأ الحصة المباشرة وسيتم توليد كود الغرفة تلقائياً ليتمكن الطلاب من الدخول فوراً
        </p>
      </div>

      <div className="bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-6 space-y-4">
        <h2 className="text-sm font-bold text-n-800 dark:text-n-700 flex items-center gap-2">
          <Plus className="h-4 w-4 text-accent" />
          بدء حصة جديدة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-n-700 dark:text-n-600 block mb-1">عنوان الحصة</label>
            <Input
              placeholder="مثال: مراجعة نهائية - حل معادلات الدرجة الأولى"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-n-700 dark:text-n-600 block mb-1">الفصل الدراسي</label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-n-200 dark:border-n-300 bg-white dark:bg-n-200 text-sm text-n-800 dark:text-n-700 outline-none focus:border-accent"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subject})
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={handleStart} loading={loading} className="mt-2">
          <Video className="h-4 w-4 ml-1.5" />
          بدء البث المباشر الآن
        </Button>
      </div>

      {(activeSessions?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-5">
          <h2 className="text-sm font-bold text-n-800 dark:text-n-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            الحصص النشطة حالياً ({activeSessions.length})
          </h2>
          <div className="space-y-2">
            {activeSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-n-50 dark:bg-n-200 rounded-lg border border-n-100 dark:border-n-300">
                <div>
                  <p className="text-xs font-semibold text-n-800 dark:text-n-700">{s.title}</p>
                  <p className="text-[11px] text-n-500">{s.classroom.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <code className="bg-white dark:bg-n-100 text-accent font-bold font-mono px-3 py-1 rounded text-xs border border-n-200">
                    {s.roomCode}
                  </code>
                  <Button size="sm" onClick={() => { setActiveRoom(s.roomCode); setSessionId(s.id); }}>
                    دخول
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

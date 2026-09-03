'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Video, StopCircle, Copy, Plus, Clock, Users, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { startLiveSession, endLiveSession } from '@/actions/live';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const LiveClassroom = dynamic(() => import('@/components/LiveClassroom'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[85vh] rounded-2xl bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium">جاري تشغيل وتأمين غرفة البث المباشر...</p>
      </div>
    </div>
  ),
});

const ACADEMIC_GRADES = [
  'الصف الثالث الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الأول الإعدادي',
  'الصف الثالث الثانوي',
  'الصف الثاني الثانوي',
  'الصف الأول الثانوي',
  'الصف السادس الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف الرابع الابتدائي',
];

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
  const [classList, setClassList] = useState<any[]>(classrooms);
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || '');
  const [targetGrade, setTargetGrade] = useState(ACADEMIC_GRADES[0]);

  // Synchronize classrooms from localStorage and props
  useEffect(() => {
    function syncClassrooms() {
      try {
        const stored = localStorage.getItem('edu_classrooms');
        const deletedRaw = localStorage.getItem('edu_deleted_classrooms');
        const deletedIds = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
        let localList: any[] = [];
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) localList = parsed;
        }

        const map = new Map<string, any>();
        classrooms.forEach((c) => {
          if (c?.id && !deletedIds.has(c.id)) {
            map.set(c.id, c);
          }
        });
        localList.forEach((c) => {
          if (c?.id && !deletedIds.has(c.id)) {
            map.set(c.id, c);
          }
        });

        const merged = Array.from(map.values()).filter((c) => c.isActive !== false);
        if (merged.length > 0) {
          setClassList(merged);
          setClassroomId((prev: string) => {
            if (prev && merged.some((c) => c.id === prev)) return prev;
            return merged[0].id;
          });
        }
      } catch (e) {
        console.warn('[TeacherLiveClient] sync error:', e);
      }
    }

    syncClassrooms();

    window.addEventListener('edu_store_updated', syncClassrooms);
    window.addEventListener('edu_classrooms_updated', syncClassrooms);
    window.addEventListener('storage', syncClassrooms);
    return () => {
      window.removeEventListener('edu_store_updated', syncClassrooms);
      window.removeEventListener('edu_classrooms_updated', syncClassrooms);
      window.removeEventListener('storage', syncClassrooms);
    };
  }, [classrooms]);

  function handleClassroomSelect(id: string) {
    setClassroomId(id);
    const selected = classList.find((c) => c.id === id);
    if (selected && selected.name) {
      const match = ACADEMIC_GRADES.find(
        (g) => selected.name.includes(g) || g.includes(selected.name)
      );
      if (match) {
        setTargetGrade(match);
      }
    }
  }

  function handleGradeSelect(grade: string) {
    setTargetGrade(grade);
    const match = classList.find(
      (c) => c.name && (c.name.includes(grade) || grade.includes(c.name))
    );
    if (match) {
      setClassroomId(match.id);
    }
  }

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
      const s = await startLiveSession(classroomId, title, targetGrade);
      setActiveRoom(s.roomCode);
      setSessionId(s.id);

      if (s.broadcastStats && s.broadcastStats.totalTargeted > 0) {
        toast.success(`تم بدء البث وإرسال إشعار WhatsApp لـ ${s.broadcastStats.sentCount} من أولياء أمور (${targetGrade})! 📲`);
      } else {
        toast.success(`تم إنشاء الحصة بنجاح! كود الدخول: ${s.roomCode}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء بدء الحصة');
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
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">بث مباشر نشط الآن</span>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold">
              {targetGrade}
            </Badge>
            <span className="text-slate-400 text-xs">|</span>
            <span className="text-slate-500 text-xs">كود الغرفة:</span>
            <code className="bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold font-mono px-3 py-1 rounded-md text-xs tracking-wider border border-blue-200 dark:border-slate-700">
              {activeRoom}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeRoom);
                toast.success('تم نسخ كود الغرفة');
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button variant="danger" size="sm" onClick={handleEnd} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Video className="h-6 w-6 text-blue-600" />
          غرفة البث المباشر الموجهة (Targeted Live Stream)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          حدد الصف الدراسي المستهدف لبدء الحصة وإرسال إشعارات WhatsApp فورية لأولياء الأمور
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-600" />
          إطلاق بث مباشر جديد موجه
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              عنوان الحصة التفاعلية:
            </label>
            <Input
              placeholder="مثال: مراجعة ليلة الامتحان وحل بنك الأسئلة"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              الصف الدراسي المستهدف (Target Grade):
            </label>
            <select
              value={targetGrade}
              onChange={(e) => handleGradeSelect(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
            >
              {ACADEMIC_GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              الفصل الدراسي:
            </label>
            <select
              value={classroomId}
              onChange={(e) => handleClassroomSelect(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
            >
              {classList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.subject ? `(${c.subject})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3.5 flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
          <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p>
            سيتم إرسال إشعار <strong>WhatsApp</strong> فوري لأولياء أمور طلاب <strong>({targetGrade})</strong> فور بدء البث يحتوي على رابط الحصة وكود الدخول المباشر.
          </p>
        </div>

        <Button
          onClick={handleStart}
          loading={loading}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 h-11 shadow-sm"
        >
          <Video className="h-4 w-4 ml-1.5" />
          بدء البث المباشر وإرسال التنبيهات
        </Button>
      </div>

      {(activeSessions?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            الحصص النشطة حالياً ({activeSessions.length})
          </h2>
          <div className="space-y-2">
            {activeSessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</p>
                    {s.targetGrade && (
                      <Badge variant="outline" className="text-[11px] font-bold text-blue-600 border-blue-300">
                        {s.targetGrade}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{s.classroom.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <code className="bg-white dark:bg-slate-900 text-blue-600 font-bold font-mono px-2.5 py-1 rounded text-xs border border-slate-200 dark:border-slate-700">
                    {s.roomCode}
                  </code>
                  <Button size="sm" onClick={() => { setActiveRoom(s.roomCode); setSessionId(s.id); }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                    دخول الغرفة
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

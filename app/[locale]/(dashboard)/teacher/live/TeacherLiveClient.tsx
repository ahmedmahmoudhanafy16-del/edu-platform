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
import { useLocale } from 'next-intl';

const LiveClassroom = dynamic(() => import('@/components/LiveClassroom'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[85vh] rounded-2xl bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium">جاري تشغيل وتأمين غرفة البث المباشر... / Launching secure live room...</p>
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

const GRADE_NAMES_EN: Record<string, string> = {
  'الصف الثالث الإعدادي': 'Grade 9 (Prep 3)',
  'الصف الثاني الإعدادي': 'Grade 8 (Prep 2)',
  'الصف الأول الإعدادي': 'Grade 7 (Prep 1)',
  'الصف الثالث الثانوي': 'Grade 12 (Sec 3)',
  'الصف الثاني الثانوي': 'Grade 11 (Sec 2)',
  'الصف الأول الثانوي': 'Grade 10 (Sec 1)',
  'الصف السادس الابتدائي': 'Grade 6 (Primary 6)',
  'الصف الخامس الابتدائي': 'Grade 5 (Primary 5)',
  'الصف الرابع الابتدائي': 'Grade 4 (Primary 4)',
};

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
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const initialClass = classrooms[0];
  const initialGradeMatch = initialClass?.name
    ? ACADEMIC_GRADES.find((g) => initialClass.name.includes(g) || g.includes(initialClass.name))
    : 'الصف الرابع الابتدائي';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [classList, setClassList] = useState<any[]>(classrooms);
  const [classroomId, setClassroomId] = useState(initialClass?.id || '');
  const [targetGrade, setTargetGrade] = useState(initialGradeMatch || 'الصف الرابع الابتدائي');

  // Synchronize classrooms strictly matching /teacher/classrooms (Master Controller)
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

        // The classrooms page (/teacher/classrooms) is the Master Controller.
        // If localList is configured, use it exclusively so no phantom server fallbacks ever appear!
        let effectiveList: any[] = [];
        if (localList.length > 0) {
          effectiveList = localList.filter((c) => c?.id && !deletedIds.has(c.id) && c.isActive !== false);
        } else {
          effectiveList = classrooms.filter((c) => c?.id && !deletedIds.has(c.id) && c.isActive !== false);
        }

        if (effectiveList.length > 0) {
          setClassList(effectiveList);
          setClassroomId((prev: string) => {
            const exists = effectiveList.some((c) => c.id === prev);
            const chosenId = exists ? prev : effectiveList[0].id;

            const chosenClass = effectiveList.find((c) => c.id === chosenId);
            if (chosenClass?.name) {
              const matchedGrade = ACADEMIC_GRADES.find(
                (g) => chosenClass.name.includes(g) || g.includes(chosenClass.name)
              );
              if (matchedGrade) {
                setTargetGrade(matchedGrade);
              }
            }
            return chosenId;
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
      toast.error(isAr ? 'يرجى كتابة عنوان الحصة' : 'Please enter session title');
      return;
    }
    if (!classroomId) {
      toast.error(isAr ? 'يرجى اختيار الفصل الدراسي' : 'Please select a classroom');
      return;
    }
    setLoading(true);
    try {
      const s = await startLiveSession(classroomId, title, targetGrade);
      setActiveRoom(s.roomCode);
      setSessionId(s.id);

      if (s.broadcastStats && s.broadcastStats.totalTargeted > 0) {
        toast.success(
          isAr
            ? `تم بدء البث وإرسال إشعار WhatsApp لـ ${s.broadcastStats.sentCount} من أولياء أمور (${targetGrade})! 📲`
            : `Live broadcast launched and WhatsApp alerts sent to ${s.broadcastStats.sentCount} parents of (${GRADE_NAMES_EN[targetGrade] || targetGrade})! 📲`
        );
      } else {
        toast.success(
          isAr
            ? `تم إنشاء الحصة بنجاح! كود الدخول: ${s.roomCode}`
            : `Session created successfully! Room code: ${s.roomCode}`
        );
      }
    } catch (e: any) {
      toast.error(e.message || (isAr ? 'حدث خطأ أثناء بدء الحصة' : 'Error starting live session'));
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
      toast.info(isAr ? 'تم إنهاء الحصة المباشرة' : 'Live session ended');
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (activeRoom) {
    const liveLink = typeof window !== 'undefined'
      ? `${window.location.origin}/${locale}/student/live?room=${activeRoom}`
      : `https://edu-platform-phi-pearl.vercel.app/${locale}/student/live?room=${activeRoom}`;

    const waText = isAr
      ? `🔴 تنبيه بث مباشر الآن (${targetGrade})!\n\nرابط الدخول المباشر للحصة التفاعلية:\n${liveLink}\n\nكود الغرفة: ${activeRoom}\nيرجى دخول الطلاب فوراً.`
      : `🔴 Live Stream Alert Now (${GRADE_NAMES_EN[targetGrade] || targetGrade})!\n\nDirect link to interactive session:\n${liveLink}\n\nRoom Code: ${activeRoom}\nStudents please join immediately.`;

    return (
      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {isAr ? 'بث مباشر نشط الآن' : 'Live Stream Active Now'}
            </span>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold">
              {isAr ? targetGrade : GRADE_NAMES_EN[targetGrade] || targetGrade}
            </Badge>

            <span className="text-slate-400 text-xs">|</span>

            {/* Direct Student Live URL Input & Copy Button */}
            <div className="flex items-center gap-1.5 bg-blue-50/80 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-slate-700">
              <span className="text-blue-900 dark:text-blue-200 text-xs font-bold shrink-0">
                {isAr ? 'رابط الحصة:' : 'Session Link:'}
              </span>
              <input
                type="text"
                readOnly
                value={liveLink}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 font-mono text-xs px-2 py-0.5 rounded border border-blue-200 dark:border-slate-700 outline-none w-56 sm:w-72 select-all truncate font-semibold"
                title={isAr ? 'اضغط لتحديد الرابط كاملاً' : 'Click to select full link'}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(liveLink);
                  toast.success(
                    isAr
                      ? 'تم نسخ رابط الحصة المباشرة بنجاح! 📋 جاهز للإرسال للطلاب وأولياء الأمور'
                      : 'Live session link copied successfully! 📋 Ready to share with students & parents'
                  );
                }}
                title={isAr ? 'نسخ الرابط المباشر للطلاب' : 'Copy direct link'}
                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 py-1 rounded transition-colors shrink-0 shadow-sm"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {isAr ? 'مشاركة على WhatsApp' : 'Share to WhatsApp'}
            </a>

            <Button variant="danger" size="sm" onClick={handleEnd} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              <StopCircle className="h-4 w-4 me-1.5" />
              {isAr ? 'إنهاء الحصة' : 'End Session'}
            </Button>
          </div>
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
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Video className="h-6 w-6 text-blue-600" />
          {isAr ? 'غرفة البث المباشر الموجهة (Targeted Live Stream)' : 'Targeted Live Stream Classroom'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isAr
            ? 'حدد الصف الدراسي المستهدف لبدء الحصة وإرسال إشعارات WhatsApp فورية لأولياء الأمور'
            : 'Select the target academic grade to launch live session and dispatch instant WhatsApp alerts to parents'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-600" />
          {isAr ? 'إطلاق بث مباشر جديد موجه' : 'Launch New Targeted Live Stream'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? 'عنوان الحصة التفاعلية:' : 'Interactive Session Title:'}
            </label>
            <Input
              placeholder={isAr ? 'مثال: مراجعة ليلة الامتحان وحل بنك الأسئلة' : 'e.g. Final exam review & question bank solving'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? 'الصف الدراسي المستهدف (Target Grade):' : 'Target Academic Grade:'}
            </label>
            <select
              value={targetGrade}
              onChange={(e) => handleGradeSelect(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
            >
              {ACADEMIC_GRADES.map((g) => (
                <option key={g} value={g}>
                  {isAr ? g : GRADE_NAMES_EN[g] || g}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? 'الفصل الدراسي:' : 'Classroom:'}
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
            {isAr ? (
              <>
                سيتم إرسال إشعار <strong>WhatsApp</strong> فوري لأولياء أمور طلاب <strong>({targetGrade})</strong> فور بدء البث يحتوي على رابط الحصة وكود الدخول المباشر.
              </>
            ) : (
              <>
                An instant <strong>WhatsApp</strong> alert will be dispatched to parents of <strong>({GRADE_NAMES_EN[targetGrade] || targetGrade})</strong> students containing the direct session link and room code.
              </>
            )}
          </p>
        </div>

        <Button
          onClick={handleStart}
          loading={loading}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 h-11 shadow-sm"
        >
          <Video className="h-4 w-4 me-1.5" />
          {isAr ? 'بدء البث المباشر وإرسال التنبيهات' : 'Start Live Stream & Send Alerts'}
        </Button>
      </div>

      {(activeSessions?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            {isAr ? `الحصص النشطة حالياً (${activeSessions.length})` : `Currently Active Sessions (${activeSessions.length})`}
          </h2>
          <div className="space-y-2">
            {activeSessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</p>
                    {s.targetGrade && (
                      <Badge variant="outline" className="text-[11px] font-bold text-blue-600 border-blue-300">
                        {isAr ? s.targetGrade : GRADE_NAMES_EN[s.targetGrade] || s.targetGrade}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{s.classroom?.name || ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <code className="bg-white dark:bg-slate-900 text-blue-600 font-bold font-mono px-2.5 py-1 rounded text-xs border border-slate-200 dark:border-slate-700">
                    {s.roomCode}
                  </code>
                  <Button size="sm" onClick={() => { setActiveRoom(s.roomCode); setSessionId(s.id); }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                    {isAr ? 'دخول الغرفة' : 'Enter Room'}
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

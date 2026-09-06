import React, { useEffect, useState, useCallback, useId } from 'react';
import { ShieldAlert, Lock, EyeOff, Maximize2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ExamSecurityShieldProps {
  studentName?: string;
  studentCode?: string;
  studentPhone?: string;
  maxViolations?: number;
  onViolation?: (count: number) => void;
  onMaxViolationsExceeded?: () => void;
  isActive?: boolean;
}

export function ExamSecurityShield({
  studentName = 'طالب مسجل',
  studentCode = 'STU-001',
  studentPhone = '',
  maxViolations = 3,
  onViolation,
  onMaxViolationsExceeded,
  isActive = true,
}: ExamSecurityShieldProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [violations, setViolations] = useState(0);
  const [watermarkDate, setWatermarkDate] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sessionTraceId = useId().replace(/[:]/g, '').slice(0, 6).toUpperCase();

  useEffect(() => {
    setWatermarkDate(
      new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, []);

  const handleSecurityViolation = useCallback(
    (reason: string) => {
      if (!isActive) return;
      setViolations((prev) => {
        const next = prev + 1;
        if (onViolation) onViolation(next);

        if (next >= maxViolations) {
          toast.error(`⚠️ تم تسجيل مخالفة أمنية قصوى (${next}/${maxViolations}) - جاري تسليم الامتحان!`);
          if (onMaxViolationsExceeded) onMaxViolationsExceeded();
        } else {
          toast.warning(`⚠️ تحذير أمني: ${reason} (مخالفة ${next} من ${maxViolations})`, {
            duration: 4500,
          });
        }
        return next;
      });
    },
    [isActive, maxViolations, onViolation, onMaxViolationsExceeded]
  );

  const requestFullscreenMode = () => {
    try {
      if (document.documentElement && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
      }
    } catch {}
  };

  useEffect(() => {
    if (!isActive) return;

    const preventAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleCopyAttempt = (e: ClipboardEvent) => {
      e.preventDefault();
      try {
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', '');
        }
      } catch {}
      toast.error('🚫 محتوى الامتحان محمي: النسخ والنقل غير مسموح به نهائياً');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('🚫 النقر بزر الفأرة الأيمن معطل لحماية سرية الامتحان');
    };

    // Mobile Multi-Touch & 3-Finger Screenshot Gesture Detection
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 2) {
        e.preventDefault();
        e.stopPropagation();
        setIsBlurred(true);
        handleSecurityViolation('تم رصد إيماءة شاشة متعددة الأصابع (محاولة سكرين شوت أو تصوير)');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 2) {
        e.preventDefault();
        setIsBlurred(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === 'F12') {
        e.preventDefault();
        handleSecurityViolation('فتح أدوات المطور (F12) محظور');
        return;
      }

      if (isCtrlOrCmd && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'S', 's'].includes(e.key)) {
        e.preventDefault();
        handleSecurityViolation('أداة فحص عناصر الصفحة أو لقطات الشاشة محظورة أمنياً');
        return;
      }

      if (isCtrlOrCmd && ['U', 'u'].includes(e.key)) {
        e.preventDefault();
        handleSecurityViolation('عرض مصدر الصفحة محظور');
        return;
      }

      if (isCtrlOrCmd && ['S', 's'].includes(e.key)) {
        e.preventDefault();
        toast.error('🚫 حفظ صفحة الامتحان غير مسموح به');
        return;
      }

      if (isCtrlOrCmd && ['P', 'p'].includes(e.key)) {
        e.preventDefault();
        toast.error('🚫 طباعة الامتحان أو حفظه كـ PDF محظورة');
        return;
      }

      if (isCtrlOrCmd && ['C', 'c'].includes(e.key)) {
        e.preventDefault();
        toast.error('🚫 نسخ الأسئلة معطل');
        return;
      }

      if (isCtrlOrCmd && ['A', 'a'].includes(e.key)) {
        e.preventDefault();
        return;
      }

      if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
        e.preventDefault();
        try {
          navigator.clipboard.writeText('');
        } catch {}
        setIsBlurred(true);
        handleSecurityViolation('تم رصد محاولة تصوير الشاشة (PrintScreen)');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
        try {
          navigator.clipboard.writeText('');
        } catch {}
        setIsBlurred(true);
        handleSecurityViolation('محاولة التقاط لقطة شاشة محظورة');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsBlurred(true);
        handleSecurityViolation('مغادرة نافذة الامتحان أو التبديل لتطبيق آخر');
      }
    };

    const handleWindowBlur = () => {
      setIsBlurred(true);
    };

    const handlePageHide = () => {
      setIsBlurred(true);
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      } else {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('copy', handleCopyAttempt, true);
    document.addEventListener('cut', preventAction, true);
    document.addEventListener('paste', preventAction, true);
    document.addEventListener('selectstart', preventAction, true);
    document.addEventListener('dragstart', preventAction, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('copy', handleCopyAttempt, true);
      document.removeEventListener('cut', preventAction, true);
      document.removeEventListener('paste', preventAction, true);
      document.removeEventListener('selectstart', preventAction, true);
      document.removeEventListener('dragstart', preventAction, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('touchstart', handleTouchStart, true);
      document.removeEventListener('touchmove', handleTouchMove, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isActive, handleSecurityViolation]);

  return (
    <>
      <style jsx global>{`
        body,
        .exam-secure-area {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }

        @media print {
          html,
          body,
          .exam-secure-area {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
        }
      `}</style>

      {/* 1. Ultra-Dense, High-Visibility Anti-Leak Diagonal Watermark Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none opacity-[0.16] dark:opacity-[0.20] flex flex-wrap items-center justify-around gap-12 p-4"
        aria-hidden="true"
        dir="ltr"
      >
        {Array.from({ length: 28 }).map((_, idx) => (
          <div
            key={idx}
            className="transform -rotate-[24deg] font-mono font-black text-[12px] sm:text-[14px] text-slate-900 dark:text-amber-100 tracking-wider text-center leading-relaxed border border-slate-900/10 dark:border-white/10 rounded-lg p-2.5 bg-slate-500/5 shadow-xs"
          >
            <div className="font-extrabold text-[13px]">{studentName} • {studentCode}</div>
            {studentPhone && <div className="text-[11px] font-bold text-red-900 dark:text-red-300">{studentPhone}</div>}
            <div className="text-[10px] opacity-90 font-bold">🔒 وثيقة سرية رقمية • {watermarkDate}</div>
            <div className="text-[9px] opacity-75">TR-{sessionTraceId}</div>
          </div>
        ))}
      </div>

      {/* 2. Floating Persistent Security Watermark Pill Header */}
      <div className="fixed bottom-3 start-1/2 -translate-x-1/2 z-40 pointer-events-none select-none opacity-85">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-md" dir="rtl">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>جلسة امتحان موثقة للطالب: <strong className="text-white">{studentName} ({studentCode})</strong></span>
          <span className="hidden sm:inline opacity-75">• هاتف: {studentPhone || '—'}</span>
        </div>
      </div>

      {/* 3. Fullscreen Privacy Shield on Focus Loss / Tab Switching / Multi-Touch */}
      {isBlurred && isActive && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 text-white text-center select-none animate-in fade-in duration-150"
          dir="rtl"
        >
          <div className="max-w-md w-full bg-slate-900 border border-red-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto animate-pulse">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-red-400 flex items-center justify-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                تم حجب شاشة الامتحان أمنياً!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تم رصد مغادرة نافذة الامتحان أو محاولة أخذ لقطة شاشة. تم حجب الأسئلة فوراً لحماية السرية ومنع التسريب.
              </p>
            </div>

            <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-xs text-slate-300 space-y-1.5 text-right font-mono">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-400">الطالب:</span>
                <span className="text-white">{studentName} ({studentCode})</span>
              </div>
              {studentPhone && (
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">رقم الهاتف:</span>
                  <span className="text-white">{studentPhone}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-amber-400">
                <span>المخالفات المسجلة:</span>
                <span>{violations} من {maxViolations}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBlurred(false)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <EyeOff className="h-4 w-4" />
              العودة فوراً لمتابعة الامتحان
            </button>

            <p className="text-[11px] text-slate-500">
              ⚠️ تنبيه: تجاوز الحد الأقصى للمخالفات سيسلم الامتحان تلقائياً ويقيد المحاولة.
            </p>
          </div>
        </div>
      )}
    </>
  );
}


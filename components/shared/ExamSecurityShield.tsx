import React, { useEffect, useState, useCallback, useId } from 'react';
import { ShieldAlert, Lock, EyeOff, Maximize2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ExamSecurityShieldProps {
  studentName?: string;
  studentCode?: string;
  studentPhone?: string;
  quizId?: string;
  maxViolations?: number;
  onViolation?: (count: number) => void;
  onMaxViolationsExceeded?: () => void;
  isActive?: boolean;
}

export function ExamSecurityShield({
  studentName = 'طالب مسجل',
  studentCode = 'STU-001',
  studentPhone = '',
  quizId = 'default_quiz',
  maxViolations = 2,
  onViolation,
  onMaxViolationsExceeded,
  isActive = true,
}: ExamSecurityShieldProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [violations, setViolations] = useState(0);
  const [watermarkDate, setWatermarkDate] = useState('');
  const [lockCountdown, setLockCountdown] = useState(0);
  const sessionTraceId = useId().replace(/[:]/g, '').slice(0, 6).toUpperCase();
  const violationStorageKey = `edu_quiz_violations_${quizId}_${studentCode}`;

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

    // Restore persistent violations from storage
    try {
      const stored = localStorage.getItem(violationStorageKey);
      if (stored) {
        const count = parseInt(stored, 10);
        if (!isNaN(count) && count > 0) {
          setViolations(count);
          if (count >= maxViolations && onMaxViolationsExceeded) {
            onMaxViolationsExceeded();
          }
        }
      }
    } catch {}
  }, [violationStorageKey, maxViolations, onMaxViolationsExceeded]);

  const handleSecurityViolation = useCallback(
    (reason: string) => {
      if (!isActive) return;
      setIsBlurred(true);
      setLockCountdown(5);

      setViolations((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(violationStorageKey, String(next));
        } catch {}

        if (onViolation) onViolation(next);

        if (next >= maxViolations) {
          toast.error(`🚨 ضبط مخالفة نهائية (${next}/${maxViolations}) - جاري إنهاء وتسليم الامتحان فوراً!`, {
            duration: 6000,
          });
          if (onMaxViolationsExceeded) {
            setTimeout(() => onMaxViolationsExceeded(), 500);
          }
        } else {
          toast.error(`⚠️ تحذير أمني صارم: ${reason} (مخالفة ${next} من ${maxViolations}) - الخروج القادم ينهي الامتحان نهائياً!`, {
            duration: 5000,
          });
        }
        return next;
      });
    },
    [isActive, maxViolations, onViolation, onMaxViolationsExceeded, violationStorageKey]
  );

  // Lock countdown timer when shield is displayed
  useEffect(() => {
    if (lockCountdown > 0 && isBlurred) {
      const timer = setTimeout(() => {
        setLockCountdown((c) => Math.max(0, c - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockCountdown, isBlurred]);

  useEffect(() => {
    if (!isActive) return;

    // Trap browser back button / gestures
    try {
      window.history.pushState(null, '', window.location.href);
    } catch {}

    const handlePopState = (e: PopStateEvent) => {
      try {
        window.history.pushState(null, '', window.location.href);
      } catch {}
      handleSecurityViolation('محاولة استخدام زر الرجوع للخلف محظورة أثناء الاختبار');
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'مغادرة الامتحان ستؤدي لتسليمه فوراً!';
      return e.returnValue;
    };

    const preventAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleCopyAttempt = (e: ClipboardEvent) => {
      e.preventDefault();
      try {
        if (e.clipboardData) e.clipboardData.setData('text/plain', '');
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
        handleSecurityViolation('تم رصد إيماءة شاشة متعددة الأصابع (محاولة سكرين شوت أو تصوير)');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 2) {
        e.preventDefault();
        handleSecurityViolation('تم رصد حركة إيماءات محظورة على الشاشة');
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
        handleSecurityViolation('تم رصد محاولة تصوير الشاشة (PrintScreen)');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
        try {
          navigator.clipboard.writeText('');
        } catch {}
        handleSecurityViolation('محاولة التقاط لقطة شاشة محظورة');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSecurityViolation('مغادرة نافذة الامتحان أو التبديل لتطبيق آخر');
      }
    };

    const handleWindowBlur = () => {
      handleSecurityViolation('الخروج من نافذة الامتحان أو فتح نافذة منبثقة');
    };

    const handlePageHide = () => {
      handleSecurityViolation('إغلاق الصفحة أو تبديل التطبيق');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
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

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
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

        ${isBlurred ? `
          .exam-secure-area-content {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            filter: blur(50px) !important;
          }
        ` : ''}

        @media print {
          html,
          body,
          .exam-secure-area,
          .exam-secure-area-content {
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
                {violations >= maxViolations ? 'تم إنهاء الامتحان وضبط مخالفة!' : 'تم حجب شاشة الامتحان أمنياً!'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {violations >= maxViolations
                  ? 'تم تجاوز الحد المسموح به لمغادرة النافذة أو محاولة تصوير الشاشة. تم تسليم الامتحان وإنهاء الجلسة فوراً.'
                  : 'تم رصد مغادرة نافذة الامتحان أو محاولة أخذ لقطة شاشة. تم حجب الأسئلة فوراً لحماية السرية ومنع التسريب.'}
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

            {violations < maxViolations ? (
              <button
                type="button"
                disabled={lockCountdown > 0}
                onClick={() => setIsBlurred(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <EyeOff className="h-4 w-4" />
                {lockCountdown > 0 ? `انتظر (${lockCountdown} ثوانٍ) لفك الحظر...` : 'العودة فوراً لمتابعة الامتحان'}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-bold">
                🔒 تم تسليم الامتحان رسمياً وقفل الجلسة
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              ⚠️ تنبيه: نظام المراقبة يسجل أي خروج أو تبديل للتطبيقات ويسلمه تلقائياً.
            </p>
          </div>
        </div>
      )}
    </>
  );
}


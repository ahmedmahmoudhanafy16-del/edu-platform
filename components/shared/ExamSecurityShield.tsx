import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, Lock, EyeOff } from 'lucide-react';
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
          toast.error(`⚠️ تم تسجيل مخالفة أمنية قصوى (${next}/${maxViolations}) - جاري اتخاذ الإجراء!`);
          if (onMaxViolationsExceeded) onMaxViolationsExceeded();
        } else {
          toast.warning(`⚠️ تحذير أمني: ${reason} (مخالفة ${next} من ${maxViolations})`, {
            duration: 4000,
          });
        }
        return next;
      });
    },
    [isActive, maxViolations, onViolation, onMaxViolationsExceeded]
  );

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

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === 'F12') {
        e.preventDefault();
        handleSecurityViolation('فتح أدوات المطور (F12) محظور');
        return;
      }

      if (isCtrlOrCmd && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        handleSecurityViolation('فحص عناصر الصفحة محظور أمنياً');
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
        handleSecurityViolation('مغادرة نافذة الامتحان أو فتح تطبيق آخر');
      }
    };

    const handleWindowBlur = () => {
      setIsBlurred(true);
    };

    const handleWindowFocus = () => {};

    document.addEventListener('copy', handleCopyAttempt, true);
    document.addEventListener('cut', preventAction, true);
    document.addEventListener('paste', preventAction, true);
    document.addEventListener('selectstart', preventAction, true);
    document.addEventListener('dragstart', preventAction, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('copy', handleCopyAttempt, true);
      document.removeEventListener('cut', preventAction, true);
      document.removeEventListener('paste', preventAction, true);
      document.removeEventListener('selectstart', preventAction, true);
      document.removeEventListener('dragstart', preventAction, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
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

      {/* 1. Dynamic Anti-Leak Diagonal Watermark Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none opacity-[0.07] dark:opacity-[0.09] flex flex-wrap items-center justify-around gap-16 p-6"
        aria-hidden="true"
        dir="ltr"
      >
        {Array.from({ length: 18 }).map((_, idx) => (
          <div
            key={idx}
            className="transform -rotate-[22deg] font-mono font-black text-[13px] sm:text-[15px] text-slate-900 dark:text-white tracking-widest text-center leading-relaxed"
          >
            <div>{studentName} ({studentCode})</div>
            {studentPhone && <div className="text-[11px]">{studentPhone}</div>}
            <div className="text-[10px] opacity-75">🔒 سرى وخاص بالطالب - {watermarkDate}</div>
          </div>
        ))}
      </div>

      {/* 2. Fullscreen Privacy Shield on Focus Loss / Tab Switching */}
      {isBlurred && isActive && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 text-white text-center select-none animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto animate-pulse">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-red-400 flex items-center justify-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                تم إخفاء شاشة الامتحان أمنياً!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تم رصد مغادرة نافذة الامتحان أو محاولة تشغيل لقطة شاشة. لحماية سرية الأسئلة، تم تعتيم الشاشة فوراً.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-xs text-slate-300 space-y-1 text-right">
              <div className="flex justify-between font-semibold">
                <span>الطالب:</span>
                <span className="text-white">{studentName} ({studentCode})</span>
              </div>
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
              ⚠️ تكرار مغادرة الصفحة سيؤدي إلى تسليم الامتحان تلقائياً وحسم الدرجة.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

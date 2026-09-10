'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  X,
  RotateCcw,
  KeyRound,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
  UserCheck,
  UserX,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getRetakeCodes,
  generateRetakeCode,
  deleteRetakeCode,
  getSubmissions,
  getStudentsFromStore,
  resetStudentQuizAttempt,
  QuizRetakeCode,
} from '@/lib/store';
import { createQuizRetakeCodeAction, resetStudentQuizAttemptAction } from '@/actions/quiz';
import { toast } from 'sonner';

interface StudentQuizResultView {
  studentId: string;
  studentName: string;
  studentCode: string;
  phone: string;
  parentPhone: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  isPassed?: boolean;
  status?: string;
  submittedAt?: string;
  hasRetakeCode?: boolean;
  retakeCode?: QuizRetakeCode;
}

interface QuizResultsAndRetakeModalProps {
  quiz: {
    id: string;
    title: string;
    classroomName?: string;
    classroomId?: string;
    totalScore?: number;
    duration?: number;
    accessCode?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuizResultsAndRetakeModal({
  quiz,
  isOpen,
  onClose,
}: QuizResultsAndRetakeModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [retakeCodes, setRetakeCodes] = useState<QuizRetakeCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForRetake, setSelectedStudentForRetake] = useState<string>('');
  const [retakeReason, setRetakeReason] = useState(
    isAr ? 'إعادة استثنائية مصرح بها من المعلم' : 'Authorized retake attempt by teacher'
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);

  // Sync data when opened
  useEffect(() => {
    if (!isOpen || !quiz) return;

    function refreshData() {
      if (!quiz) return;
      const allStudents = getStudentsFromStore();
      const allSubs = getSubmissions();
      const codes = getRetakeCodes(quiz.id);

      setStudents(allStudents);
      setSubmissions(allSubs);
      setRetakeCodes(codes);
    }

    refreshData();

    window.addEventListener('edu_store_updated', refreshData);
    window.addEventListener('storage', refreshData);

    return () => {
      window.removeEventListener('edu_store_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, [isOpen, quiz]);

  // Merge students with their submissions and retake codes for this quiz
  const studentRows = useMemo<StudentQuizResultView[]>(() => {
    if (!quiz) return [];

    const targetQuizId = quiz.id;
    const targetAccessCode = (quiz.accessCode || '').trim().toUpperCase();

    // Map retake codes by student ID/Code
    const retakeMap = new Map<string, QuizRetakeCode>();
    retakeCodes.forEach((r) => {
      if (r.quizId === targetQuizId || (quiz.accessCode && r.quizId === quiz.accessCode)) {
        retakeMap.set(r.studentId.toUpperCase(), r);
        if (r.studentCode) retakeMap.set(r.studentCode.toUpperCase(), r);
      }
    });

    // Map submissions by student ID/Code
    const submissionMap = new Map<string, any>();
    submissions.forEach((s) => {
      const matchQuiz =
        s.quizId === targetQuizId ||
        s.id === targetQuizId ||
        (s.accessCode && s.accessCode.toUpperCase() === targetAccessCode);

      if (matchQuiz) {
        if (s.studentId) submissionMap.set(s.studentId.toUpperCase(), s);
        if (s.studentCode) submissionMap.set(s.studentCode.toUpperCase(), s);
      }
    });

    return students.map((stu) => {
      const sId = (stu.id || stu.studentCode || '').toUpperCase();
      const sCode = (stu.studentCode || stu.id || '').toUpperCase();

      const sub = submissionMap.get(sId) || submissionMap.get(sCode);
      const retake = retakeMap.get(sId) || retakeMap.get(sCode);

      return {
        studentId: stu.id || stu.studentCode,
        studentName: stu.name,
        studentCode: stu.studentCode || stu.code || stu.id,
        phone: stu.phone || '',
        parentPhone: stu.parentPhone || stu.parentWhatsapp || stu.phone || '',
        score: sub?.score ?? sub?.totalScore ?? sub?.autoScore,
        maxScore: sub?.maxScore ?? (quiz.totalScore || 10),
        percentage: sub?.percentage,
        isPassed: sub?.isPassed,
        status: sub ? (sub.status || 'AUTO_GRADED') : undefined,
        submittedAt: sub?.submittedAt,
        hasRetakeCode: Boolean(retake && !retake.isUsed),
        retakeCode: retake,
      };
    });
  }, [quiz, students, submissions, retakeCodes]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return studentRows.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.studentCode.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.parentPhone.includes(q)
      );
    });
  }, [studentRows, searchQuery]);

  if (!isOpen || !quiz) return null;

  // Handle generating a retake code
  async function handleIssueRetake(student: StudentQuizResultView) {
    if (!quiz) return;
    setLoadingStudentId(student.studentId);

    try {
      // 1. Generate in client store
      const newRetake = generateRetakeCode(
        quiz.id,
        student.studentId,
        student.studentName,
        student.studentCode,
        quiz.title,
        retakeReason
      );

      // 2. Silent server action backup
      createQuizRetakeCodeAction(
        quiz.id,
        student.studentId,
        student.studentName,
        student.studentCode,
        quiz.title,
        retakeReason
      ).catch(() => null);

      setRetakeCodes(getRetakeCodes(quiz.id));
      toast.success(
        isAr
          ? `تم إنشاء كود إعادة استثنائي للطالب ${student.studentName}: ${newRetake.code}`
          : `Exceptional retake code created for ${student.studentName}: ${newRetake.code}`
      );
    } catch (err: any) {
      toast.error(err?.message || (isAr ? 'حدث خطأ أثناء إنشاء كود الإعادة' : 'Error generating retake code'));
    } finally {
      setLoadingStudentId(null);
    }
  }

  // Handle direct one-click instant reopen
  async function handleDirectReset(student: StudentQuizResultView) {
    if (!quiz) return;
    setLoadingStudentId(student.studentId);

    try {
      // 1. Reset client store
      const res = resetStudentQuizAttempt(quiz.id, student.studentId, student.studentCode);
      // 2. Reset server side
      resetStudentQuizAttemptAction(quiz.id, student.studentId, student.studentCode).catch(() => null);

      if (res.success) {
        toast.success(
          isAr
            ? `تم إعادة فتح الاختبار فوراً للطالب "${student.studentName}" بنجاح! يمكنه الدخول وبدء الامتحان الآن.`
            : `Exam reopened immediately for "${student.studentName}"! They can start now.`
        );
        setSubmissions(getSubmissions());
        setRetakeCodes(getRetakeCodes(quiz.id));
      } else {
        toast.error(res.message || (isAr ? 'حدث خطأ أثناء إعادة فتح الاختبار' : 'Failed to reopen exam'));
      }
    } catch (err: any) {
      toast.error(err?.message || (isAr ? 'تعذر إعادة فتح الاختبار' : 'Could not reopen exam'));
    } finally {
      setLoadingStudentId(null);
    }
  }

  // Handle quick copy
  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(isAr ? `تم نسخ الكود: ${code}` : `Code copied: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Handle deleting a retake code
  function handleDeleteRetake(codeId: string) {
    if (!quiz) return;
    deleteRetakeCode(codeId);
    setRetakeCodes(getRetakeCodes(quiz.id));
    toast.info(isAr ? 'تم إلغاء كود الإعادة' : 'Retake code cancelled');
  }

  // Handle WhatsApp Share
  function handleWhatsAppShare(student: StudentQuizResultView, code: string) {
    if (!quiz) return;
    const cleanPhone = (student.parentPhone || student.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;

    const message = isAr
      ? `السلام عليكم ورحمة الله وبركاته،
ولي أمر الطالب: *${student.studentName}* (${student.studentCode})

بناءً على طلبكم، تم تفعيل *إعادة استثنائية* لاختبار:
📝 *${quiz.title}*

🔑 *كود الدخول الجديد للاختبار:*
\`${code}\`

⚠️ *تنبيهات هامة للطالب:*
• الكود صالح للاستخدام لمرة واحدة فقط.
• سيتم فتح محاولة جديدة بترتيب عشوائي للأسئلة والخيارات.
• يُرجى عدم مغادرة شاشة الامتحان أو التبديل بين التطبيقات لتجنب الإلغاء التلقائي.

نتمنى له دوام التوفيق والنجاح! 🌟`
      : `Dear Parent of *${student.studentName}* (${student.studentCode}),

An exceptional retake has been granted for:
📝 *${quiz.title}*

🔑 *New Exam Access Passcode:*
\`${code}\`

⚠️ *Important Notice:*
• One-time use only.
• New attempt with randomized question order.
• Please do not leave or switch away from exam screen.

Best wishes! 🌟`;

    const url = cleanPhone
      ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  }

  const completedCount = studentRows.filter((s) => s.score !== undefined).length;
  const activeRetakeCount = retakeCodes.filter((r) => !r.isUsed).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-4xl overflow-hidden shadow-modal flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300 bg-n-50/50 dark:bg-n-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center border border-accent/20">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-n-800 dark:text-n-700">{quiz.title}</h3>
                <span className="text-[10px] font-bold bg-accent-light text-accent px-2 py-0.5 rounded border border-accent/20">
                  {quiz.classroomName || (isAr ? 'فصل دراسي' : 'Classroom')}
                </span>
              </div>
              <p className="text-xs text-n-500 mt-0.5">
                {isAr
                  ? 'إدارة نتائج الطلاب ومنح أكواد إعادة الامتحان الاستثنائية للطلاب'
                  : 'Manage student scores and grant exceptional exam retakes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-n-400 hover:text-n-700 dark:hover:text-n-500 p-1.5 rounded-lg hover:bg-n-100 dark:hover:bg-n-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 border-b border-n-100 dark:border-n-200 bg-white dark:bg-n-100 px-6 py-3 text-center text-xs">
          <div>
            <span className="text-n-400">{isAr ? 'إجمالي طلاب الفصل:' : 'Total Students:'}</span>{' '}
            <strong className="text-n-800 dark:text-n-700 text-sm font-mono">{students.length}</strong>
          </div>
          <div>
            <span className="text-n-400">{isAr ? 'الذين قاموا بالاختبار:' : 'Completed Quiz:'}</span>{' '}
            <strong className="text-ok text-sm font-mono">{completedCount}</strong>
          </div>
          <div>
            <span className="text-n-400">{isAr ? 'أكواد الإعادة الفعالة:' : 'Active Retake Codes:'}</span>{' '}
            <strong className="text-accent text-sm font-mono">{activeRetakeCount}</strong>
          </div>
        </div>

        {/* Action & Search Bar */}
        <div className="p-4 border-b border-n-200 dark:border-n-300 bg-n-50 dark:bg-n-200/50 flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder={isAr ? 'بحث باسم الطالب أو كود الطالب...' : 'Search by student name or code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2 ${
                isAr ? 'pl-8' : 'pr-8'
              } focus:outline-none focus:border-accent`}
            />
            <Search className={`h-3.5 w-3.5 text-n-400 absolute ${isAr ? 'left-2.5' : 'right-2.5'} top-2.5`} />
          </div>

          {/* Quick Issue Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStudentForRetake}
              onChange={(e) => setSelectedStudentForRetake(e.target.value)}
              className="text-xs bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-lg px-3 py-2 text-n-700 dark:text-n-600 focus:outline-none focus:border-accent"
            >
              <option value="">
                {isAr ? '-- اختر طالباً لمنحه كود إعادة فوري --' : '-- Select student to grant instant retake --'}
              </option>
              {studentRows.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.studentName} ({s.studentCode}) {s.score !== undefined ? `[${s.score}/${s.maxScore}]` : (isAr ? '[لم يختبر]' : '[Not taken]')}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedStudentForRetake}
              onClick={() => {
                const target = studentRows.find((s) => s.studentId === selectedStudentForRetake);
                if (target) {
                  handleDirectReset(target);
                  setSelectedStudentForRetake('');
                }
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <RotateCcw className="h-3.5 w-3.5 me-1" />
              {isAr ? 'إعادة فتح فوري' : 'Instant Reopen'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!selectedStudentForRetake}
              onClick={() => {
                const target = studentRows.find((s) => s.studentId === selectedStudentForRetake);
                if (target) {
                  handleIssueRetake(target);
                  setSelectedStudentForRetake('');
                }
              }}
              className="text-xs text-accent border-accent/30 hover:bg-accent-light"
            >
              <KeyRound className="h-3.5 w-3.5 me-1" />
              {isAr ? 'توليد كود' : 'Generate Code'}
            </Button>
          </div>
        </div>

        {/* Students Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRows.length === 0 ? (
            <div className="p-12 text-center text-xs text-n-400">
              {isAr ? 'لا يوجد طلاب مطابقين للبحث' : 'No matching students found'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRows.map((student) => {
                const isTested = student.score !== undefined;
                const activeRetake = student.retakeCode;

                return (
                  <div
                    key={student.studentId}
                    className="p-3.5 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 flex flex-wrap items-center justify-between gap-3 hover:border-accent/40 transition-colors shadow-sm"
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isTested
                            ? student.isPassed
                              ? 'bg-ok-light text-ok border border-ok/20'
                              : 'bg-bad-light text-bad border border-bad/20'
                            : 'bg-n-100 dark:bg-n-200 text-n-500'
                        }`}
                      >
                        {isTested ? (student.isPassed ? '✓' : '✕') : '—'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-n-800 dark:text-n-700">{student.studentName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold text-accent">
                            {student.studentCode}
                          </span>
                          {student.phone && (
                            <span className="text-[10px] text-n-400 font-mono">
                              {student.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Result / Exam Status */}
                    <div className="flex items-center gap-2">
                      {isTested ? (
                        <div className="text-center sm:text-start">
                          <div className="flex items-center gap-1.5">
                            <span dir="ltr" className="text-xs font-bold font-mono text-n-800 dark:text-n-700 bg-n-50 dark:bg-n-200 px-2 py-0.5 rounded border border-n-200">
                              {student.score} / {student.maxScore} ({student.percentage ?? Math.round(((student.score || 0) / (student.maxScore || 10)) * 100)}%)
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                student.isPassed
                                  ? 'bg-ok-light text-ok border border-ok/20'
                                  : 'bg-bad-light text-bad border border-bad/20'
                              }`}
                            >
                              {student.isPassed ? (isAr ? 'ناجح' : 'Passed') : (isAr ? 'راسب / ملغي' : 'Failed / Void')}
                            </span>
                          </div>
                          {student.submittedAt && (
                            <p className="text-[10px] text-n-400 mt-0.5">
                              {new Date(student.submittedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-n-400 bg-n-50 dark:bg-n-200 px-2.5 py-1 rounded border border-n-200 font-medium">
                          {isAr ? 'لم يقم بتسليم الامتحان بعد' : 'Exam not submitted yet'}
                        </span>
                      )}
                    </div>

                    {/* Retake Code State / Actions - Teacher Control */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isTested && (
                        <Button
                          size="sm"
                          variant="primary"
                          loading={loadingStudentId === student.studentId}
                          onClick={() => handleDirectReset(student)}
                          className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          title={isAr ? 'إعادة فتح الامتحان للطالب فوراً ومسح درجته ومخالفاته السابقة' : 'Reopen exam immediately, clearing previous attempt'}
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>{isAr ? 'إعادة فتح فورية للطالب 🔄' : 'Instant Reopen 🔄'}</span>
                        </Button>
                      )}

                      {activeRetake && !activeRetake.isUsed ? (
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                          <div className="text-start">
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 block">
                              {isAr ? 'كود إعادة متاح 🟡' : 'Active Retake Code 🟡'}
                            </span>
                            <code className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200 tracking-wider">
                              {activeRetake.code}
                            </code>
                          </div>

                          {/* Copy Button */}
                          <button
                            type="button"
                            onClick={() => handleCopy(activeRetake.code)}
                            className="p-1.5 rounded bg-white dark:bg-n-100 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
                            title={isAr ? 'نسخ كود الإعادة' : 'Copy retake code'}
                          >
                            {copiedCode === activeRetake.code ? (
                              <Check className="h-3.5 w-3.5 text-ok" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* WhatsApp Share Button */}
                          <button
                            type="button"
                            onClick={() => handleWhatsAppShare(student, activeRetake.code)}
                            className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 text-[11px] px-2 font-bold shadow-sm"
                            title={isAr ? 'مشاركة الكود على واتساب لولي الأمر' : 'Share retake code via WhatsApp'}
                          >
                            <Share2 className="h-3 w-3" />
                            <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                          </button>

                          {/* Delete Retake Code */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRetake(activeRetake.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title={isAr ? 'إلغاء هذا الكود' : 'Cancel this code'}
                          >
                            ✕
                          </button>
                        </div>
                      ) : activeRetake && activeRetake.isUsed ? (
                        <div className="flex items-center gap-1.5 text-xs text-ok bg-ok-light border border-ok/20 px-2.5 py-1 rounded font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{isAr ? `تم استخدام كود الإعادة (${activeRetake.code})` : `Retake code used (${activeRetake.code})`}</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={loadingStudentId === student.studentId}
                          onClick={() => handleIssueRetake(student)}
                          className="text-xs flex items-center gap-1 text-accent border-accent/30 hover:bg-accent-light"
                          title={isAr ? 'توليد كود سري للمشاركة على واتساب' : 'Generate secret code to share'}
                        >
                          <KeyRound className="h-3 w-3" />
                          <span>{isAr ? 'كود سري 🔑' : 'Passcode 🔑'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-n-200 dark:border-n-300 bg-n-50/50 dark:bg-n-200/50 flex items-center justify-between">
          <p className="text-xs text-n-500">
            💡 <strong>{isAr ? 'تلميح:' : 'Tip:'}</strong> {isAr ? 'كود الإعادة يلغي التسليم والمخالفات السابقة للطالب ويمنحه محاولة جديدة بترتيب عشوائي.' : 'The retake passcode clears previous submissions & security violations, giving the student a fresh randomized attempt.'}
          </p>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}

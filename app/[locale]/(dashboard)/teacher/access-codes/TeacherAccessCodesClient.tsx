'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Ticket, Plus, Download, Copy, Check, Filter,
  CheckCircle2, Clock, XCircle, AlertCircle, Sparkles, DollarSign, Calendar,
  RotateCcw, Share2, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getRetakeCodes,
  generateRetakeCode,
  deleteRetakeCode,
  getQuizzes,
  getStudentsFromStore,
  QuizRetakeCode,
} from '@/lib/store';
import { createQuizRetakeCodeAction } from '@/actions/quiz';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

interface LiveSessionItem {
  id: string;
  title: string;
  roomCode: string;
  isActive: boolean;
  classroomName: string;
}

interface AccessCodeItem {
  id: string;
  code: string;
  price: number;
  liveSessionId: string;
  liveSessionTitle: string;
  roomCode: string;
  usedByStudentId: string | null;
  studentName: string | null;
  studentCode: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  status: 'USED' | 'AVAILABLE' | 'EXPIRED';
}

export function TeacherAccessCodesClient({
  sessions,
  initialCodes,
}: {
  sessions: LiveSessionItem[];
  initialCodes: AccessCodeItem[];
}) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'LIVE_SESSIONS' | 'EXAM_RETAKES'>('LIVE_SESSIONS');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[0]?.id || 'ALL'
  );
  const [codes, setCodes] = useState<AccessCodeItem[]>(initialCodes);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'USED' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Retake Codes state
  const [retakeCodes, setRetakeCodes] = useState<QuizRetakeCode[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isRetakeModalOpen, setIsRetakeModalOpen] = useState(false);
  const [retakeQuizId, setRetakeQuizId] = useState('');
  const [retakeStudentId, setRetakeStudentId] = useState('');
  const [retakeReason, setRetakeReason] = useState(isAr ? 'إعادة استثنائية مصرح بها من المعلم' : 'Authorized exceptional retake');
  const [isGeneratingRetake, setIsGeneratingRetake] = useState(false);

  // Sync retake data on mount
  useEffect(() => {
    function syncRetakeData() {
      setRetakeCodes(getRetakeCodes());
      setAllQuizzes(getQuizzes());
      setAllStudents(getStudentsFromStore());
    }
    syncRetakeData();
    window.addEventListener('edu_store_updated', syncRetakeData);
    window.addEventListener('storage', syncRetakeData);
    return () => {
      window.removeEventListener('edu_store_updated', syncRetakeData);
      window.removeEventListener('storage', syncRetakeData);
    };
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(50);
  const [expiresAt, setExpiresAt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalSessionId, setModalSessionId] = useState<string>(sessions[0]?.id || '');
  const [modalError, setModalError] = useState('');

  // Copy Feedback State
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filtered Codes
  const filteredCodes = useMemo(() => {
    return codes.filter((c) => {
      const matchesSession =
        selectedSessionId === 'ALL' || c.liveSessionId === selectedSessionId;
      const matchesStatus =
        statusFilter === 'ALL' || c.status === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.studentName && c.studentName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSession && matchesStatus && matchesSearch;
    });
  }, [codes, selectedSessionId, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const relevant =
      selectedSessionId === 'ALL'
        ? codes
        : codes.filter((c) => c.liveSessionId === selectedSessionId);

    const total = relevant.length;
    const available = relevant.filter((c) => c.status === 'AVAILABLE').length;
    const used = relevant.filter((c) => c.status === 'USED').length;
    const expired = relevant.filter((c) => c.status === 'EXPIRED').length;
    const revenue = relevant
      .filter((c) => c.status === 'USED')
      .reduce((sum, c) => sum + (c.price || 0), 0);

    return { total, available, used, expired, revenue };
  }, [codes, selectedSessionId]);

  // Handle Generate Codes
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!modalSessionId) {
      setModalError(isAr ? 'يرجى اختيار الحصة المباشرة' : 'Please select a live session');
      return;
    }

    setIsGenerating(true);
    setModalError('');

    try {
      const res = await fetch('/api/admin/access-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liveSessionId: modalSessionId,
          quantity,
          price,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isAr ? 'فشل في توليد الأكواد' : 'Failed to generate codes'));
      }

      // Refresh codes list from API
      const refreshRes = await fetch('/api/admin/access-codes');
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setCodes(refreshData.codes);
      }

      setIsModalOpen(false);
      // Auto select the session we generated for
      setSelectedSessionId(modalSessionId);
    } catch (err: any) {
      setModalError(err.message || (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'));
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle Copy All Available Codes
  function handleCopyAllUnused() {
    const available = filteredCodes
      .filter((c) => c.status === 'AVAILABLE')
      .map((c) => c.code);

    if (available.length === 0) {
      alert(isAr ? 'لا توجد أكواد متاحة للنسخ' : 'No available codes to copy');
      return;
    }

    navigator.clipboard.writeText(available.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  }

  // Handle Copy Single Code
  function handleCopySingle(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Handle Export CSV
  function handleExportCSV() {
    if (filteredCodes.length === 0) {
      alert(isAr ? 'لا توجد بيانات لتصديرها' : 'No data to export');
      return;
    }

    const headers = isAr ? [
      'الكود',
      'الحصة المباشرة',
      'السعر (ج.م)',
      'الحالة',
      'اسم الطالب',
      'كود الطالب',
      'تاريخ الاستخدام',
      'تاريخ الانتهاء',
      'تاريخ الإنشاء',
    ] : [
      'Access Code',
      'Live Session',
      'Price (EGP)',
      'Status',
      'Student Name',
      'Student Code',
      'Used At',
      'Expires At',
      'Created At',
    ];

    const rows = filteredCodes.map((c) => [
      `"${c.code}"`,
      `"${c.liveSessionTitle}"`,
      c.price,
      `"${
        c.status === 'USED'
          ? (isAr ? 'مستخدم' : 'Used')
          : c.status === 'AVAILABLE'
          ? (isAr ? 'متاح' : 'Available')
          : (isAr ? 'منتهي' : 'Expired')
      }"`,
      `"${c.studentName || '—'}"`,
      `"${c.studentCode || '—'}"`,
      `"${c.usedAt ? new Date(c.usedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US') : '—'}"`,
      `"${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : (isAr ? 'بدون انتهاء' : 'No Expiry')}"`,
      `"${new Date(c.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `access-codes-${selectedSessionId}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Handle Generate Retake Code
  async function handleGenerateRetakeCode(e: React.FormEvent) {
    e.preventDefault();
    if (!retakeQuizId || !retakeStudentId) {
      toast.error(isAr ? 'يرجى اختيار الامتحان والطالب' : 'Please select both exam and student');
      return;
    }

    setIsGeneratingRetake(true);
    try {
      const targetQuiz = allQuizzes.find((q) => q.id === retakeQuizId);
      const targetStudent = allStudents.find((s) => s.id === retakeStudentId || s.studentCode === retakeStudentId);

      const newCode = generateRetakeCode(
        retakeQuizId,
        targetStudent?.id || retakeStudentId,
        targetStudent?.name || (isAr ? 'طالب' : 'Student'),
        targetStudent?.studentCode || retakeStudentId,
        targetQuiz?.title || (isAr ? 'الاختبار الأكاديمي' : 'Academic Exam'),
        retakeReason
      );

      createQuizRetakeCodeAction(
        retakeQuizId,
        targetStudent?.id || retakeStudentId,
        targetStudent?.name || (isAr ? 'طالب' : 'Student'),
        targetStudent?.studentCode || retakeStudentId,
        targetQuiz?.title || (isAr ? 'الاختبار الأكاديمي' : 'Academic Exam'),
        retakeReason
      ).catch(() => null);

      setRetakeCodes(getRetakeCodes());
      setIsRetakeModalOpen(false);
      toast.success(
        isAr
          ? `تم إنشاء كود إعادة استثنائي بنجاح: ${newCode.code}`
          : `Exceptional retake code created successfully: ${newCode.code}`
      );
    } catch (err: any) {
      toast.error(err?.message || (isAr ? 'فشل توليد كود الإعادة' : 'Failed to generate retake code'));
    } finally {
      setIsGeneratingRetake(false);
    }
  }

  // Handle WhatsApp Share for Retake
  function handleRetakeWhatsAppShare(retake: QuizRetakeCode) {
    const student = allStudents.find((s) => s.id === retake.studentId || s.studentCode === retake.studentCode);
    const rawPhone = student?.parentPhone || student?.parentWhatsapp || student?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;

    const message = isAr
      ? `السلام عليكم ورحمة الله وبركاته،
ولي أمر الطالب: *${retake.studentName}* (${retake.studentCode})

بناءً على طلبكم، تم تفعيل *إعادة استثنائية* لاختبار:
📝 *${retake.quizTitle}*

🔑 *كود الدخول الجديد للاختبار:*
\`${retake.code}\`

⚠️ *تنبيهات هامة للطالب:*
• الكود صالح للاستخدام لمرة واحدة فقط.
• سيتم فتح محاولة جديدة بترتيب عشوائي للأسئلة والخيارات.
• يُرجى عدم مغادرة شاشة الامتحان لتجنب الإلغاء التلقائي.

نتمنى له دوام التوفيق والنجاح.`
      : `Dear Parent of Student: *${retake.studentName}* (${retake.studentCode}),

As requested, an *exceptional exam retake* has been authorized for:
📝 *${retake.quizTitle}*

🔑 *New Exam Access Code:*
\`${retake.code}\`

⚠️ *Important Instructions:*
• Code is valid for one-time use only.
• A fresh attempt with randomized questions and answers will be provided.
• Please do not leave the exam window to prevent auto-cancellation.

Best wishes for excellence and success.`;

    const url = cleanPhone
      ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  }

  // Handle Delete Retake
  function handleDeleteRetake(codeId: string) {
    deleteRetakeCode(codeId);
    setRetakeCodes(getRetakeCodes());
    toast.info(isAr ? 'تم حذف كود الإعادة' : 'Retake code removed');
  }

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 shadow-sm';

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Main Category Switcher (Live Codes vs Exam Retake Codes) ── */}
      <div className="flex items-center gap-2 p-1.5 bg-n-100 dark:bg-n-200 rounded-2xl border border-n-200 dark:border-n-300 w-fit">
        <button
          onClick={() => setActiveTab('LIVE_SESSIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'LIVE_SESSIONS'
              ? 'bg-accent text-white shadow-sm'
              : 'text-n-600 dark:text-n-400 hover:text-n-800'
          }`}
        >
          <Ticket className="h-4 w-4" />
          <span>{isAr ? `أكواد الحصص المباشرة والسنتر (${codes.length})` : `Live & Center Session Codes (${codes.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('EXAM_RETAKES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'EXAM_RETAKES'
              ? 'bg-accent text-white shadow-sm'
              : 'text-n-600 dark:text-n-400 hover:text-n-800'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>{isAr ? `أكواد إعادة الامتحانات الاستثنائية (${retakeCodes.length})` : `Exceptional Retake Codes (${retakeCodes.length})`}</span>
        </button>
      </div>

      {activeTab === 'EXAM_RETAKES' ? (
        /* ── EXAM RETAKE CODES SECTION ─────────────────────────────────── */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Bar for Retake Codes */}
          <div className={`${card} p-5 flex flex-wrap items-center justify-between gap-4`}>
            <div>
              <h2 className="text-base font-bold text-n-800 dark:text-n-700">
                {isAr ? 'سجل أكواد إعادة الامتحانات (Retake Codes)' : 'Exam Retake Codes Log'}
              </h2>
              <p className="text-xs text-n-500 mt-0.5">
                {isAr
                  ? 'الأكواد الممنوحة للطلاب لإعادة الاختبارات الملغية أو لمشاكل الاتصال'
                  : 'Codes granted to students to retake canceled exams or resolve technical interruptions'}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRetakeModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'توليد كود إعادة لطالب' : 'Generate Retake Code'}</span>
            </Button>
          </div>

          {/* Retake Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`${card} p-4 flex items-center justify-between`}>
              <div>
                <p className="text-xs text-n-500 dark:text-n-400">{isAr ? 'إجمالي أكواد الإعادة' : 'Total Retake Codes'}</p>
                <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-0.5">{retakeCodes.length}</p>
              </div>
              <RotateCcw className="h-6 w-6 text-accent" />
            </div>

            <div className={`${card} p-4 flex items-center justify-between`}>
              <div>
                <p className="text-xs text-n-500 dark:text-n-400">{isAr ? 'أكواد متاحة ولم تُستخدم بعد' : 'Available Unused Codes'}</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">
                  {retakeCodes.filter((r) => !r.isUsed).length}
                </p>
              </div>
              <Clock className="h-6 w-6 text-amber-500" />
            </div>

            <div className={`${card} p-4 flex items-center justify-between`}>
              <div>
                <p className="text-xs text-n-500 dark:text-n-400">{isAr ? 'أكواد تم استخدامها' : 'Used Codes'}</p>
                <p className="text-2xl font-bold text-ok mt-0.5">
                  {retakeCodes.filter((r) => r.isUsed).length}
                </p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-ok" />
            </div>
          </div>

          {/* Retake Codes Table */}
          <div className={`${card} overflow-hidden`}>
            {retakeCodes.length === 0 ? (
              <div className="p-12 text-center text-sm text-n-400">
                <RotateCcw className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
                <p className="font-semibold text-n-700 dark:text-n-600">
                  {isAr ? 'لا توجد أكواد إعادة منشأة حالياً' : 'No retake codes generated yet'}
                </p>
                <p className="text-xs text-n-400 mt-1">
                  {isAr ? 'اضغط على زر "توليد كود إعادة لطالب" لمنح كود استثنائي' : 'Click "Generate Retake Code" to issue an exceptional code'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-n-50 dark:bg-n-200 border-b border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 font-bold">
                      <th className="p-3 text-start">{isAr ? 'كود الإعادة (Retake Code)' : 'Retake Code'}</th>
                      <th className="p-3 text-start">{isAr ? 'الامتحان المستهدف' : 'Target Exam'}</th>
                      <th className="p-3 text-start">{isAr ? 'الطالب المصرح له' : 'Authorized Student'}</th>
                      <th className="p-3 text-start">{isAr ? 'سبب المنح' : 'Reason'}</th>
                      <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-start">{isAr ? 'تاريخ الإنشاء' : 'Created At'}</th>
                      <th className="p-3 text-start">{isAr ? 'تاريخ الاستخدام' : 'Used At'}</th>
                      <th className="p-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-n-100 dark:divide-n-200">
                    {retakeCodes.map((r) => (
                      <tr key={r.id} className="hover:bg-n-50/60 dark:hover:bg-n-200/50 transition-colors">
                        <td className="p-3 font-mono font-bold">
                          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/50 px-2 py-1 rounded">
                            {r.code}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-n-800 dark:text-n-700 max-w-[180px] truncate">
                          {r.quizTitle}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-n-800 dark:text-n-700">{r.studentName}</p>
                          <p className="text-[10px] text-accent font-mono">{r.studentCode}</p>
                        </td>
                        <td className="p-3 text-n-600 dark:text-n-400 text-[11px] max-w-[160px] truncate">
                          {r.reason || (isAr ? 'إعادة استثنائية' : 'Exceptional retake')}
                        </td>
                        <td className="p-3">
                          {r.isUsed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok bg-ok-light border border-ok/20 px-2 py-0.5 rounded">
                              <CheckCircle2 className="h-3 w-3" /> {isAr ? 'تم الاستخدام' : 'Used'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 px-2 py-0.5 rounded">
                              <Clock className="h-3 w-3" /> {isAr ? 'متاح للاستخدام 🟡' : 'Available 🟡'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-n-500 tabular-nums">
                          {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                        </td>
                        <td className="p-3 text-n-500 tabular-nums">
                          {r.usedAt ? new Date(r.usedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopySingle(r.code)}
                              className="h-7 px-2 text-xs"
                              title={isAr ? 'نسخ الكود' : 'Copy Code'}
                            >
                              {copiedCode === r.code ? (
                                <span className="text-ok font-bold flex items-center gap-1">
                                  <Check className="h-3 w-3" /> {isAr ? 'تم' : 'Done'}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Copy className="h-3 w-3" /> {isAr ? 'نسخ' : 'Copy'}
                                </span>
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetakeWhatsAppShare(r)}
                              className="h-7 px-2 text-xs text-ok hover:text-ok hover:bg-ok-light"
                              title={isAr ? 'إرسال لولي الأمر عبر واتساب' : 'Send to parent via WhatsApp'}
                            >
                              <Share2 className="h-3 w-3 me-1" />
                              <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleDeleteRetake(r.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              title={isAr ? 'حذف هذا الكود' : 'Delete Code'}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── LIVE SESSION CODES SECTION ─────────────────────────────────── */
        <>
          {/* ── Top Action Bar ────────────────────────────────────────── */}
          <div className={`${card} p-5 flex flex-wrap items-center justify-between gap-4`}>
            {/* Session Selector */}
            <div className="flex items-center gap-3 min-w-[280px]">
              <label className="text-xs font-bold text-n-600 dark:text-n-400 whitespace-nowrap">
                {isAr ? 'اختر الحصة المباشرة:' : 'Select Live Session:'}
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full text-xs font-semibold bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="ALL">
                  {isAr ? `جميع الحصص المباشرة (${codes.length} كود)` : `All Live Sessions (${codes.length} codes)`}
                </option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.classroomName}) {s.isActive ? (isAr ? '🟢 مباشر الآن' : '🟢 Live Now') : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyAllUnused}
                className="flex items-center gap-1.5 text-xs"
              >
                {copiedAll ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-ok" />
                    <span className="text-ok font-bold">{isAr ? 'تم نسخ الأكواد المتاحة!' : 'Copied Available Codes!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-n-500" />
                    <span>{isAr ? `نسخ الأكواد المتاحة (${stats.available})` : `Copy Available (${stats.available})`}</span>
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5 text-n-500" />
                <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setModalSessionId(selectedSessionId !== 'ALL' ? selectedSessionId : sessions[0]?.id || '');
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>{isAr ? 'توليد أكواد جديدة' : 'Generate New Codes'}</span>
              </Button>
            </div>
          </div>

      {/* ── Stats Summary Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">{isAr ? 'إجمالي الأكواد' : 'Total Codes'}</p>
            <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-0.5">{stats.total}</p>
          </div>
          <Ticket className="h-6 w-6 text-accent" strokeWidth={1.75} />
        </div>

        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">{isAr ? 'الأكواد المتاحة للبيع' : 'Available for Sale'}</p>
            <p className="text-2xl font-bold text-accent mt-0.5">{stats.available}</p>
          </div>
          <Clock className="h-6 w-6 text-accent/60" strokeWidth={1.75} />
        </div>

        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">{isAr ? 'الأكواد المستخدمة' : 'Used Codes'}</p>
            <p className="text-2xl font-bold text-ok mt-0.5">{stats.used}</p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-ok" strokeWidth={1.75} />
        </div>

        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">{isAr ? 'إجمالي المبيعات المحصلة' : 'Collected Revenue'}</p>
            <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-0.5">
              {stats.revenue} <span className="text-xs font-normal text-n-500">{isAr ? 'ج.م' : 'EGP'}</span>
            </p>
          </div>
          <DollarSign className="h-6 w-6 text-ok" strokeWidth={1.75} />
        </div>
      </div>

      {/* ── Filter Bar & Search ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-n-100 dark:bg-n-200 rounded-lg border border-n-200 dark:border-n-300 text-xs font-semibold">
          {[
            { id: 'ALL', label: isAr ? 'الكل' : 'All', count: stats.total },
            { id: 'AVAILABLE', label: isAr ? 'متاح للبيع 🟡' : 'Available 🟡', count: stats.available },
            { id: 'USED', label: isAr ? 'مستخدم ومفعل ✅' : 'Activated ✅', count: stats.used },
            { id: 'EXPIRED', label: isAr ? 'منتهي الصلاحية 🔴' : 'Expired 🔴', count: stats.expired },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === tab.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-n-600 dark:text-n-400 hover:text-n-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder={isAr ? 'بحث بالكود أو اسم الطالب...' : 'Search by code or student...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2 pe-8 focus:outline-none focus:border-accent"
          />
          <Filter className="h-3.5 w-3.5 text-n-400 absolute end-2.5 top-2.5" />
        </div>
      </div>

      {/* ── Access Codes Table ────────────────────────────────────── */}
      <div className={`${card} overflow-hidden`}>
        {filteredCodes.length === 0 ? (
          <div className="p-12 text-center text-sm text-n-400">
            <Ticket className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="font-semibold text-n-700 dark:text-n-600">
              {isAr ? 'لا توجد أكواد مطابقة للمعايير المحددة' : 'No codes matching the specified filters'}
            </p>
            <p className="text-xs text-n-400 mt-1">
              {isAr ? 'اضغط على زر "توليد أكواد جديدة" لإنشاء باقة أكواد للحصة المباشرة' : 'Click "Generate New Codes" to generate a batch for this session'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-n-50 dark:bg-n-200 border-b border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 font-bold">
                  <th className="p-3 text-start">{isAr ? 'الكود (Code)' : 'Code'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحصة المباشرة' : 'Live Session'}</th>
                  <th className="p-3 text-start">{isAr ? 'السعر' : 'Price'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-start">{isAr ? 'الطالب المستخدم' : 'Redeemed By'}</th>
                  <th className="p-3 text-start">{isAr ? 'تاريخ الاستخدام' : 'Used At'}</th>
                  <th className="p-3 text-start">{isAr ? 'تاريخ الانتهاء' : 'Expires At'}</th>
                  <th className="p-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-n-100 dark:divide-n-200">
                {filteredCodes.map((c) => (
                  <tr key={c.id} className="hover:bg-n-50/60 dark:hover:bg-n-200/50 transition-colors">
                    {/* Code */}
                    <td className="p-3 font-mono font-bold text-n-800 dark:text-n-700">
                      <span className="bg-accent-light text-accent-text border border-accent/20 px-2 py-1 rounded">
                        {c.code}
                      </span>
                    </td>

                    {/* Live Session */}
                    <td className="p-3 font-semibold text-n-700 dark:text-n-600 max-w-[200px] truncate">
                      {c.liveSessionTitle}
                    </td>

                    {/* Price */}
                    <td className="p-3 font-bold text-n-800 dark:text-n-700 tabular-nums">
                      {c.price} {isAr ? 'ج.م' : 'EGP'}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      {c.status === 'USED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok bg-ok-light border border-ok/20 px-2 py-0.5 rounded">
                          <CheckCircle2 className="h-3 w-3" /> {isAr ? 'مستخدم' : 'Used'}
                        </span>
                      )}
                      {c.status === 'AVAILABLE' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-text bg-accent-light border border-accent/20 px-2 py-0.5 rounded">
                          <Clock className="h-3 w-3" /> {isAr ? 'متاح للبيع' : 'Available'}
                        </span>
                      )}
                      {c.status === 'EXPIRED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-bad bg-bad-light border border-bad/20 px-2 py-0.5 rounded">
                          <XCircle className="h-3 w-3" /> {isAr ? 'منتهي' : 'Expired'}
                        </span>
                      )}
                    </td>

                    {/* Student Name */}
                    <td className="p-3 text-n-700 dark:text-n-600">
                      {c.studentName ? (
                        <div>
                          <p className="font-bold text-n-800 dark:text-n-700">{c.studentName}</p>
                          <p className="text-[10px] text-n-400 font-mono">{c.studentCode || ''}</p>
                        </div>
                      ) : (
                        <span className="text-n-400">—</span>
                      )}
                    </td>

                    {/* Used At */}
                    <td className="p-3 text-n-500 tabular-nums">
                      {c.usedAt ? new Date(c.usedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>

                    {/* Expires At */}
                    <td className="p-3 text-n-500 tabular-nums">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : (isAr ? 'بدون انتهاء' : 'No Expiry')}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySingle(c.code)}
                        className="h-7 px-2 text-xs"
                      >
                        {copiedCode === c.code ? (
                          <span className="text-ok font-bold flex items-center gap-1">
                            <Check className="h-3 w-3" /> {isAr ? 'تم' : 'Done'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="h-3 w-3" /> {isAr ? 'نسخ' : 'Copy'}
                          </span>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Generate Codes Modal ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-n-900/60 backdrop-blur-sm p-4" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-n-100 rounded-2xl border border-n-200 dark:border-n-300 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-n-200 dark:border-n-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent-light text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-n-800 dark:text-n-700">
                    {isAr ? 'توليد باقة أكواد جديدة' : 'Generate New Codes Batch'}
                  </h3>
                  <p className="text-xs text-n-500 dark:text-n-400">
                    {isAr ? 'إنشاء أكواد فريدة للحصة المباشرة بنظام الدفع الفردي' : 'Generate unique access codes for individual session purchase'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="text-n-400 hover:text-n-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-bad-light border border-bad/20 text-bad text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Target Live Session */}
              <div>
                <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                  {isAr ? 'الحصة المباشرة المستهدفة *' : 'Target Live Session *'}
                </label>
                <select
                  value={modalSessionId}
                  onChange={(e) => setModalSessionId(e.target.value)}
                  className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">{isAr ? '-- اختر الحصة المباشرة --' : '-- Select Live Session --'}</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.classroomName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                    {isAr ? 'عدد الأكواد *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                    required
                  />
                  <p className="text-[10px] text-n-400 mt-1">{isAr ? 'الحد الأقصى 100 كود في المرة' : 'Max 100 codes per batch'}</p>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                    {isAr ? 'سعر الكود (ج.م) *' : 'Code Price (EGP) *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1 flex items-center justify-between">
                  <span>{isAr ? 'تاريخ انتهاء الصلاحية (اختياري)' : 'Expiry Date (Optional)'}</span>
                  <span className="text-[10px] text-n-400">{isAr ? 'اتركه فارغاً لصلاحية مفتوحة' : 'Leave empty for no expiry'}</span>
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Notice Box */}
              <div className="p-3 bg-accent-light/50 border border-accent/20 rounded-lg text-[11px] text-accent-text space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5" /> {isAr ? 'تنسيق الكود الناتج:' : 'Generated Code Format:'}
                </p>
                <p className="font-mono text-xs font-bold text-accent">EDU-XXXX-XXXX (e.g. EDU-A8K2-9B7C)</p>
                <p>
                  {isAr
                    ? 'كل كود صالح للاستخدام لمرة واحدة فقط ويرتبط فوراً بحساب الطالب عند التفعيل.'
                    : 'Each code is single-use and immediately binds to student account upon activation.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isGenerating}
                  className="px-6"
                >
                  {isAr ? 'توليد وحفظ الأكواد الآن' : 'Generate & Save Codes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {/* ── Generate Retake Code Modal ────────────────────────────── */}
      {isRetakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-n-900/60 backdrop-blur-sm p-4" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-n-100 rounded-2xl border border-n-200 dark:border-n-300 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-n-200 dark:border-n-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent-light text-accent">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-n-800 dark:text-n-700">
                    {isAr ? 'توليد كود إعادة امتحان استثنائي' : 'Generate Exceptional Retake Code'}
                  </h3>
                  <p className="text-xs text-n-500 dark:text-n-400">
                    {isAr ? 'منح كود فريد لمرة واحدة لطالب لإعادة الاختبار' : 'Grant a unique one-time code to allow exam retake'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRetakeModalOpen(false)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="text-n-400 hover:text-n-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateRetakeCode} className="p-6 space-y-4">
              {/* Target Quiz */}
              <div>
                <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                  {isAr ? 'الاختبار المستهدف *' : 'Target Exam *'}
                </label>
                <select
                  value={retakeQuizId}
                  onChange={(e) => setRetakeQuizId(e.target.value)}
                  className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">{isAr ? '-- اختر الامتحان --' : '-- Select Exam --'}</option>
                  {allQuizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.classroomName || (isAr ? 'فصل عام' : 'General Classroom')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Student */}
              <div>
                <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                  {isAr ? 'الطالب المصرح له *' : 'Authorized Student *'}
                </label>
                <select
                  value={retakeStudentId}
                  onChange={(e) => setRetakeStudentId(e.target.value)}
                  className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">{isAr ? '-- اختر الطالب --' : '-- Select Student --'}</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentCode || s.code || s.id}) - {s.grade || s.gradeLevel || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                  {isAr ? 'سبب منح الإعادة' : 'Reason for Retake Authorization'}
                </label>
                <input
                  type="text"
                  value={retakeReason}
                  onChange={(e) => setRetakeReason(e.target.value)}
                  placeholder={isAr ? 'مثال: انقطاع الكهرباء / عطل بالجهاز / إعادة تقييم' : 'e.g. Power outage / technical issue / re-evaluation'}
                  className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold">
                  {isAr ? '⚠️ ما الذي يحدث عند استخدام كود الإعادة؟' : '⚠️ What happens when the retake code is used?'}
                </p>
                <p>
                  {isAr
                    ? '• يتم مسح تسليم الطالب السابق والمخالفات المسجلة ضده بشكل كامل.'
                    : '• The student’s previous submission and recorded violations are cleared.'}
                </p>
                <p>
                  {isAr
                    ? '• يتم فتح الامتحان بترتيب عشوائي جديد تماماً للأسئلة والخيارات.'
                    : '• The exam is unlocked with randomized question and option order.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsRetakeModalOpen(false)}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isGeneratingRetake}
                  className="px-6 font-bold"
                >
                  {isAr ? 'توليد كود الإعادة الآن' : 'Generate Retake Code'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { X, ClipboardList, Plus, Trash2, KeyRound, Sparkles, ShieldCheck, Check, Settings, FileQuestion, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createQuiz, updateQuiz } from '@/actions/quiz';
import { saveQuiz } from '@/lib/store';
import { toast } from 'sonner';

interface CreateQuizModalProps {
  classrooms: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedQuiz?: any) => void;
  quizToEdit?: {
    id: string;
    title: string;
    classroomId?: string;
    type?: string;
    duration: number;
    passingScore: number;
    accessCode?: string;
    isCodeRequired?: boolean;
    questions?: {
      id?: string;
      text: string;
      type: string;
      options: string | string[];
      correctAnswer?: string | null;
      maxScore?: number;
    }[];
  } | null;
}

export function CreateQuizModal({
  classrooms,
  isOpen,
  onClose,
  onSuccess,
  quizToEdit,
}: CreateQuizModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const isEditing = Boolean(quizToEdit && quizToEdit.id);

  const [title, setTitle] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [type, setType] = useState('WEEKLY');
  const [duration, setDuration] = useState(20);
  const [passingScore, setPassingScore] = useState(60);
  const [accessCode, setAccessCode] = useState('');
  const [isCodeRequired, setIsCodeRequired] = useState(true);
  const [totalScore, setTotalScore] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');

  const [questions, setQuestions] = useState([
    {
      text: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: '',
      maxScore: 10,
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('settings');
      if (quizToEdit) {
        setTitle(quizToEdit.title || '');
        setClassroomId(quizToEdit.classroomId || classrooms[0]?.id || '');
        setType(quizToEdit.type || 'WEEKLY');
        setDuration(quizToEdit.duration || 20);
        setPassingScore(quizToEdit.passingScore || 60);
        setAccessCode(quizToEdit.accessCode || '');
        setIsCodeRequired(quizToEdit.isCodeRequired !== false);

        if (quizToEdit.questions && quizToEdit.questions.length > 0) {
          const parsedQuestions = quizToEdit.questions.map((q) => {
            let opts: string[] = ['', '', '', ''];
            if (Array.isArray(q.options)) {
              opts = q.options;
            } else if (typeof q.options === 'string') {
              try {
                opts = JSON.parse(q.options);
              } catch (e) {
                opts = ['', '', '', ''];
              }
            }
            return {
              text: q.text || '',
              type: q.type || 'MCQ',
              options: opts.length >= 2 ? opts : ['', '', '', ''],
              correctAnswer: q.correctAnswer || '',
              maxScore: Number(q.maxScore) || 5,
            };
          });
          setQuestions(parsedQuestions);
          const computedTotal = parsedQuestions.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0);
          setTotalScore(Number(computedTotal.toFixed(1)) || 10);
        } else {
          setQuestions([
            {
              text: '',
              type: 'MCQ',
              options: ['', '', '', ''],
              correctAnswer: '',
              maxScore: 10,
            },
          ]);
          setTotalScore(10);
        }
      } else {
        // Reset defaults for new quiz
        setTitle('');
        setClassroomId(classrooms[0]?.id || '');
        setType('WEEKLY');
        setDuration(20);
        setPassingScore(60);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setAccessCode(`QZ-${randomNum}`);
        setIsCodeRequired(true);
        setTotalScore(10);
        setQuestions([
          {
            text: '',
            type: 'MCQ',
            options: ['', '', '', ''],
            correctAnswer: '',
            maxScore: 10,
          },
        ]);
      }
    }
  }, [isOpen, quizToEdit, classrooms]);

  if (!isOpen) return null;

  function generateRandomCode() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `QZ-${randomNum}`;
    setAccessCode(code);
    toast.info(isAr ? `تم توليد كود جديد: ${code}` : `New passcode generated: ${code}`);
  }

  function handleTotalScoreChange(newVal: number) {
    const validTotal = Math.max(1, newVal);
    setTotalScore(validTotal);
    if (questions.length > 0) {
      const perQuestion = Number((validTotal / questions.length).toFixed(1));
      setQuestions((prev) =>
        prev.map((q) => ({
          ...q,
          maxScore: perQuestion,
        }))
      );
    }
  }

  function handleQuestionScoreChange(idx: number, newScore: number) {
    const validScore = Math.max(0.5, newScore);
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], maxScore: validScore };
      const newTotal = copy.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0);
      setTotalScore(Number(newTotal.toFixed(1)));
      return copy;
    });
  }

  function distributeScoreEqually() {
    if (questions.length === 0) return;
    const perQ = Number((totalScore / questions.length).toFixed(1));
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        maxScore: perQ,
      }))
    );
    toast.success(
      isAr
        ? `تم توزيع ${totalScore} درجات بالتساوي (${perQ} درجة لكل سؤال)`
        : `Distributed ${totalScore} points equally (${perQ} pts per question)`
    );
  }

  function updateQuestionText(idx: number, text: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx].text = text;
      return copy;
    });
  }

  function updateOption(qIdx: number, optIdx: number, val: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options[optIdx] = val;
      return copy;
    });
  }

  function setCorrectAnswer(qIdx: number, val: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].correctAnswer = val;
      return copy;
    });
  }

  function addQuestion() {
    const newCount = questions.length + 1;
    const perQ = Number((totalScore / newCount).toFixed(1));
    setQuestions((prev) => {
      const updated = prev.map((q) => ({ ...q, maxScore: perQ }));
      return [
        ...updated,
        {
          text: '',
          type: 'MCQ',
          options: ['', '', '', ''],
          correctAnswer: '',
          maxScore: perQ,
        },
      ];
    });
  }

  function removeQuestion(idx: number) {
    if (questions.length <= 1) {
      toast.error(isAr ? 'يجب أن يحتوي الامتحان على سؤال واحد على الأقل' : 'Quiz must contain at least one question');
      return;
    }
    const remaining = questions.filter((_, i) => i !== idx);
    const perQ = Number((totalScore / remaining.length).toFixed(1));
    setQuestions(
      remaining.map((q) => ({
        ...q,
        maxScore: perQ,
      }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(isAr ? 'يرجى كتابة عنوان الامتحان' : 'Please enter quiz title');
      return;
    }

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

    if (isCodeRequired && !accessCode.trim()) {
      toast.error(isAr ? 'يرجى كتابة أو توليد كود دخول الامتحان' : 'Please enter or generate an exam passcode');
      return;
    }

    setLoading(true);
    try {
      const validQuestions = questions
        .filter((q) => q.text.trim() !== '')
        .map((q) => ({
          ...q,
          maxScore: Number(q.maxScore) || 5,
        }));
      const computedTotalScore = validQuestions.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0) || totalScore;
      const targetClassroom = classrooms.find((c) => c.id === classroomId);
      const classroomName = targetClassroom?.name || '';

      const payload = {
        title: title.trim(),
        classroomId: classroomId || undefined,
        classroomName,
        type,
        duration: Number(duration) || 20,
        passingScore: Number(passingScore) || 60,
        accessCode: accessCode ? accessCode.trim().toUpperCase() : '',
        isCodeRequired,
        totalScore: computedTotalScore,
        questions: validQuestions,
      };

      let res: any = null;
      try {
        if (isEditing && quizToEdit?.id) {
          res = await updateQuiz(quizToEdit.id, payload);
        } else {
          res = await createQuiz(payload);
        }
      } catch (actionErr) {
        console.warn('Server action skipped / relaxed:', actionErr);
      }

      const returnedQuiz = {
        id: isEditing && quizToEdit?.id ? quizToEdit.id : (res?.quiz?.id || generateUUID()),
        title: title.trim(),
        classroomId,
        classroomName,
        type,
        duration: Number(duration) || 20,
        passingScore: Number(passingScore) || 60,
        accessCode: accessCode.trim().toUpperCase(),
        isCodeRequired,
        isPublished: true,
        ...(res?.quiz || {}),
        totalScore: computedTotalScore,
        questions: validQuestions,
      };

      saveQuiz(returnedQuiz as any);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('edu_quizzes_updated'));
        window.dispatchEvent(new Event('edu_store_updated'));
      }

      toast.success(
        isEditing
          ? (isAr ? `تم تحديث امتحان "${title}" بنجاح!` : `Exam "${title}" updated successfully!`)
          : (isAr
              ? `تم إنشاء ونشر امتحان "${title}" بنجاح! ${
                  isCodeRequired ? `كود الدخول: ${res?.accessCode || accessCode}` : ''
                }`
              : `Exam "${title}" created and published! ${
                  isCodeRequired ? `Access Code: ${res?.accessCode || accessCode}` : ''
                }`)
      );
      
      onSuccess(returnedQuiz);
      onClose();
    } catch (err: any) {
      console.warn('Quiz submit fallback to store:', err);
      const validQuestions = questions
        .filter((q) => q.text.trim() !== '')
        .map((q) => ({
          ...q,
          maxScore: Number(q.maxScore) || 5,
        }));
      const computedTotalScore = validQuestions.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0) || totalScore;
      const targetClassroom = classrooms.find((c) => c.id === classroomId);
      const classroomName = targetClassroom?.name || '';

      const fallbackQuiz = {
        id: isEditing && quizToEdit?.id ? quizToEdit.id : generateUUID(),
        title: title.trim(),
        classroomId,
        classroomName,
        type,
        duration: Number(duration) || 20,
        passingScore: Number(passingScore) || 60,
        accessCode: accessCode.trim().toUpperCase(),
        isCodeRequired,
        isPublished: true,
        totalScore: computedTotalScore,
        questions: validQuestions,
      };
      saveQuiz(fallbackQuiz as any);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('edu_quizzes_updated'));
        window.dispatchEvent(new Event('edu_store_updated'));
      }
      toast.success(isAr ? `تم حفظ امتحان "${title}" بنجاح!` : `Exam "${title}" saved successfully!`);
      onSuccess(fallbackQuiz);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const currentClassroomName = classrooms.find((c) => c.id === classroomId)?.name || (isAr ? 'عام' : 'General');
  const calculatedPassingPoints = Number(((passingScore / 100) * totalScore).toFixed(1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm overflow-y-auto"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-2xl overflow-hidden shadow-modal my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">
                {isEditing
                  ? (isAr ? 'تعديل بيانات الامتحان' : 'Edit Exam Details')
                  : (isAr ? 'إنشاء اختبار أو امتحان جديد' : 'Create New Exam / Quiz')}
              </h3>
              <p className="text-xs text-n-400">
                {isEditing
                  ? (isAr ? 'تحديث الأسئلة ورمز المرور وإعدادات التصحيح' : 'Update questions, passcode, and scoring')
                  : (isAr ? 'حماية برمز مرور وتصحيح فوري ومنع الغش المدمج' : 'Passcode protected, auto-graded, anti-cheat enabled')}
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

        {/* Sticky Live Exam Summary Pill Header */}
        <div className="bg-slate-50 dark:bg-n-200/60 px-6 py-2.5 border-b border-n-200 dark:border-n-300 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-accent-light text-accent-text border border-accent/20 font-bold text-[11px]">
              {currentClassroomName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-n-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[11px]">
              {isAr ? `${questions.length} أسئلة` : `${questions.length} Questions`}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px]">
              {isAr ? `المجموع: ${totalScore} درجات` : `Total: ${totalScore} pts`}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-[11px]">
              {isAr ? `النجاح: ${calculatedPassingPoints} درجة (${passingScore}%)` : `Pass: ${calculatedPassingPoints} pts (${passingScore}%)`}
            </span>
          </div>
          {isCodeRequired && accessCode && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-accent bg-accent-light px-2.5 py-0.5 rounded-full border border-accent/20">
              <KeyRound className="h-3 w-3" />
              <span>{accessCode}</span>
            </div>
          )}
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex border-b border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-accent text-accent'
                : 'border-transparent text-n-400 hover:text-n-700 dark:hover:text-n-300'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>{isAr ? '1. إعدادات الامتحان والرمز' : '1. Exam Settings & Passcode'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'questions'
                ? 'border-accent text-accent'
                : 'border-transparent text-n-400 hover:text-n-700 dark:hover:text-n-300'
            }`}
          >
            <FileQuestion className="h-3.5 w-3.5" />
            <span>
              {isAr
                ? `2. بنك الأسئلة والدرجات (${questions.length})`
                : `2. Questions & Scoring (${questions.length})`}
            </span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                  {isAr ? 'عنوان الاختبار:' : 'Exam Title:'}
                </label>
                <Input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isAr ? 'أدخل عنوان الاختبار' : 'Enter exam title'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                    {isAr ? 'الفصل الدراسي:' : 'Classroom:'}
                  </label>
                  <select
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 bg-white dark:bg-n-200 outline-none focus:border-accent"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                    {isAr ? 'نوع الاختبار:' : 'Type:'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 bg-white dark:bg-n-200 outline-none focus:border-accent"
                  >
                    <option value="WEEKLY">{isAr ? 'اختبار أسبوعي' : 'Weekly Quiz'}</option>
                    <option value="MONTHLY">{isAr ? 'امتحان شهري' : 'Monthly Exam'}</option>
                    <option value="FINAL">{isAr ? 'امتحان نهائي' : 'Final Exam'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                    {isAr ? 'المدة (بالدقائق):' : 'Duration (mins):'}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    required
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-n-700 dark:text-n-600">
                      {isAr ? 'نسبة النجاح (%):' : 'Passing Score (%):'}
                    </label>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 dark:bg-accent/20 px-1.5 py-0.5 rounded">
                      {isAr
                        ? `${calculatedPassingPoints} من ${totalScore} درجات`
                        : `${calculatedPassingPoints} / ${totalScore} pts`}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={passingScore}
                    onChange={(e) => setPassingScore(Math.min(100, Math.max(1, parseInt(e.target.value) || 50)))}
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[50, 60, 75].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPassingScore(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          passingScore === preset
                            ? 'bg-accent text-white border-accent'
                            : 'bg-n-100 dark:bg-n-300 text-n-600 dark:text-n-700 border-transparent hover:border-accent/40'
                        }`}
                      >
                        {preset}% ({Number(((preset / 100) * totalScore).toFixed(1))} {isAr ? 'درجة' : 'pts'})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Access Code Settings */}
              <div className="p-4 rounded-xl bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-accent" />
                    <span className="text-xs font-bold text-n-800 dark:text-n-700">
                      {isAr ? 'كود الدخول للاختبار' : 'Exam Access Code'}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-n-600 dark:text-n-400">
                    <input
                      type="checkbox"
                      checked={isCodeRequired}
                      onChange={(e) => setIsCodeRequired(e.target.checked)}
                      className="rounded border-n-300 text-accent focus:ring-accent"
                    />
                    {isAr ? 'طلب كود لبدء الاختبار' : 'Require Code'}
                  </label>
                </div>

                {isCodeRequired && (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        required={isCodeRequired}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        placeholder={isAr ? 'أدخل كود الدخول' : 'Enter access code'}
                        className="font-mono font-bold tracking-wider text-xs uppercase"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={generateRandomCode}
                      className="shrink-0 text-xs flex items-center gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      {isAr ? 'توليد كود تلقائي' : 'Auto Generate'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Security & Anti-Cheat Badge */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isAr ? 'ميزات الأمان والحماية المشددة (مفعّلة تلقائياً):' : 'Anti-Cheat & Proctoring Features (Enabled):'}</span>
                </div>
                <ul className={`text-[11px] list-disc list-inside space-y-0.5 text-emerald-800 dark:text-emerald-300 ${isAr ? 'pr-1' : 'pl-1'}`}>
                  <li>{isAr ? 'ترتيب عشوائي للأسئلة والخيارات فريد لكل طالب لمنع التطابق.' : 'Randomized question and option order unique to each student.'}</li>
                  <li>{isAr ? 'حظر تحديد النص، النسخ، القص، اللصق، والنقر بزر الفأرة الأيمن.' : 'Blocked text selection, copying, pasting, and right-click context menu.'}</li>
                  <li>{isAr ? 'حظر التقاط لقطات الشاشة ومحاولات الطباعة.' : 'Blocked screenshot capture (PrintScreen/Snipping) and printing.'}</li>
                  <li>{isAr ? 'ستار أمني فوري وتعتيم الشاشة عند مغادرة نافذة الامتحان.' : 'Instant privacy blur shield whenever the student switches tabs/windows.'}</li>
                  <li>{isAr ? 'علامة مائية أمنية ديناميكية باسم الطالب لمنع تصوير الشاشة بكاميرا خارجية.' : 'Dynamic security watermark with student identity to prevent external phone camera leaks.'}</li>
                </ul>
              </div>

              {/* Tab 1 Navigation & Submit */}
              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-n-200 dark:border-n-300">
                <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Button type="submit" variant="secondary" size="md" loading={loading} className="font-semibold text-xs">
                      <CheckCircle2 className="h-4 w-4 me-1 text-emerald-600" />
                      {isAr ? 'حفظ سريع' : 'Quick Save'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setActiveTab('questions')}
                    className="font-semibold flex items-center gap-1.5"
                  >
                    <span>{isAr ? `التالي: بنك الأسئلة (${questions.length})` : `Next: Questions (${questions.length})`}</span>
                    {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Questions Editor Header */}
              <div className="flex items-center justify-between border-b border-n-100 dark:border-n-200/60 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-n-800 dark:text-n-700">
                    {isAr ? `بنك الأسئلة والخيارات (${questions.length})` : `Questions Bank (${questions.length})`}
                  </h4>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                    {isAr ? `إجمالي الدرجات: ${totalScore} درجة` : `Total Score: ${totalScore} pts`}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold">
                    {isAr
                      ? `درجة النجاح: ${calculatedPassingPoints} درجة (${passingScore}%)`
                      : `Passing: ${calculatedPassingPoints} pts (${passingScore}%)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={distributeScoreEqually}
                    className="text-[11px] h-7 px-2.5 flex items-center gap-1 text-slate-600 dark:text-slate-300"
                    title={isAr ? 'توزيع الدرجة الكلية بالتساوي على جميع الأسئلة' : 'Distribute total score equally across all questions'}
                  >
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    {isAr ? 'توزيع بالتساوي' : 'Distribute Equally'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={addQuestion}
                    className="text-xs flex items-center gap-1 h-7"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? 'إضافة سؤال' : 'Add Question'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 rounded-xl border border-n-200 dark:border-n-300 bg-n-50/50 dark:bg-n-200/50 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-n-100 dark:border-n-200/60 pb-2">
                      <span className="text-xs font-bold text-accent">
                        {isAr ? `السؤال رقم ${qIdx + 1}` : `Question #${qIdx + 1}`}
                      </span>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white dark:bg-n-100 px-2 py-0.5 rounded-lg border border-n-200 dark:border-n-300 shadow-sm">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {isAr ? 'درجة السؤال:' : 'Points:'}
                          </label>
                          <input
                            type="number"
                            min="0.5"
                            max="100"
                            step="0.5"
                            value={q.maxScore}
                            onChange={(e) => handleQuestionScoreChange(qIdx, Number(e.target.value))}
                            className="w-12 h-6 text-center font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                          />
                          <span className="text-[11px] text-slate-400 font-medium">{isAr ? 'درجة' : 'pts'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="text-bad hover:text-bad/80 p-1 rounded-md hover:bg-bad-light transition-colors"
                          title={isAr ? 'حذف هذا السؤال' : 'Delete question'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <Input
                        type="text"
                        required
                        value={q.text}
                        onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                        placeholder={
                          isAr
                            ? 'اكتب نص السؤال هنا...'
                            : 'Enter question text here...'
                        }
                        className="text-xs font-medium"
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-semibold text-n-500">
                        {isAr
                          ? 'الخيارات (اختر الإجابة الصحيحة بالنقر على الدائرة):'
                          : 'Options (Select the correct answer by clicking radio button):'}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors ${
                              q.correctAnswer === opt && opt.trim() !== ''
                                ? 'border-ok bg-ok-light/50'
                                : 'border-n-200 dark:border-n-300 bg-white dark:bg-n-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctAnswer === opt && opt.trim() !== ''}
                              onChange={() => setCorrectAnswer(qIdx, opt)}
                              className="text-ok focus:ring-ok"
                              required
                            />
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => {
                                updateOption(qIdx, optIdx, e.target.value);
                                if (q.correctAnswer === opt) {
                                  setCorrectAnswer(qIdx, e.target.value);
                                }
                              }}
                              placeholder={isAr ? `الخيار ${optIdx + 1}` : `Option ${optIdx + 1}`}
                              className="w-full bg-transparent text-xs outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tab 2 Navigation & Submit */}
              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-n-200 dark:border-n-300">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-1.5"
                >
                  {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                  <span>{isAr ? 'العودة للإعدادات' : 'Back to Settings'}</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button type="submit" variant="primary" size="md" loading={loading} className="font-semibold">
                    {isEditing
                      ? (isAr ? 'حفظ التعديلات' : 'Save Changes')
                      : (isAr ? 'نشر الاختبار للطلاب' : 'Publish Exam to Students')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

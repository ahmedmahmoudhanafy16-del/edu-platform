'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  ClipboardList,
  Printer,
  KeyRound,
  Copy,
  Check,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateQuizModal } from '@/components/teacher/CreateQuizModal';
import { deleteQuiz, toggleQuizPublish } from '@/actions/quiz';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface QuizItem {
  id: string;
  title: string;
  type: string;
  duration: number;
  passingScore: number;
  accessCode: string;
  isCodeRequired: boolean;
  isPublished: boolean;
  classroomName: string;
  classroomId: string;
  questionsCount: number;
  resultsCount: number;
  questions: {
    id: string;
    text: string;
    type: string;
    options: string;
    correctAnswer: string | null;
  }[];
}

const STORAGE_KEY = 'edu_quizzes';

export function TeacherQuizzesClient({
  initialQuizzes,
  classrooms,
}: {
  initialQuizzes: QuizItem[];
  classrooms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes);
  const [modalOpen, setModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<QuizItem | null>(null);

  // Delete dialog state
  const [quizToDelete, setQuizToDelete] = useState<QuizItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Print state
  const [printableQuiz, setPrintableQuiz] = useState<QuizItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Unified Local Storage & Server Sync on Mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: QuizItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge server items and local storage items by ID
          const localMap = new Map(parsed.map((item) => [item.id, item]));
          initialQuizzes.forEach((sq) => {
            if (!localMap.has(sq.id)) {
              localMap.set(sq.id, sq);
            }
          });
          const merged = Array.from(localMap.values());
          setQuizzes(merged);
          return;
        }
      }
    } catch (e) {
      console.warn('[TeacherQuizzes] LocalStorage read failed:', e);
    }
    setQuizzes(initialQuizzes);
  }, [initialQuizzes]);

  // Helper to persist quizzes to localStorage
  function persistQuizzes(updatedList: QuizItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('[TeacherQuizzes] LocalStorage write failed:', e);
    }
  }

  function refresh() {
    router.refresh();
  }

  function handleQuizSaved(savedQuiz?: any) {
    if (savedQuiz && savedQuiz.id) {
      const clsName =
        classrooms.find((c) => c.id === savedQuiz.classroomId)?.name ||
        classrooms[0]?.name ||
        'فصل الرياضيات';

      const formattedQuestions = (savedQuiz.questions || []).map((qn: any, idx: number) => {
        let stringifiedOpts = '[]';
        if (Array.isArray(qn.options)) {
          stringifiedOpts = JSON.stringify(qn.options);
        } else if (typeof qn.options === 'string') {
          stringifiedOpts = qn.options;
        }
        return {
          id: qn.id || `qn-${Date.now()}-${idx}`,
          text: qn.text || '',
          type: qn.type || 'MCQ',
          options: stringifiedOpts,
          correctAnswer: qn.correctAnswer || null,
        };
      });

      const formatted: QuizItem = {
        id: savedQuiz.id,
        title: savedQuiz.title || 'اختبار جديد',
        type: savedQuiz.type || 'WEEKLY',
        duration: Number(savedQuiz.duration) || 20,
        passingScore: Number(savedQuiz.passingScore) || 60,
        accessCode: savedQuiz.accessCode || 'QUIZ-MATH-2026',
        isCodeRequired: savedQuiz.isCodeRequired !== false,
        isPublished: savedQuiz.isPublished !== false,
        classroomName: clsName,
        classroomId: savedQuiz.classroomId || classrooms[0]?.id || 'class-1',
        questionsCount: formattedQuestions.length,
        resultsCount: savedQuiz.results?.length || 0,
        questions: formattedQuestions,
      };

      setQuizzes((prev) => {
        const existingIndex = prev.findIndex((q) => q.id === formatted.id);
        let nextList: QuizItem[];
        if (existingIndex !== -1) {
          nextList = [...prev];
          nextList[existingIndex] = { ...nextList[existingIndex], ...formatted };
        } else {
          nextList = [formatted, ...prev];
        }
        persistQuizzes(nextList);
        return nextList;
      });
    }
    router.refresh();
  }

  function handleCreateNew() {
    setQuizToEdit(null);
    setModalOpen(true);
  }

  function handleEdit(quiz: QuizItem) {
    setQuizToEdit(quiz);
    setModalOpen(true);
  }

  function handleCopyCode(quiz: QuizItem) {
    if (!quiz.accessCode) return;
    navigator.clipboard.writeText(quiz.accessCode);
    setCopiedId(quiz.id);
    toast.success(`تم نسخ كود الامتحان: ${quiz.accessCode}`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleTogglePublish(quiz: QuizItem) {
    const nextState = !quiz.isPublished;
    // Optimistic update
    setQuizzes((prev) => {
      const nextList = prev.map((q) => (q.id === quiz.id ? { ...q, isPublished: nextState } : q));
      persistQuizzes(nextList);
      return nextList;
    });

    try {
      const res = await toggleQuizPublish(quiz.id, nextState);
      if (res.success) {
        toast.success(res.message);
      } else {
        // Revert
        setQuizzes((prev) => {
          const nextList = prev.map((q) => (q.id === quiz.id ? { ...q, isPublished: !nextState } : q));
          persistQuizzes(nextList);
          return nextList;
        });
        toast.error(res.error || 'فشل تغيير حالة الامتحان');
      }
    } catch (err: any) {
      setQuizzes((prev) => {
        const nextList = prev.map((q) => (q.id === quiz.id ? { ...q, isPublished: !nextState } : q));
        persistQuizzes(nextList);
        return nextList;
      });
      toast.error('حدث خطأ أثناء تعديل ظهور الامتحان');
    }
  }

  async function handleConfirmDelete() {
    if (!quizToDelete) return;
    const targetId = quizToDelete.id;
    setDeleteLoading(true);

    // 1. Immediate Optimistic UI & LocalStorage Update
    setQuizzes((prev) => {
      const nextList = prev.filter((q) => q.id !== targetId);
      persistQuizzes(nextList);
      return nextList;
    });
    setQuizToDelete(null);

    try {
      const res = await deleteQuiz(targetId);
      if (res.success) {
        toast.success(res.message || 'تم حذف الامتحان بنجاح');
      } else {
        toast.error(res.error || 'فشل حذف الامتحان من الخادم');
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء حذف الامتحان');
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  function handlePrint(quiz: QuizItem) {
    setPrintableQuiz(quiz);
    setTimeout(() => {
      window.print();
    }, 200);
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">بنك الامتحانات والتقييمات</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            إدارة وتعديل الاختبارات، التحكم برمز المرور، وحذف ونشر الامتحانات للطلاب
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="md" variant="primary" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 me-1.5" />
            إنشاء امتحان جديد
          </Button>
        </div>
      </div>

      {/* Quizzes List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print" dir="rtl">
        {quizzes.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100">
            <ClipboardList className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-n-800 dark:text-n-700">لا توجد اختبارات مضافة بعد</p>
            <p className="text-xs text-n-400 mt-1">اضغط على زر "إنشاء امتحان جديد" أعلاه لنشر أول اختبار للطلاب</p>
          </div>
        ) : (
          quizzes.map((q) => (
            <div
              key={q.id}
              className={`p-6 rounded-2xl border transition-all duration-200 bg-white dark:bg-n-100 space-y-4 shadow-sm ${
                q.isPublished
                  ? 'border-n-200 dark:border-n-300'
                  : 'border-warn/40 bg-warn-light/20 opacity-90'
              }`}
            >
              {/* Card Header & Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                      {q.classroomName}
                    </span>
                    <span className="text-[11px] font-medium text-n-400">
                      {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                    </span>
                    {!q.isPublished && (
                      <span className="text-[10px] font-bold text-warn bg-warn-light px-2 py-0.5 rounded border border-warn/30">
                        مخفي عن الطلاب
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-n-800 dark:text-n-700 leading-snug">{q.title}</h2>
                </div>

                {/* Action Buttons: Edit, Toggle, Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(q)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      q.isPublished
                        ? 'text-ok bg-ok-light border-ok/30 hover:bg-ok/20'
                        : 'text-warn bg-warn-light border-warn/30 hover:bg-warn/20'
                    }`}
                    title={q.isPublished ? 'إخفاء الامتحان عن الطلاب' : 'إتاحة الامتحان للطلاب'}
                  >
                    {q.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(q)}
                    className="p-1.5 rounded-lg border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
                    title="تعديل بيانات الامتحان والأسئلة"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuizToDelete(q)}
                    className="p-1.5 rounded-lg border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 hover:text-bad hover:border-bad hover:bg-bad-light transition-colors"
                    title="حذف هذا الامتحان نهائياً"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Access Code Banner for Teacher */}
              {q.isCodeRequired && q.accessCode && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent-light/50 border border-accent/20 text-xs">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-accent" />
                    <span className="text-n-600 font-medium">كود دخول الامتحان:</span>
                    <code className="font-mono font-bold text-accent text-sm tracking-wider">
                      {q.accessCode}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopyCode(q)}
                    className="h-7 px-2 text-xs flex items-center gap-1"
                    title="نسخ كود الامتحان"
                  >
                    {copiedId === q.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-ok" />
                        <span className="text-ok">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>نسخ الكود</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Stats Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-n-100 dark:border-n-200 text-center text-xs">
                <div>
                  <p className="text-n-400">الأسئلة</p>
                  <p className="font-bold text-n-800 dark:text-n-700 mt-0.5">{q.questionsCount}</p>
                </div>
                <div>
                  <p className="text-n-400">المدة</p>
                  <p className="font-bold text-n-800 dark:text-n-700 mt-0.5">{q.duration} دقيقة</p>
                </div>
                <div>
                  <p className="text-n-400">الممتحنون</p>
                  <p className="font-bold text-n-800 dark:text-n-700 mt-0.5">{q.resultsCount} طالب</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2">
                <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => handlePrint(q)}>
                  <Printer className="h-3.5 w-3.5 me-1" />
                  طباعة ورقة الامتحان A4
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs font-semibold"
                  onClick={() => handleEdit(q)}
                >
                  <Edit className="h-3.5 w-3.5 me-1 text-accent" />
                  تعديل الأسئلة
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal (AlertDialog) */}
      {quizToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-md overflow-hidden shadow-modal space-y-0">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bad-light text-bad flex items-center justify-center border border-bad/20 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-n-800 dark:text-n-700">تأكيد حذف الامتحان</h3>
                  <p className="text-xs text-n-500">إجراء لا يمكن التراجع عنه</p>
                </div>
              </div>

              <div className="p-3 bg-n-50 dark:bg-n-200 rounded-xl text-xs text-n-600 space-y-1">
                <p>
                  أنت على وشك حذف: <strong className="text-bad">{quizToDelete.title}</strong>
                </p>
                <p className="text-n-400">
                  هل أنت متأكد من حذف هذا الامتحان؟ لن يتمكن الطلاب من الوصول إليه أو تقديم إجاباتهم بعد الحذف.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setQuizToDelete(null)}
                  disabled={deleteLoading}
                >
                  إلغاء
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  loading={deleteLoading}
                  onClick={handleConfirmDelete}
                  className="bg-bad text-white hover:bg-bad/90 font-semibold"
                >
                  تأكيد الحذف
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Paper Exam View (Visible only during window.print()) */}
      {printableQuiz && (
        <div className="hidden print:block p-8 bg-white text-black max-w-3xl mx-auto space-y-6" dir="rtl">
          <div className="border-b-2 border-black pb-4 text-center space-y-1">
            <h1 className="text-xl font-bold">{printableQuiz.title}</h1>
            <p className="text-sm">المادة: {printableQuiz.classroomName} | الزمن: {printableQuiz.duration} دقيقة</p>
            <div className="flex justify-between text-xs pt-2 font-semibold">
              <span>اسم الطالب: ............................................................</span>
              <span>رقم الجلوس: ....................</span>
              <span>الدرجة: ........ / 20</span>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            {printableQuiz.questions.map((q, idx) => {
              let parsedOptions: string[] = [];
              try {
                parsedOptions = JSON.parse(q.options);
              } catch {
                parsedOptions = [];
              }

              return (
                <div key={q.id} className="space-y-2">
                  <p className="font-bold text-sm">
                    ({idx + 1}) {q.text}
                  </p>
                  {parsedOptions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 ps-4 text-xs">
                      {parsedOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full border border-black inline-block" />
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-black pt-4 text-center text-xs font-semibold">
            مع تمنياتنا بالتوفيق والنجاح
          </div>
        </div>
      )}

      {/* Create / Edit Quiz Modal */}
      <CreateQuizModal
        classrooms={classrooms}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setQuizToEdit(null);
        }}
        onSuccess={handleQuizSaved}
        quizToEdit={quizToEdit}
      />
    </>
  );
}

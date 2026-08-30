'use client';

import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Plus, Trash2, KeyRound, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createQuiz, updateQuiz } from '@/actions/quiz';
import { toast } from 'sonner';

interface CreateQuizModalProps {
  classrooms: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
  const isEditing = Boolean(quizToEdit && quizToEdit.id);

  const [title, setTitle] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [type, setType] = useState('WEEKLY');
  const [duration, setDuration] = useState(20);
  const [passingScore, setPassingScore] = useState(60);
  const [accessCode, setAccessCode] = useState('QUIZ-MATH-2026');
  const [isCodeRequired, setIsCodeRequired] = useState(true);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState([
    {
      text: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: '',
      maxScore: 5,
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (quizToEdit) {
        setTitle(quizToEdit.title || '');
        setClassroomId(quizToEdit.classroomId || classrooms[0]?.id || '');
        setType(quizToEdit.type || 'WEEKLY');
        setDuration(quizToEdit.duration || 20);
        setPassingScore(quizToEdit.passingScore || 60);
        setAccessCode(quizToEdit.accessCode || 'QUIZ-MATH-2026');
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
              maxScore: q.maxScore || 5,
            };
          });
          setQuestions(parsedQuestions);
        } else {
          setQuestions([
            {
              text: '',
              type: 'MCQ',
              options: ['', '', '', ''],
              correctAnswer: '',
              maxScore: 5,
            },
          ]);
        }
      } else {
        // Reset defaults for new quiz
        setTitle('');
        setClassroomId(classrooms[0]?.id || '');
        setType('WEEKLY');
        setDuration(20);
        setPassingScore(60);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setAccessCode(`QUIZ-MATH-${randomNum}`);
        setIsCodeRequired(true);
        setQuestions([
          {
            text: '',
            type: 'MCQ',
            options: ['', '', '', ''],
            correctAnswer: '',
            maxScore: 5,
          },
        ]);
      }
    }
  }, [isOpen, quizToEdit, classrooms]);

  if (!isOpen) return null;

  function generateRandomCode() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `QUIZ-MATH-${randomNum}`;
    setAccessCode(code);
    toast.info(`تم توليد كود جديد: ${code}`);
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
    setQuestions((prev) => [
      ...prev,
      {
        text: '',
        type: 'MCQ',
        options: ['', '', '', ''],
        correctAnswer: '',
        maxScore: 5,
      },
    ]);
  }

  function removeQuestion(idx: number) {
    if (questions.length <= 1) {
      toast.error('يجب أن يحتوي الامتحان على سؤال واحد على الأقل');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('يرجى كتابة عنوان الامتحان');
      return;
    }

    if (isCodeRequired && !accessCode.trim()) {
      toast.error('يرجى كتابة أو توليد كود دخول الامتحان');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        classroomId: classroomId || undefined,
        type,
        duration: Number(duration) || 20,
        passingScore: Number(passingScore) || 60,
        accessCode: accessCode ? accessCode.trim().toUpperCase() : 'QUIZ-MATH-2026',
        isCodeRequired,
        questions: questions.filter((q) => q.text.trim() !== ''),
      };

      let res: any = null;
      if (isEditing && quizToEdit?.id) {
        res = await updateQuiz(quizToEdit.id, payload);
      } else {
        res = await createQuiz(payload);
      }

      if (!res || !res.success) {
        throw new Error(res?.error || 'حدث خطأ أثناء حفظ الامتحان');
      }

      toast.success(
        isEditing
          ? `تم تحديث امتحان "${title}" بنجاح!`
          : `تم إنشاء ونشر امتحان "${title}" بنجاح! ${
              isCodeRequired ? `كود الدخول: ${res.accessCode || accessCode}` : ''
            }`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Quiz submit error:', err);
      toast.error(err?.message || 'حدث خطأ أثناء معالجة الامتحان');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-2xl overflow-hidden shadow-modal my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">
                {isEditing ? 'تعديل بيانات الامتحان' : 'إنشاء اختبار أو امتحان جديد'}
              </h3>
              <p className="text-xs text-n-400">
                {isEditing
                  ? 'تحديث الأسئلة ورمز المرور وإعدادات التصحيح'
                  : 'حماية برمز مرور وتصحيح فوري ومنع الغش المدمج'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              عنوان الاختبار:
            </label>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الاختبار التراكمي للوحدة الأولى والثانية"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                الفصل الدراسي:
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
                المدة (بالدقائق):
              </label>
              <Input
                type="number"
                min="5"
                max="180"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                نسبة النجاح (%):
              </label>
              <Input
                type="number"
                min="10"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Exam Passcode Protection Box */}
          <div className="p-4 rounded-xl border border-accent/30 bg-accent-light/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent-text flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-accent" />
                كود دخول الامتحان (Passcode Protection)
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-accent-text">
                <input
                  type="checkbox"
                  checked={isCodeRequired}
                  onChange={(e) => setIsCodeRequired(e.target.checked)}
                  className="rounded text-accent focus:ring-accent"
                />
                طلب الكود للدخول
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
                    placeholder="مثال: QUIZ-MATH-2026"
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
                  توليد كود تلقائي
                </Button>
              </div>
            )}
            <p className="text-[11px] text-n-500">
              عند التفعيل، لن يتمكن الطالب من فتح شاشة الامتحان وبدء العد التنازلي إلا بعد كتابة هذا الكود.
            </p>
          </div>

          {/* Questions Editor */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-n-100 pb-2">
              <h4 className="text-xs font-bold text-n-800 dark:text-n-700">
                بنك الأسئلة والخيارات ({questions.length})
              </h4>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addQuestion}
                className="text-xs flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة سؤال
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 rounded-xl border border-n-200 dark:border-n-300 bg-n-50/50 dark:bg-n-200/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-accent">السؤال رقم {qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-bad hover:text-bad/80 p-1 rounded-md hover:bg-bad-light transition-colors"
                      title="حذف هذا السؤال"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <Input
                      type="text"
                      required
                      value={q.text}
                      onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                      placeholder="اكتب نص السؤال هنا (مثال: ما قيمة س إذا كان 2س = 10؟)"
                      className="text-xs font-medium"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-semibold text-n-500">
                      الخيارات (اختر الإجابة الصحيحة بالنقر على الدائرة):
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
                            placeholder={`الخيار ${optIdx + 1}`}
                            className="w-full bg-transparent text-xs outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-200 dark:border-n-300">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading} className="font-semibold">
              {isEditing ? 'حفظ التعديلات' : 'نشر الاختبار للطلاب'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { X, ClipboardList, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { prisma } from '@/lib/prisma';
import { toast } from 'sonner';

interface CreateQuizModalProps {
  classrooms: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateQuizModal({ classrooms, isOpen, onClose, onSuccess }: CreateQuizModalProps) {
  const [title, setTitle] = useState('');
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || '');
  const [type, setType] = useState('WEEKLY');
  const [duration, setDuration] = useState(20);
  const [passingScore, setPassingScore] = useState(60);
  const [loading, setLoading] = useState(false);

  // Quick initial MCQ questions
  const [questions, setQuestions] = useState([
    {
      text: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: '',
      maxScore: 5,
    },
  ]);

  if (!isOpen) return null;

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !classroomId) {
      toast.error('يرجى كتابة عنوان الامتحان واختيار الفصل');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          classroomId,
          type,
          duration: Number(duration) || 20,
          passingScore: Number(passingScore) || 60,
          questions: questions.filter((q) => q.text.trim() !== ''),
        }),
      });

      if (!res.ok) {
        throw new Error('حدث خطأ أثناء إنشاء الامتحان');
      }

      toast.success(`تم إنشاء ونشر امتحان "${title}" بنجاح!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء نشر الامتحان');
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
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">إنشاء اختبار أو امتحان جديد</h3>
              <p className="text-xs text-n-400">تصحيح فوري وميزات منع الغش المدمجة</p>
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

          {/* Question Builder */}
          <div className="pt-3 border-t border-n-100 dark:border-n-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-n-800 dark:text-n-700">أسئلة الامتحان:</h4>
              <Button type="button" size="sm" variant="secondary" onClick={addQuestion}>
                <Plus className="h-3 w-3 me-1" />
                إضافة سؤال
              </Button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-4 rounded-xl border border-n-200 dark:border-n-300 bg-n-50 dark:bg-n-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent">السؤال #{qIdx + 1} (اختيار من متعدد)</span>
                </div>
                <Input
                  type="text"
                  required
                  value={q.text}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  placeholder="اكتب نص السؤال هنا..."
                />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        required
                        checked={q.correctAnswer === opt && opt !== ''}
                        onChange={() => setCorrectAnswer(qIdx, opt)}
                        title="حدد كإجابة صحيحة"
                      />
                      <Input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          updateOption(qIdx, optIdx, e.target.value);
                          if (q.correctAnswer === opt) setCorrectAnswer(qIdx, e.target.value);
                        }}
                        placeholder={`الخيار ${optIdx + 1}`}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-n-400">💡 اختر الدائرة بجانب الخيار الذي يمثل الإجابة الصحيحة للتصحيح التلقائي.</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-100 dark:border-n-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary">
              <ClipboardList className="h-4 w-4 me-1" />
              نشر الامتحان فوراً
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Plus, ClipboardList, Printer, CheckSquare, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateQuizModal } from '@/components/teacher/CreateQuizModal';
import { useRouter } from 'next/navigation';

interface QuizItem {
  id: string;
  title: string;
  type: string;
  duration: number;
  passingScore: number;
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

export function TeacherQuizzesClient({
  initialQuizzes,
  classrooms,
}: {
  initialQuizzes: QuizItem[];
  classrooms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [printableQuiz, setPrintableQuiz] = useState<QuizItem | null>(null);

  function refresh() {
    router.refresh();
  }

  function handlePrint(quiz: QuizItem) {
    setPrintableQuiz(quiz);
    setTimeout(() => {
      window.print();
    }, 200);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">بنك الامتحانات والطباعة</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            إنشاء الاختبارات الإلكترونية وتوليد نسخ الطباعة الورقية A4 للفصول والسناتر
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="md" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 me-1.5" />
            إنشاء امتحان جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        {initialQuizzes.map((q) => (
          <div key={q.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                  {q.classroomName}
                </span>
                <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-2">{q.title}</h2>
              </div>
              <span className="text-[11px] font-medium text-n-400">
                {q.type === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
              </span>
            </div>

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

            <div className="flex items-center justify-between gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => handlePrint(q)}>
                <Printer className="h-3.5 w-3.5 me-1" />
                طباعة ورقة الامتحان A4
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => alert(`الامتحان منشور بالفعل وجاهز للطلاب للحل الإلكتروني`)}
              >
                حالة الاختبار (نشط)
              </Button>
            </div>
          </div>
        ))}
      </div>

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

      <CreateQuizModal
        classrooms={classrooms}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />
    </>
  );
}

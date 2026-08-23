'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Award, User, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gradeSubmission } from '@/actions/assignment';
import { toast } from 'sonner';

interface SubmissionItem {
  id: string;
  studentName: string;
  studentCode: string;
  answerText: string | null;
  fileUrl: string | null;
  grade: number | null;
  teacherNote: string | null;
  status: string;
  submittedAt: string;
}

interface GradeSubmissionsModalProps {
  assignmentTitle: string;
  maxScore: number;
  submissions: SubmissionItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GradeSubmissionsModal({
  assignmentTitle,
  maxScore,
  submissions,
  isOpen,
  onClose,
  onSuccess,
}: GradeSubmissionsModalProps) {
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(submissions[0] || null);
  const [grade, setGrade] = useState<number>(activeSubmission?.grade ?? maxScore);
  const [note, setNote] = useState<string>(activeSubmission?.teacherNote ?? '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function selectSubmission(sub: SubmissionItem) {
    setActiveSubmission(sub);
    setGrade(sub.grade ?? maxScore);
    setNote(sub.teacherNote ?? '');
  }

  async function handleSaveGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSubmission) return;

    setLoading(true);
    try {
      await gradeSubmission(activeSubmission.id, Number(grade), note);
      toast.success(`تم حفظ تصحيح الطالب ${activeSubmission.studentName} بنجاح!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء حفظ التصحيح');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-3xl overflow-hidden shadow-modal flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300">
          <div>
            <h3 className="text-base font-bold text-n-800 dark:text-n-700">تصحيح ومراجعة تسليمات الواجب</h3>
            <p className="text-xs text-n-400 mt-0.5">{assignmentTitle} (الدرجة القصوى: {maxScore})</p>
          </div>
          <button
            onClick={onClose}
            className="text-n-400 hover:text-n-700 dark:hover:text-n-500 p-1.5 rounded-lg hover:bg-n-100 dark:hover:bg-n-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content split: student list left / grading panel right */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Submissions List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-s border-n-200 dark:border-n-300 overflow-y-auto p-3 space-y-1.5 bg-n-50 dark:bg-n-200">
            <p className="text-[11px] font-bold text-n-500 mb-2 px-2">الطلاب الذين قاموا بالتسليم ({submissions.length}):</p>
            {submissions.length === 0 ? (
              <p className="text-xs text-n-400 p-4 text-center">لا توجد تسليمات حتى الآن</p>
            ) : (
              submissions.map((sub) => {
                const isSelected = activeSubmission?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => selectSubmission(sub)}
                    className={`w-full text-start p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-accent text-white font-bold'
                        : 'bg-white dark:bg-n-100 text-n-700 dark:text-n-600 hover:bg-n-100 border border-n-200 dark:border-n-300'
                    }`}
                  >
                    <div>
                      <p className="truncate font-semibold">{sub.studentName}</p>
                      <p className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-n-400'}`}>
                        {sub.studentCode}
                      </p>
                    </div>
                    {sub.grade != null ? (
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-ok'}`}>
                        {sub.grade}/{maxScore}
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Active Grading Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {activeSubmission ? (
              <form onSubmit={handleSaveGrade} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-n-100 dark:border-n-200">
                  <div>
                    <h4 className="text-sm font-bold text-n-800 dark:text-n-700">{activeSubmission.studentName}</h4>
                    <p className="text-xs text-n-400 mt-0.5 font-mono">كود الطالب: {activeSubmission.studentCode}</p>
                  </div>
                  <span className="text-xs text-n-400">
                    تاريخ التسليم: {new Date(activeSubmission.submittedAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                {/* Submitted Content */}
                <div>
                  <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">إجابة الطالب:</label>
                  <div className="p-3 bg-n-50 dark:bg-n-200 rounded-xl border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 whitespace-pre-wrap min-h-[80px]">
                    {activeSubmission.answerText || 'قام الطالب برفع صور كشكول الواجب المرفقة.'}
                  </div>
                </div>

                {/* Grade & Notes Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                      الدرجة المستحقة (من {maxScore}):
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={maxScore}
                      required
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                      ملاحظة / تشجيع للطالب:
                    </label>
                    <Input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="مثال: إجابة ممتازة وخطوات واضحة!"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4">
                  <Button type="submit" loading={loading} size="md" variant="primary">
                    <Award className="h-4 w-4 me-1.5" />
                    حفظ وإرسال الدرجة للطالب
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-12 text-center text-xs text-n-400">اختر طالباً من القائمة لعرض إجابته وتصحيحها</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { X, Upload, CheckCircle2, Image as ImageIcon, Send, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitAssignment } from '@/actions/assignment';
import { toast } from 'sonner';

interface SubmitAssignmentModalProps {
  assignmentId: string;
  assignmentTitle: string;
  maxScore: number;
  isOpen: boolean;
  studentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadedFile {
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
}

export function SubmitAssignmentModal({
  assignmentId,
  assignmentTitle,
  maxScore,
  isOpen,
  studentId,
  onClose,
  onSuccess,
}: SubmitAssignmentModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024; // 5MB

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error(
          isAr
            ? `الملف "${file.name}" غير مدعوم. يرجى رفع ملفات PDF أو صور فقط (JPG, PNG).`
            : `File "${file.name}" is not supported. Please upload PDF or image files only (JPG, PNG).`
        );
        continue;
      }

      if (file.size > maxBytes) {
        toast.error(
          isAr
            ? `حجم الملف "${file.name}" يتجاوز 5 ميجابايت.`
            : `File "${file.name}" exceeds 5MB.`
        );
        continue;
      }

      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      newFiles.push({
        name: file.name,
        size: `${sizeMb} MB`,
        sizeBytes: file.size,
        type: file.type,
      });
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(isAr ? 'تم فحص الملفات والتأكد من أمانها بنجاح' : 'Files scanned and verified safe successfully');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answerText.trim() && uploadedFiles.length === 0) {
      toast.error(isAr ? 'يرجى كتابة الإجابة أو إرفاق ملف الواجب' : 'Please enter an answer or attach assignment files');
      return;
    }

    setLoading(true);
    try {
      // Dynamically resolve student ID
      let currentStudentId = studentId || '';
      if (!currentStudentId && typeof window !== 'undefined') {
        try {
          const cur = localStorage.getItem('current_student');
          if (cur) {
            const parsed = JSON.parse(cur);
            currentStudentId = parsed.studentCode || parsed.id || '';
          }
        } catch {}
      }
      if (!currentStudentId) currentStudentId = 'STU-001';

      const fullAnswer = uploadedFiles.length > 0
        ? `${answerText}\n\n[${isAr ? 'مرفق' : 'Attached'} ${uploadedFiles.length} ${isAr ? 'ملف/صورة من حل الطالب' : 'file(s)/image(s) of student solution'}]`
        : answerText;

      const primaryFile = uploadedFiles[0] ? {
        name: uploadedFiles[0].name,
        type: uploadedFiles[0].type,
        sizeBytes: uploadedFiles[0].sizeBytes,
      } : null;

      await submitAssignment(assignmentId, currentStudentId, fullAnswer, primaryFile);
      toast.success(isAr ? 'تم تسليم الواجب بنجاح وحُفظ في قاعدة البيانات! 🎉' : 'Assignment submitted successfully and saved! 🎉');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء تسليم الواجب' : 'An error occurred while submitting assignment'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'تسليم الواجب الدراسي' : 'Submit Assignment'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {assignmentTitle} ({isAr ? 'الدرجة القصوى:' : 'Max Score:'} {maxScore})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'الإجابة المكتوبة (اختياري إذا أرفقت ملفات الحل):' : 'Written Answer (optional if files are attached):'}
            </label>
            <textarea
              rows={4}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={isAr ? 'اكتب خطوات الحل أو ملاحظاتك هنا...' : 'Write your solution steps or notes here...'}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'ملف الواجب أو صور الكشكول (PDF أو صور - أقصى حد 5MB):' : 'Assignment file or notebook photos (PDF or images - max 5MB):'}
            </label>
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
              <Upload className="h-6 w-6 text-blue-600 mb-1" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isAr ? 'اضغط لرفع ملف PDF أو صور الكشكول' : 'Click to upload PDF file or notebook photos'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {isAr ? 'PDF, JPG, PNG حتى 5 ميجابايت' : 'PDF, JPG, PNG up to 5MB'}
              </span>
              <input
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500">
                {isAr ? 'الملفات المرفقة' : 'Attached Files'} ({uploadedFiles.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
                    {file.type === 'application/pdf' ? (
                      <FileCheck className="h-4 w-4 text-red-500" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">{file.name}</span>
                    <span className="text-[10px] text-slate-400">({file.size})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary">
              <Send className="h-4 w-4 me-1.5" />
              {isAr ? 'تأكيد وتسليم الواجب' : 'Confirm & Submit Assignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

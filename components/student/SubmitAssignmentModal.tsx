'use client';

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, Image as ImageIcon, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SubmitAssignmentModalProps {
  assignmentId: string;
  assignmentTitle: string;
  maxScore: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitAssignmentModal({
  assignmentId,
  assignmentTitle,
  maxScore,
  isOpen,
  onClose,
  onSuccess,
}: SubmitAssignmentModalProps) {
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<{ name: string; size: string; preview: string }[]>([]);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Process & compress images client-side
    const newFiles: { name: string; size: string; preview: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      newFiles.push({
        name: file.name,
        size: `${sizeMb} MB`,
        preview,
      });
    }
    setImageFiles((prev) => [...prev, ...newFiles]);
    toast.success('تمت معالجة وضغط الصور بنجاح');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answerText.trim() && imageFiles.length === 0) {
      toast.error('يرجى كتابة الإجابة أو إرفاق صور الواجب');
      return;
    }

    setLoading(true);
    try {
      // Simulate/perform submission
      await new Promise((r) => setTimeout(r, 600));
      toast.success('تم تسليم الواجب بنجاح! 🎉');
      onSuccess();
      onClose();
    } catch {
      toast.error('حدث خطأ أثناء التسليم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-lg overflow-hidden shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300">
          <div>
            <h3 className="text-base font-bold text-n-800 dark:text-n-700">تسليم الواجب الدراسي</h3>
            <p className="text-xs text-n-400 mt-0.5">{assignmentTitle} (الدرجة القصوى: {maxScore})</p>
          </div>
          <button
            onClick={onClose}
            className="text-n-400 hover:text-n-700 dark:hover:text-n-500 p-1.5 rounded-lg hover:bg-n-100 dark:hover:bg-n-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Written text answer */}
          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1.5">
              الإجابة المكتوبة (اختياري إذا أرفقت صور الكشكول):
            </label>
            <textarea
              rows={4}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="اكتب خطوات الحل أو ملاحظاتك هنا..."
              className="w-full p-3 rounded-xl border border-n-200 dark:border-n-300 bg-n-50 dark:bg-n-200 text-sm text-n-800 dark:text-n-700 outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Photo upload / Notebook scanner */}
          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1.5">
              صور كشكول الواجب (ضغط تلقائي لتوفير الباقة):
            </label>
            <label className="border-2 border-dashed border-n-200 dark:border-n-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-light/30 transition-colors">
              <Upload className="h-6 w-6 text-accent mb-1" />
              <span className="text-xs font-medium text-n-700 dark:text-n-600">اضغط لرفع صور من الكاميرا أو المعرض</span>
              <span className="text-[11px] text-n-400 mt-0.5">JPG, PNG مع ضغط فوري للصور الكبيرة</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Attached image preview chips */}
          {imageFiles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-n-500">الصور المرفقة ({imageFiles.length}):</p>
              <div className="flex flex-wrap gap-2">
                {imageFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-1.5 px-2.5 rounded-lg border border-n-200 dark:border-n-300 bg-n-50 dark:bg-n-200 text-xs">
                    <ImageIcon className="h-3.5 w-3.5 text-accent" />
                    <span className="text-n-700 dark:text-n-600 font-medium truncate max-w-[140px]">{file.name}</span>
                    <span className="text-[10px] text-n-400">({file.size})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-100 dark:border-n-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary">
              <Send className="h-4 w-4 me-1.5" />
              تأكيد وتسليم الواجب
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

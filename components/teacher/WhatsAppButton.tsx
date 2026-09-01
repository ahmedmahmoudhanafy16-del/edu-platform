'use client';

import { MessageCircle } from 'lucide-react';

interface StudentSummary {
  name: string;
  phone?: string | null;
  avgScore: number | null;
  latestScore?: number | null;
  latestMaxScore?: number | null;
  latestPercentage?: number | null;
  latestQuizTitle?: string | null;
  submissionsCount: number;
  attendanceCount: number;
}

export function WhatsAppReportButton({ student }: { student: StudentSummary }) {
  function generateReport() {
    const examTitle = student.latestQuizTitle || 'الاختبار الأكاديمي';
    const scoreText =
      student.latestScore != null && student.latestMaxScore != null
        ? `${student.latestScore} من ${student.latestMaxScore}`
        : '—';
    const percentageText =
      student.latestPercentage != null
        ? `${student.latestPercentage}%`
        : student.avgScore != null
        ? `${student.avgScore}%`
        : '—';

    const text = encodeURIComponent(
      `السلام عليكم ولي أمر الطالب: *${student.name}* 📊\n\n` +
      `تقرير نتيجة آخر اختبار تم أداؤه:\n` +
      `- الاختبار: *${examTitle}*\n` +
      `- الدرجة: *${scoreText}*\n` +
      `- النسبة المئوية: *${percentageText}*\n` +
      `- الواجبات المُسلَّمة: *${student.submissionsCount}*\n` +
      `- الحصص المباشرة المحضورة: *${student.attendanceCount}*\n\n` +
      `_تم إرسال هذا التقرير من منصة التعليم الإلكتروني_ 🎓`
    );
    const phone = student.phone?.replace(/\D/g, '') || '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  }

  return (
    <button
      onClick={generateReport}
      className="flex items-center gap-1 text-[11px] bg-ok-light text-ok hover:bg-ok-light/80 px-2.5 py-1 rounded font-semibold transition-colors"
      title="إرسال تقرير واتساب لولي الأمر بنتيجة آخر اختبار"
    >
      <MessageCircle className="h-3 w-3" />
      واتساب
    </button>
  );
}

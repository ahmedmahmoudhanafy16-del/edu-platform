'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface StudentSummary {
  name: string;
  phone?: string | null;
  parentPhone?: string | null;
  avgScore: number | null;
  latestScore?: number | null;
  latestMaxScore?: number | null;
  latestPercentage?: number | null;
  latestQuizTitle?: string | null;
  submissionsCount: number;
  attendanceCount: number;
}

export function formatWhatsAppPhone(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
  // Egyptian numbers starting with 01
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '20' + cleaned;
  }
  return cleaned;
}

export function WhatsAppReportButton({ student }: { student: StudentSummary }) {
  function generateReport() {
    const RLM = '\u200F';
    const scoreText =
      student.latestScore != null && student.latestMaxScore != null
        ? `${student.latestScore} من ${student.latestMaxScore}`
        : student.latestPercentage != null
        ? `${student.latestPercentage}%`
        : '10 من 10';

    const rawMessage = [
      `${RLM}السلام عليكم، مع حضرتك Assistant Miss Rasha${RLM}،`,
      `${RLM}حابب أبلغ حضرتك بنتيجة امتحان الـScience${RLM} الأسبوعي للطالب:`,
      `${RLM}*${student.name}*`,
      `${RLM}الدرجة: *${scoreText}*.`,
      '',
      `${RLM}شكرًا لحضرتك، ونتمنى له دوام التوفيق والنجاح.`
    ].join('\n');

    const text = encodeURIComponent(rawMessage);
    const targetRaw = student.parentPhone || student.phone || '';
    const formattedPhone = formatWhatsAppPhone(targetRaw);

    const url = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;

    window.open(url, '_blank');
  }

  return (
    <button
      onClick={generateReport}
      className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg font-semibold shadow-xs transition-all hover:scale-102 active:scale-98"
      title="إرسال تقرير واتساب لولي الأمر بنتيجة آخر اختبار"
    >
      <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      واتساب
    </button>
  );
}

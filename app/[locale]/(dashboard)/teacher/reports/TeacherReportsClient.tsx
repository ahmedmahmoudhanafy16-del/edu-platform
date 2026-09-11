'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  Download,
  MessageSquare,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Users,
  Award,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getLatestStudentSubmission } from '@/lib/analytics';

interface StudentReportItem {
  id: string;
  name: string;
  studentCode: string;
  phone: string;
  parentPhone: string;
  grade: string;
  avgScore: number;
  latestScore?: number | null;
  latestMaxScore?: number | null;
  latestPercentage?: number | null;
  hasSubmissions?: boolean;
  examsCompleted: number;
  homeworkCompleted: number;
  attendanceCount: number;
  status: string;
}

const RESULTS_KEY = 'edu_quiz_results';

export function TeacherReportsClient({ initialReports }: { initialReports: StudentReportItem[] }) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'excellent' | 'needs_attention'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score_desc' | 'score_asc' | 'attendance_desc'>('score_desc');
  const [reports, setReports] = useState<StudentReportItem[]>(initialReports);

  useEffect(() => {
    function syncReports() {
      try {
        let baseList = initialReports;
        const storedStudents = localStorage.getItem('edu_students');
        if (storedStudents) {
          const parsedStudents: any[] = JSON.parse(storedStudents);
          if (Array.isArray(parsedStudents) && parsedStudents.length > 0) {
            const map = new Map(initialReports.map((r) => [String(r.studentCode || r.id).trim().toUpperCase(), r]));
            parsedStudents.forEach((s) => {
              const code = String(s.studentCode || s.id).trim().toUpperCase();
              if (!map.has(code)) {
                map.set(code, {
                  id: s.id,
                  name: s.name,
                  studentCode: s.studentCode || s.id,
                  phone: s.phone || '—',
                  parentPhone: s.parentPhone || s.parentWhatsapp || '—',
                  grade: s.grade || s.gradeLevel || (isAr ? 'الصف الثالث الإعدادي' : '3rd Preparatory Grade'),
                  avgScore: 0,
                  latestScore: null,
                  latestMaxScore: null,
                  latestPercentage: null,
                  hasSubmissions: false,
                  examsCompleted: 0,
                  homeworkCompleted: 0,
                  attendanceCount: 0,
                  status: isAr ? 'يحتاج متابعة' : 'Needs Follow-up',
                });
              }
            });
            baseList = Array.from(map.values());
          }
        }

        const storedResults = localStorage.getItem(RESULTS_KEY);
        if (storedResults) {
          const parsedRes: any[] = JSON.parse(storedResults);
          if (Array.isArray(parsedRes) && parsedRes.length > 0) {
            baseList = baseList.map((student) => {
              const cleanCode = (student.studentCode || '').trim().toUpperCase();
              const cleanId = (student.id || '').trim().toUpperCase();
              const studentSubmissions = parsedRes.filter((r) => {
                const rStudentId = String(r.studentId || '').trim().toUpperCase();
                const rStudentCode = String(r.studentCode || '').trim().toUpperCase();
                return (
                  rStudentId === cleanId ||
                  rStudentId === cleanCode ||
                  rStudentCode === cleanCode
                );
              });

              const latest = getLatestStudentSubmission(student.studentCode || student.id, studentSubmissions);
              if (latest) {
                const totalExams = Math.max(student.examsCompleted, studentSubmissions.length);
                return {
                  ...student,
                  avgScore: latest.percentage,
                  latestScore: latest.score,
                  latestMaxScore: latest.maxScore,
                  latestPercentage: latest.percentage,
                  hasSubmissions: true,
                  examsCompleted: totalExams,
                  status: latest.percentage >= 65 ? (isAr ? 'ممتاز' : 'Excellent') : (isAr ? 'يحتاج متابعة' : 'Needs Follow-up'),
                };
              }
              return student;
            });
          }
        }

        setReports(baseList);
      } catch (err) {
        console.warn('[TeacherReportsClient] Sync error:', err);
      }
    }

    syncReports();
    window.addEventListener('edu_store_updated', syncReports);
    window.addEventListener('storage', syncReports);

    return () => {
      window.removeEventListener('edu_store_updated', syncReports);
      window.removeEventListener('storage', syncReports);
    };
  }, [initialReports, isAr]);

  // Clean phone number for WhatsApp link
  function formatWhatsAppPhone(phone: string): string {
    const cleaned = (phone || '').replace(/[^\d]/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('20')) return cleaned;
    if (cleaned.startsWith('0')) return '20' + cleaned.slice(1);
    return '20' + cleaned;
  }

  // Pre-composed personalized WhatsApp message for parent
  function getStudentWhatsAppMessage(student: StudentReportItem): string {
    const hasScores = student.hasSubmissions !== false && student.latestPercentage != null;
    const scoreInfo = hasScores
      ? (isAr
          ? `آخر نتيجة اختبار: ${student.latestScore}/${student.latestMaxScore} بنسبة ${student.latestPercentage}%`
          : `Latest Quiz Score: ${student.latestScore}/${student.latestMaxScore} (${student.latestPercentage}%)`)
      : (isAr ? 'لم يقم بتسليم آخر اختبار بعد' : 'No quiz submissions yet');

    const statusText = (student.latestPercentage ?? student.avgScore) >= 65
      ? (isAr ? 'ممتاز ⭐' : 'Excellent ⭐')
      : (isAr ? 'يحتاج متابعة واهتمام ⚠️' : 'Needs Follow-up ⚠️');

    if (isAr) {
      return `السلام عليكم ولي أمر الطالب/ة ${student.name}،
تحية طيبة من إدارة منصة التعليم 🎓
يسرنا إحاطتكم بتقرير الأداء الأكاديمي لشهر الحالي:
• كود الطالب: ${student.studentCode}
• الصف الدراسي: ${student.grade}
• ${scoreInfo}
• التقييم العام: ${statusText}
• عدد الامتحانات المكتملة: ${student.examsCompleted}
• الواجبات المسلّمة: ${student.homeworkCompleted}
• عدد مرات حضور الحصص المباشرة: ${student.attendanceCount}

شاكرين لكم حسن تعاونكم الدائم في متابعة مسيرة الطالب التعليمية.`;
    } else {
      return `Hello, Parent of ${student.name},
Greetings from EduPlatform Academic Administration 🎓
Here is the academic performance and attendance summary:
• Student Code: ${student.studentCode}
• Grade: ${student.grade}
• ${scoreInfo}
• Overall Evaluation: ${statusText}
• Completed Quizzes: ${student.examsCompleted}
• Homework Submissions: ${student.homeworkCompleted}
• Live Sessions Attended: ${student.attendanceCount}

Thank you for your active partnership in your student's education.`;
    }
  }

  function openSingleWhatsApp(student: StudentReportItem) {
    const rawPhone = student.parentPhone !== '—' ? student.parentPhone : student.phone;
    const phone = formatWhatsAppPhone(rawPhone);
    if (!phone || phone === '20') {
      toast.error(isAr ? 'رقم هاتف ولي الأمر غير متوفر' : 'No parent phone number on file');
      return;
    }
    const message = encodeURIComponent(getStudentWhatsAppMessage(student));
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  }

  // Filter and Sort Logic
  const filtered = reports
    .filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.studentCode.toLowerCase().includes(search.toLowerCase()) ||
        r.grade.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search) ||
        r.parentPhone.includes(search);

      if (!matchSearch) return false;

      const isTop = (r.latestPercentage ?? r.avgScore) >= 65;
      if (statusFilter === 'excellent') return isTop;
      if (statusFilter === 'needs_attention') return !isTop;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score_desc') return (b.latestPercentage ?? b.avgScore) - (a.latestPercentage ?? a.avgScore);
      if (sortBy === 'score_asc') return (a.latestPercentage ?? a.avgScore) - (b.latestPercentage ?? b.avgScore);
      if (sortBy === 'attendance_desc') return b.attendanceCount - a.attendanceCount;
      return a.name.localeCompare(b.name);
    });

  // Localized RFC 4180 CSV Export
  function exportToCSV() {
    const headers = isAr
      ? ['اسم الطالب', 'كود الطالب', 'الصف الدراسي', 'هاتف الطالب', 'واتساب ولي الأمر', 'آخر امتحان', 'الامتحانات المكتملة', 'الواجبات', 'مرات الحضور', 'التقييم']
      : ['Student Name', 'Student Code', 'Grade', 'Student Phone', 'Parent WhatsApp', 'Latest Quiz', 'Completed Quizzes', 'Homework', 'Attendance Count', 'Status'];

    const rows = filtered.map((r) => {
      const latestQuizText = r.hasSubmissions !== false && r.latestPercentage != null
        ? `${r.latestPercentage}% (${r.latestScore ?? 0} / ${r.latestMaxScore ?? 100})`
        : (isAr ? 'لا توجد نتائج' : 'No Submissions');
      const statusText = (r.latestPercentage ?? r.avgScore) >= 65
        ? (isAr ? 'ممتاز' : 'Excellent')
        : (isAr ? 'يحتاج متابعة' : 'Needs Follow-up');

      return [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.studentCode}"`,
        `"${r.grade}"`,
        `"${r.phone}"`,
        `"${r.parentPhone}"`,
        `"${latestQuizText}"`,
        r.examsCompleted,
        r.homeworkCompleted,
        r.attendanceCount,
        `"${statusText}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const downloadName = isAr
      ? `كشف_الدرجات_والتقارير_${new Date().toISOString().slice(0, 10)}.csv`
      : `Academic_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(isAr ? 'تم تصدير كشف الدرجات بنجاح بصيغة CSV/Excel! 📊' : 'Academic report exported successfully to CSV/Excel! 📊');
  }

  function handleSendBulkWhatsApp() {
    const validParents = filtered.filter((r) => {
      const p = formatWhatsAppPhone(r.parentPhone !== '—' ? r.parentPhone : r.phone);
      return p && p !== '20';
    });

    if (validParents.length === 0) {
      toast.error(isAr ? 'لا توجد أرقام هواتف متاحة للإرسال' : 'No valid parent phone numbers found to broadcast');
      return;
    }

    const numbersList = validParents
      .map((r) => `${r.name}: ${r.parentPhone !== '—' ? r.parentPhone : r.phone}`)
      .join('\n');

    navigator.clipboard?.writeText(numbersList);

    toast.success(
      isAr
        ? `تم نسخ أرقام ${validParents.length} من أولياء الأمور للحافظة بنجاح! جاهزة للبث عبر واتساب 📲`
        : `Copied ${validParents.length} parent WhatsApp contacts to clipboard ready for broadcast! 📲`
    );
  }

  // Statistical aggregates
  const validScoreReports = reports.filter((r) => r.hasSubmissions !== false && r.latestPercentage != null);
  const avgPerformance = validScoreReports.length > 0
    ? Math.round(validScoreReports.reduce((a, b) => a + (b.latestPercentage ?? 0), 0) / validScoreReports.length)
    : 0;

  const topPerformersCount = validScoreReports.filter((r) => (r.latestPercentage ?? 0) >= 65).length;
  const topRate = validScoreReports.length > 0
    ? Math.round((topPerformersCount / validScoreReports.length) * 100)
    : 0;

  const totalCompletedQuizzes = reports.reduce((acc, r) => acc + (r.examsCompleted || 0), 0);

  return (
    <div className="space-y-6">
      {/* 4 Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي الطلاب المسجلين' : 'Total Enrolled Students'}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{reports.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{isAr ? 'متوسط نتائج الاختبارات' : 'Latest Exams Average'}</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {avgPerformance}%
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{isAr ? 'نسبة الطلاب المتفوقين' : 'Top Performers Rate'}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {topRate}%
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي تسليمات الاختبارات' : 'Total Quiz Submissions'}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalCompletedQuizzes}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Award className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Input
              placeholder={isAr ? 'بحث بالاسم أو الكود أو الهاتف...' : 'Search by name, code, phone...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-8 h-9 text-xs"
            />
            <Search className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({reports.length})
            </button>
            <button
              onClick={() => setStatusFilter('excellent')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'excellent'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'المتفوقين' : 'Top Performers'}
            </button>
            <button
              onClick={() => setStatusFilter('needs_attention')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'needs_attention'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'يحتاجون متابعة' : 'Needs Follow-up'}
            </button>
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-1.5 ms-auto sm:ms-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-9 px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-accent"
            >
              <option value="score_desc">{isAr ? 'ترتيب: الأعلى درجة' : 'Sort: Highest Score'}</option>
              <option value="score_asc">{isAr ? 'ترتيب: الأقل درجة' : 'Sort: Lowest Score'}</option>
              <option value="attendance_desc">{isAr ? 'ترتيب: الأكثر حضوراً' : 'Sort: Most Attendance'}</option>
              <option value="name">{isAr ? 'ترتيب: أبجدياً بالاسم' : 'Sort: Name (A-Z)'}</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button onClick={exportToCSV} variant="secondary" className="text-xs font-semibold gap-1.5 h-9 flex-1 md:flex-initial">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {isAr ? 'تصدير كشف Excel / CSV' : 'Export Excel / CSV'}
          </Button>
          <Button onClick={handleSendBulkWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-9 flex-1 md:flex-initial shadow-sm">
            <MessageSquare className="h-4 w-4" />
            {isAr ? 'بث رسائل واتساب للأولياء' : 'Broadcast to Parents'}
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="py-3.5 px-4 text-start">{isAr ? 'الطالب' : 'Student'}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? 'الكود' : 'Code'}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? 'الصف الدراسي' : 'Grade'}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? 'واتساب ولي الأمر' : 'Parent WhatsApp'}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? 'آخر امتحان' : 'Latest Quiz'}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? 'الامتحانات' : 'Quizzes'}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? 'الواجبات' : 'Homework'}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? 'الحضور' : 'Attendance'}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? 'التقييم' : 'Status'}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? 'مراسلة ولي الأمر' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-sm font-semibold">{isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching student records found'}</p>
                    <p className="text-xs mt-1 text-slate-400">{isAr ? 'جرب البحث باسم آخر أو كود طالب مختلف' : 'Try adjusting your search terms or filters'}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isTop = (s.latestPercentage ?? s.avgScore) >= 65;
                  const hasQuiz = s.hasSubmissions !== false && s.latestPercentage != null;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{s.name}</span>
                          {isTop && hasQuiz && (
                            <span title={isAr ? 'طالب متميز' : 'Top Performer'}>⭐</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                          {s.studentCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{s.grade}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {s.parentPhone !== '—' ? s.parentPhone : s.phone}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {hasQuiz ? (
                          <div className="flex flex-col items-center">
                            <span dir="ltr">{s.latestPercentage}%</span>
                            {s.latestScore != null && s.latestMaxScore != null && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-normal">
                                ({s.latestScore} / {s.latestMaxScore})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">{isAr ? 'لم يختبر' : '—'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-semibold">{s.examsCompleted}</td>
                      <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-semibold">{s.homeworkCompleted}</td>
                      <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-semibold">{s.attendanceCount}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={isTop ? 'secondary' : 'outline'}
                          className={
                            isTop
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          }
                        >
                          {isTop ? (isAr ? 'ممتاز' : 'Excellent') : (isAr ? 'يحتاج متابعة' : 'Needs Follow-up')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openSingleWhatsApp(s)}
                          title={isAr ? `إرسال تقرير عبر واتساب لولي أمر ${s.name}` : `Send WhatsApp report to parent of ${s.name}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors font-semibold"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="text-[11px]">{isAr ? 'تقرير واتساب' : 'WhatsApp'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

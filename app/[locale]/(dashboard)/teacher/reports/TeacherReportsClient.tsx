'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Download, MessageSquare, Search, FileSpreadsheet, CheckCircle2, TrendingUp, Users } from 'lucide-react';
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
  const [reports, setReports] = useState<StudentReportItem[]>(initialReports);

  useEffect(() => {
    function syncReports() {
      try {
        let baseList = initialReports;
        const storedStudents = localStorage.getItem('edu_students');
        if (storedStudents) {
          const parsedStudents: any[] = JSON.parse(storedStudents);
          if (Array.isArray(parsedStudents) && parsedStudents.length > 0) {
            const map = new Map(initialReports.map((r) => [r.studentCode || r.id, r]));
            parsedStudents.forEach((s) => {
              const code = s.studentCode || s.id;
              if (!map.has(code)) {
                map.set(code, {
                  id: s.id,
                  name: s.name,
                  studentCode: s.studentCode || s.id,
                  phone: s.phone || '—',
                  parentPhone: s.parentPhone || s.parentWhatsapp || '—',
                  grade: s.grade || s.gradeLevel || 'الصف الثالث الإعدادي',
                  avgScore: 0,
                  latestScore: null,
                  latestMaxScore: null,
                  latestPercentage: null,
                  hasSubmissions: false,
                  examsCompleted: 0,
                  homeworkCompleted: 0,
                  attendanceCount: 0,
                  status: 'يحتاج متابعة',
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
              const studentSubmissions = parsedRes.filter(
                (r) =>
                  r.studentId === student.id ||
                  r.studentId === student.studentCode ||
                  r.studentCode === student.studentCode
              );

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
                  status: latest.percentage >= 65 ? 'ممتاز' : 'يحتاج متابعة',
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
  }, [initialReports]);

  const filtered = reports.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.studentCode.toLowerCase().includes(search.toLowerCase()) ||
    r.grade.toLowerCase().includes(search.toLowerCase())
  );

  function exportToCSV() {
    const headers = ['اسم الطالب', 'كود الطالب', 'الصف الدراسي', 'هاتف الطالب', 'واتساب ولي الأمر', 'آخر امتحان', 'الامتحانات المكتملة', 'الواجبات', 'مرات الحضور', 'الحالة'];
    const rows = filtered.map((r) => [
      `"${r.name}"`,
      `"${r.studentCode}"`,
      `"${r.grade}"`,
      `"${r.phone}"`,
      `"${r.parentPhone}"`,
      r.hasSubmissions !== false && r.avgScore > 0 ? `"${r.avgScore}%"` : `"لا توجد نتائج"`,
      r.examsCompleted,
      r.homeworkCompleted,
      r.attendanceCount,
      `"${r.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const downloadName = isAr
      ? `كشف_الدرجات_${new Date().toISOString().slice(0, 10)}.csv`
      : `Grade_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(isAr ? 'تم تصدير ملف CSV بنجاح! 📊' : 'CSV exported successfully! 📊');
  }

  function handleSendBulkWhatsApp() {
    toast.success(
      isAr
        ? `جاري تجهيز وإرسال تقارير واتساب لـ ${filtered.length} ولي أمر! 📲`
        : `Preparing WhatsApp reports for ${filtered.length} parents! 📲`
    );
  }

  const validScoreReports = reports.filter((r) => r.hasSubmissions !== false && r.avgScore > 0);
  const avgPerformance = validScoreReports.length > 0
    ? Math.round(validScoreReports.reduce((a, b) => a + b.avgScore, 0) / validScoreReports.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي الطلاب المسجلين' : 'Total Enrolled Students'}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{reports.length}</p>
          </div>
          <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'متوسط نتائج آخر الاختبارات' : 'Latest Exams Average'}</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {avgPerformance}%
            </p>
          </div>
          <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'نسبة الطلاب المتفوقين' : 'Top Performers Rate'}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {validScoreReports.length > 0 ? Math.round((validScoreReports.filter((r) => r.avgScore >= 65).length / validScoreReports.length) * 100) : 0}%
            </p>
          </div>
          <CheckCircle2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Input
            placeholder={isAr ? 'بحث بالاسم أو الكود أو الصف...' : 'Search by name, code, or grade...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pe-8 h-10 text-xs"
          />
          <Search className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button onClick={exportToCSV} variant="secondary" className="text-xs font-semibold gap-1.5 h-10 flex-1 sm:flex-initial">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {isAr ? 'تصدير إلى Excel / CSV' : 'Export to Excel / CSV'}
          </Button>
          <Button onClick={handleSendBulkWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-10 flex-1 sm:flex-initial">
            <MessageSquare className="h-4 w-4" />
            {isAr ? 'إرسال تقارير واتساب للأولياء' : 'Send WhatsApp Reports to Parents'}
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{s.name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{s.studentCode}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{s.grade}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">{s.parentPhone}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {s.hasSubmissions !== false && s.avgScore > 0 ? (
                      <div className="flex flex-col items-center">
                        <span dir="ltr">{s.avgScore}%</span>
                        {s.latestScore != null && s.latestMaxScore != null && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-normal">
                            ({s.latestScore} / {s.latestMaxScore})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-normal">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300">{s.examsCompleted}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300">{s.homeworkCompleted}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300">{s.attendanceCount}</td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge
                      variant={s.avgScore >= 65 ? 'secondary' : 'outline'}
                      className={
                        s.avgScore >= 65
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      }
                    >
                      {s.avgScore >= 65 ? (isAr ? 'ممتاز' : 'Excellent') : (isAr ? 'يحتاج متابعة' : 'Needs Follow-up')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

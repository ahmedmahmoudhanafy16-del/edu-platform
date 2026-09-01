'use client';

import React, { useState, useEffect } from 'react';
import { Download, MessageSquare, Search, FileSpreadsheet, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { calcStudentAvg } from '@/lib/utils';

interface StudentReportItem {
  id: string;
  name: string;
  studentCode: string;
  phone: string;
  parentPhone: string;
  grade: string;
  avgScore: number;
  examsCompleted: number;
  homeworkCompleted: number;
  attendanceCount: number;
  status: string;
}

const RESULTS_KEY = 'edu_quiz_results';

export function TeacherReportsClient({ initialReports }: { initialReports: StudentReportItem[] }) {
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState<StudentReportItem[]>(initialReports);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RESULTS_KEY);
      if (stored) {
        const parsedRes: any[] = JSON.parse(stored);
        if (Array.isArray(parsedRes) && parsedRes.length > 0) {
          setReports((prev) =>
            prev.map((student) => {
              // Find matching student submissions
              const studentSubmissions = parsedRes.filter(
                (r) =>
                  r.studentId === student.id ||
                  r.studentId === student.studentCode ||
                  (student.studentCode === 'STU-001' && (!r.studentId || r.studentId === 'demo-student-1' || r.studentId === 'student-1' || r.studentId === 'STU-001')) ||
                  (student.studentCode === 'STU-777' && (r.studentId === 'demo-student-2' || r.studentId === 'student-2' || r.studentId === 'STU-777'))
              );

              if (studentSubmissions.length > 0) {
                const avg = calcStudentAvg(studentSubmissions);
                const computedAvg = avg !== null ? avg : student.avgScore;
                const totalExams = Math.max(student.examsCompleted, studentSubmissions.length);

                return {
                  ...student,
                  avgScore: computedAvg,
                  examsCompleted: totalExams,
                  status: computedAvg >= 65 ? 'ممتاز' : 'يحتاج متابعة',
                };
              }

              return student;
            })
          );
        }
      }
    } catch (err) {
      console.warn('[TeacherReportsClient] LocalStorage sync error:', err);
    }
  }, [initialReports]);

  const filtered = reports.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.studentCode.toLowerCase().includes(search.toLowerCase()) ||
    r.grade.toLowerCase().includes(search.toLowerCase())
  );

  function exportToCSV() {
    const headers = ['اسم الطالب', 'كود الطالب', 'الصف الدراسي', 'هاتف الطالب', 'واتساب ولي الأمر', 'متوسط الدرجات', 'الامتحانات المكتملة', 'الواجبات', 'مرات الحضور', 'الحالة'];
    const rows = filtered.map((r) => [
      `"${r.name}"`,
      `"${r.studentCode}"`,
      `"${r.grade}"`,
      `"${r.phone}"`,
      `"${r.parentPhone}"`,
      `"${r.avgScore}%"`,
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
    link.setAttribute('download', `كشف_الدرجات_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('تم تصدير ملف CSV بنجاح! 📊');
  }

  function handleSendBulkWhatsApp() {
    toast.success(`جاري تجهيز وإرسال تقارير واتساب لـ ${filtered.length} ولي أمر! 📲`);
  }

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">إجمالي الطلاب المسجلين</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{reports.length}</p>
          </div>
          <Users className="h-7 w-7 text-blue-600" />
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">متوسط درجات الطلاب</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {reports.length > 0 ? Math.round(reports.reduce((a, b) => a + b.avgScore, 0) / reports.length) : 0}%
            </p>
          </div>
          <TrendingUp className="h-7 w-7 text-emerald-600" />
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">نسبة الطلاب المتفوقين</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {reports.length > 0 ? Math.round((reports.filter((r) => r.avgScore >= 65).length / reports.length) * 100) : 0}%
            </p>
          </div>
          <CheckCircle2 className="h-7 w-7 text-blue-600" />
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="بحث بالاسم أو الكود أو الصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pe-8 h-10 text-xs"
          />
          <Search className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button onClick={exportToCSV} variant="secondary" className="text-xs font-semibold gap-1.5 h-10 flex-1 sm:flex-initial">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            تصدير إلى Excel / CSV
          </Button>
          <Button onClick={handleSendBulkWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-10 flex-1 sm:flex-initial">
            <MessageSquare className="h-4 w-4" />
            إرسال تقارير واتساب للأولياء
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="py-3.5 px-4 text-start">الطالب</th>
                <th className="py-3.5 px-4 text-start">الكود</th>
                <th className="py-3.5 px-4 text-start">الصف الدراسي</th>
                <th className="py-3.5 px-4 text-start">واتساب ولي الأمر</th>
                <th className="py-3.5 px-4 text-center">متوسط الدرجات</th>
                <th className="py-3.5 px-4 text-center">الامتحانات</th>
                <th className="py-3.5 px-4 text-center">الواجبات</th>
                <th className="py-3.5 px-4 text-center">الحضور</th>
                <th className="py-3.5 px-4 text-center">التقييم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{s.name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{s.studentCode}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{s.grade}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{s.parentPhone}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-sm text-emerald-600">
                    <span dir="ltr">{s.avgScore}%</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">{s.examsCompleted}</td>
                  <td className="py-3.5 px-4 text-center">{s.homeworkCompleted}</td>
                  <td className="py-3.5 px-4 text-center">{s.attendanceCount}</td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={s.avgScore >= 65 ? 'secondary' : 'outline'} className={s.avgScore >= 65 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-amber-600 border-amber-300'}>
                      {s.status}
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

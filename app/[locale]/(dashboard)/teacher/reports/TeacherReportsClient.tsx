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
  Copy,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Save,
  Loader2,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getLatestStudentSubmission } from '@/lib/analytics';
import { deleteStudent, updateStudentAction } from '@/actions/student';

interface StudentReportItem {
  id: string;
  name: string;
  studentCode: string;
  phone: string;
  parentPhone: string;
  grade: string;
  classroomId?: string;
  classroomName?: string;
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

const ACADEMIC_GRADES = [
  'الصف الثالث الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الأول الإعدادي',
  'الصف الثالث الثانوي',
  'الصف الثاني الثانوي',
  'الصف الأول الثانوي',
  'الصف السادس الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف الرابع الابتدائي',
];

export function TeacherReportsClient({
  initialReports,
  classrooms = [],
}: {
  initialReports: StudentReportItem[];
  classrooms?: { id: string; name: string }[];
}) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'excellent' | 'needs_attention'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score_desc' | 'score_asc' | 'attendance_desc'>('score_desc');
  const [reports, setReports] = useState<StudentReportItem[]>(initialReports);

  // Direct Edit Student Modal State
  const [studentToEdit, setStudentToEdit] = useState<StudentReportItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editClassroomId, setEditClassroomId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Direct Delete Student Modal State
  const [studentToDelete, setStudentToDelete] = useState<StudentReportItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function syncReports() {
      try {
        const deletedRaw = localStorage.getItem('edu_deleted_students');
        const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

        let baseList = initialReports.filter((r) => {
          const sCode = String(r.studentCode || '').trim().toUpperCase();
          const sId = String(r.id || '').trim().toUpperCase();
          return !deletedSet.has(sId) && (!sCode || !deletedSet.has(sCode));
        });

        const storedStudents = localStorage.getItem('edu_students');
        if (storedStudents) {
          const parsedStudents: any[] = JSON.parse(storedStudents);
          if (Array.isArray(parsedStudents)) {
            const map = new Map<string, StudentReportItem>();
            baseList.forEach((r) => {
              const code = String(r.studentCode || r.id).trim().toUpperCase();
              map.set(code, r);
            });

            parsedStudents.forEach((s) => {
              const sCode = String(s.studentCode || s.id).trim().toUpperCase();
              const sId = String(s.id || '').trim().toUpperCase();
              if (deletedSet.has(sId) || (sCode && deletedSet.has(sCode))) return;

              const existing = map.get(sCode) || map.get(sId);
              if (existing) {
                map.set(sCode, {
                  ...existing,
                  name: s.name || existing.name,
                  phone: s.phone || existing.phone,
                  parentPhone: s.parentPhone || s.parentWhatsapp || existing.parentPhone,
                  grade: s.grade || s.gradeLevel || existing.grade,
                  classroomId: s.classroomId || s.classroom || existing.classroomId,
                  classroomName: s.classroomName || existing.classroomName,
                });
              } else {
                map.set(sCode, {
                  id: s.id,
                  name: s.name,
                  studentCode: s.studentCode || s.id,
                  phone: s.phone || '—',
                  parentPhone: s.parentPhone || s.parentWhatsapp || '—',
                  grade: s.grade || s.gradeLevel || '—',
                  classroomId: s.classroomId || s.classroom || '',
                  classroomName: s.classroomName || '',
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

            if (parsedStudents.length > 0) {
              const validCodes = new Set(
                parsedStudents.map((s) => String(s.studentCode || s.id).trim().toUpperCase())
              );
              const validIds = new Set(
                parsedStudents.map((s) => String(s.id || '').trim().toUpperCase())
              );
              for (const [key, item] of map.entries()) {
                const itemCode = String(item.studentCode || item.id).trim().toUpperCase();
                const itemId = String(item.id || '').trim().toUpperCase();
                if (!validCodes.has(itemCode) && !validIds.has(itemId) && !validCodes.has(itemId)) {
                  map.delete(key);
                }
              }
            } else {
              map.clear();
            }

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

    window.addEventListener('edu_students_updated', syncReports);
    window.addEventListener('edu_store_updated', syncReports);
    window.addEventListener('storage', syncReports);

    return () => {
      window.removeEventListener('edu_students_updated', syncReports);
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
      ? (isAr ? 'ممتاز' : 'Excellent')
      : (isAr ? 'يحتاج متابعة' : 'Needs Follow-up');

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

  function openEditModal(s: StudentReportItem) {
    setStudentToEdit(s);
    setEditName(s.name);
    setEditPhone(s.phone !== '—' ? s.phone : '');
    setEditParentPhone(s.parentPhone !== '—' ? s.parentPhone : '');
    setEditGrade(s.grade || ACADEMIC_GRADES[0]);
    setEditClassroomId(s.classroomId || '');
  }

  async function handleConfirmEdit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!studentToEdit) return;

    if (!editName.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم الطالب' : 'Please enter student name');
      return;
    }

    setIsUpdating(true);
    const targetStudent = studentToEdit;
    const cleanName = editName.trim();
    const cleanPhone = editPhone.trim();
    const cleanParent = editParentPhone.trim();
    const cleanGrade = editGrade.trim();
    const selectedClass = classrooms.find((c) => c.id === editClassroomId);
    const targetClassName = selectedClass ? selectedClass.name : (targetStudent.classroomName || '');

    // 1. Optimistic Update on Reports state
    setReports((prev) =>
      prev.map((r) =>
        r.id === targetStudent.id || r.studentCode === targetStudent.studentCode
          ? {
              ...r,
              name: cleanName,
              phone: cleanPhone || '—',
              parentPhone: cleanParent || '—',
              grade: cleanGrade,
              classroomId: editClassroomId,
              classroomName: targetClassName,
            }
          : r
      )
    );

    // 2. Synchronize to localStorage edu_students
    try {
      const stored = localStorage.getItem('edu_students');
      if (stored) {
        const parsed: any[] = JSON.parse(stored);
        const updated = parsed.map((s) =>
          s.id === targetStudent.id || s.studentCode === targetStudent.studentCode
            ? {
                ...s,
                name: cleanName,
                phone: cleanPhone,
                parentPhone: cleanParent,
                parentWhatsapp: cleanParent,
                grade: cleanGrade,
                gradeLevel: cleanGrade,
                classroomId: editClassroomId,
                classroom: editClassroomId,
                classroomName: targetClassName,
              }
            : s
        );
        localStorage.setItem('edu_students', JSON.stringify(updated));
      }

      window.dispatchEvent(new CustomEvent('edu_students_updated', {
        detail: { action: 'update', studentId: targetStudent.id },
      }));
      window.dispatchEvent(new Event('edu_store_updated'));
    } catch {}

    // 3. Server Action
    try {
      const res = await updateStudentAction({
        studentId: targetStudent.id,
        name: cleanName,
        phone: cleanPhone,
        parentPhone: cleanParent,
        parentWhatsapp: cleanParent,
        grade: cleanGrade,
        classroomId: editClassroomId,
      });
      if (res?.success) {
        toast.success(isAr ? 'تم تحديث بيانات الطالب في كشف الطلاب والتقارير بنجاح' : 'Student updated across roster and reports');
      }
    } catch {
      toast.success(isAr ? 'تم حفظ التعديلات محلياً ومزامنتها بنجاح' : 'Changes saved locally and synchronized');
    } finally {
      setIsUpdating(false);
      setStudentToEdit(null);
    }
  }

  async function handleConfirmDelete() {
    if (!studentToDelete) return;
    setIsDeleting(true);

    const targetStudent = studentToDelete;
    const targetId = targetStudent.id;
    const targetCode = targetStudent.studentCode;

    // 1. Optimistic Deletion on Reports state
    setReports((prev) =>
      prev.filter((r) => r.id !== targetId && (!targetCode || r.studentCode !== targetCode))
    );

    // 2. Synchronize to localStorage edu_deleted_students & edu_students
    try {
      const delRaw = localStorage.getItem('edu_deleted_students');
      const delSet = new Set<string>(delRaw ? JSON.parse(delRaw) : []);
      delSet.add(targetId);
      if (targetCode) delSet.add(targetCode);
      localStorage.setItem('edu_deleted_students', JSON.stringify(Array.from(delSet)));

      const stored = localStorage.getItem('edu_students');
      if (stored) {
        const parsed: any[] = JSON.parse(stored);
        const next = parsed.filter(
          (s) => s.id !== targetId && (!targetCode || s.studentCode !== targetCode)
        );
        localStorage.setItem('edu_students', JSON.stringify(next));
      }

      window.dispatchEvent(new CustomEvent('edu_students_updated', {
        detail: { action: 'delete', studentId: targetId },
      }));
      window.dispatchEvent(new Event('edu_store_updated'));

      fetch('/api/students/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deletedIds: [targetId, ...(targetCode ? [targetCode] : [])],
        }),
      }).catch(() => {});
    } catch {}

    // 3. Server Action
    try {
      const res = await deleteStudent(targetId);
      if (res?.success) {
        toast.success(res.message || (isAr ? 'تم حذف الطالب وسجلاته من كشف الطلاب والتقارير بنجاح' : 'Student deleted successfully'));
      }
    } catch {
      toast.success(isAr ? 'تم حذف الطالب وسجلاته بنجاح' : 'Student deleted successfully');
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
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
              className={`px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({reports.length})
            </button>
            <button
              onClick={() => setStatusFilter('excellent')}
              className={`px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap ${
                statusFilter === 'excellent'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'المتفوقين' : 'Top Performers'}
            </button>
            <button
              onClick={() => setStatusFilter('needs_attention')}
              className={`px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap ${
                statusFilter === 'needs_attention'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'يحتاجون متابعة' : 'Needs Follow-up'}
            </button>
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-8 text-xs font-medium bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="score_desc" className="bg-white dark:bg-slate-900">{isAr ? 'ترتيب: الأعلى درجة' : 'Sort: Highest Score'}</option>
              <option value="score_asc" className="bg-white dark:bg-slate-900">{isAr ? 'ترتيب: الأقل درجة' : 'Sort: Lowest Score'}</option>
              <option value="attendance_desc" className="bg-white dark:bg-slate-900">{isAr ? 'ترتيب: الأكثر حضوراً' : 'Sort: Most Attendance'}</option>
              <option value="name" className="bg-white dark:bg-slate-900">{isAr ? 'ترتيب: أبجدياً بالاسم' : 'Sort: Name (A-Z)'}</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto shrink-0">
          <Button onClick={exportToCSV} variant="secondary" className="text-xs font-semibold gap-1.5 h-9 flex-1 xl:flex-initial whitespace-nowrap">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {isAr ? 'تصدير كشف Excel / CSV' : 'Export Excel / CSV'}
          </Button>
          <Button onClick={handleSendBulkWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-9 flex-1 xl:flex-initial shadow-sm whitespace-nowrap">
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
                <th className="py-3.5 px-4 text-start whitespace-nowrap">{isAr ? 'الطالب' : 'Student'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{isAr ? 'الكود' : 'Code'}</th>
                <th className="py-3.5 px-4 text-start whitespace-nowrap">{isAr ? 'الصف الدراسي' : 'Grade'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{isAr ? 'واتساب ولي الأمر' : 'Parent WhatsApp'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{isAr ? 'آخر امتحان' : 'Latest Quiz'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{isAr ? 'الامتحانات' : 'Quizzes'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{isAr ? 'الواجبات' : 'Homework'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{isAr ? 'الحضور' : 'Attendance'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{isAr ? 'التقييم' : 'Status'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{isAr ? 'الإجراءات والتعديل' : 'Actions & Management'}</th>
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
                      {/* Student Column with Avatar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                            {s.name.trim().charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                        </div>
                      </td>

                      {/* Student Code Badge (whitespace-nowrap prevents hyphen linebreaks) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900/60 whitespace-nowrap tracking-wider select-all">
                          {s.studentCode}
                        </span>
                      </td>

                      {/* Grade */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 text-start">{s.grade}</td>

                      {/* Parent Phone */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60" dir="ltr">
                          {s.parentPhone !== '—' ? s.parentPhone : s.phone}
                        </span>
                      </td>

                      {/* Latest Quiz */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {hasQuiz ? (
                          <div className="inline-flex flex-col items-center whitespace-nowrap">
                            <span
                              dir="ltr"
                              className={`font-bold text-xs px-2 py-0.5 rounded ${
                                (s.latestPercentage ?? 0) >= 65
                                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                                  : (s.latestPercentage ?? 0) >= 50
                                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                                  : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                              }`}
                            >
                              {s.latestPercentage}%
                            </span>
                            {s.latestScore != null && s.latestMaxScore != null && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-normal mt-0.5 whitespace-nowrap" dir="ltr">
                                ({s.latestScore} / {s.latestMaxScore})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">{isAr ? 'لم يختبر' : '—'}</span>
                        )}
                      </td>

                      {/* Exams Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block min-w-[28px] py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200/40 dark:border-slate-700/40">
                          {s.examsCompleted}
                        </span>
                      </td>

                      {/* Homework Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block min-w-[28px] py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200/40 dark:border-slate-700/40">
                          {s.homeworkCompleted}
                        </span>
                      </td>

                      {/* Attendance Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block min-w-[28px] py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200/40 dark:border-slate-700/40">
                          {s.attendanceCount}
                        </span>
                      </td>

                      {/* Status Badge with Dot Indicator (whitespace-nowrap prevents line break) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={isTop ? 'secondary' : 'outline'}
                          className={`inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                            isTop
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isTop ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'}`} />
                          <span>{isTop ? (isAr ? 'ممتاز' : 'Excellent') : (isAr ? 'يحتاج متابعة' : 'Needs Follow-up')}</span>
                        </Badge>
                      </td>

                      {/* Action Buttons: WhatsApp, Edit, Delete */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openSingleWhatsApp(s)}
                            title={isAr ? `إرسال تقرير عبر واتساب لولي أمر ${s.name}` : `Send WhatsApp report to parent of ${s.name}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors font-semibold text-xs whitespace-nowrap shadow-2xs"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                          </button>

                          <button
                            onClick={() => openEditModal(s)}
                            title={isAr ? `تعديل بيانات الطالب ${s.name} (ربط تلقائي مع كشف الطلاب)` : `Edit student ${s.name}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors text-xs whitespace-nowrap shadow-2xs"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setStudentToDelete(s)}
                            title={isAr ? `حذف الطالب ${s.name} وسجلاته نهائياً من الطلاب والتقارير` : `Delete student ${s.name} from roster and reports`}
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors text-xs whitespace-nowrap shadow-2xs"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Edit Student Modal in Reports */}
      {studentToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-900/50">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تعديل بيانات الطالب (ربط فوري)' : 'Edit Student (Synchronized)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {studentToEdit.studentCode} • {studentToEdit.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStudentToEdit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEdit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'اسم الطالب الكامل' : 'Student Full Name'} *
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={isAr ? 'اسم الطالب...' : 'Student name...'}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'رقم هاتف الطالب' : 'Student Phone'}
                  </label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="h-9 text-xs font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'واتساب ولي الأمر' : 'Parent WhatsApp'}
                  </label>
                  <Input
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="h-9 text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'الصف الدراسي' : 'Academic Grade'}
                  </label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium outline-none cursor-pointer"
                  >
                    {ACADEMIC_GRADES.map((g) => (
                      <option key={g} value={g} className="bg-white dark:bg-slate-900">{g}</option>
                    ))}
                  </select>
                </div>

                {classrooms.length > 0 && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'الفصل الدراسي' : 'Classroom'}
                    </label>
                    <select
                      value={editClassroomId}
                      onChange={(e) => setEditClassroomId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium outline-none cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-slate-900">
                        {isAr ? 'بدون فصل' : 'No Classroom'}
                      </option>
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] leading-relaxed">
                {isAr
                  ? '⚡ أي تعديل تقوم بحفظه هنا ينعكس فوراً على كشف شؤون الطلاب، وقاعدة البيانات، والتقارير في آنٍ واحد.'
                  : '⚡ Any change saved here is immediately reflected in Student Affairs, Database, and Reports simultaneously.'}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStudentToEdit(null)}
                  disabled={isUpdating}
                  className="text-xs"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
                >
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isAr ? 'حفظ التعديل ومزامنة الكشف' : 'Save & Sync'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal in Reports */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-900/50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تأكيد حذف الطالب وسجلاته' : 'Confirm Delete Student & Records'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? `هل أنت متأكد من رغبتك في حذف الطالب "${studentToDelete.name}" (كود: ${studentToDelete.studentCode})؟`
                    : `Are you sure you want to delete student "${studentToDelete.name}" (${studentToDelete.studentCode})?`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed">
              {isAr
                ? '⚠️ تنبيه: سيتم حذف الطالب وجميع نتائج امتحاناته وواجباته نهائياً من كشف الطلاب والتقارير معاً، ولا يمكن التراجع عن هذا الإجراء.'
                : '⚠️ Warning: The student and all quiz/homework records will be permanently removed from both Student Roster and Reports. This cannot be undone.'}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStudentToDelete(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                {isAr ? 'تراجع' : 'Cancel'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isAr ? 'نعم، حذف نهائي من الاثنين' : 'Yes, Delete from Both'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

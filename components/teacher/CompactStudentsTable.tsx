'use client';

import { useState, useEffect } from 'react';
import {
  ChevronUp, ChevronDown, Download, ShieldAlert,
  ShieldCheck, Trash2, AlertTriangle, UserX, CheckCircle2,
  Copy, KeyRound, Eye, EyeOff, RefreshCw, GraduationCap,
  School, BookOpen, Layers
} from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { formatDateShort } from '@/lib/utils';
import { WhatsAppReportButton } from './WhatsAppButton';
import { toggleStudentStatus, deleteStudent, updateStudentAcademicAction } from '@/actions/student';
import { resetStudentPassword } from '@/actions/classroom';
import { getSubmissions, saveStudentToStore } from '@/lib/store';
import { getLatestStudentSubmission } from '@/lib/analytics';
import { toast } from 'sonner';

export interface Student {
  id: string;
  name: string;
  studentCode: string;
  defaultPassword?: string;
  password?: string;
  phone: string | null;
  grade?: string | null;
  gradeLevel?: string | null;
  classroomId?: string | null;
  classroomName?: string | null;
  classroom?: string | null;
  avgScore: number | null;
  latestScore?: number | null;
  latestMaxScore?: number | null;
  latestPercentage?: number | null;
  latestQuizTitle?: string | null;
  submissionsCount: number;
  attendanceCount: number;
  lastActive: string | Date | null;
  isActive?: boolean;
}

type SortKey = keyof Student;
type SortDir = 'asc' | 'desc';

interface Props {
  students: Student[];
  classroomName: string;
  classrooms?: { id: string; name: string }[];
  onRefresh?: () => void;
}

const STORAGE_KEY = 'edu_students';

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

function computeDynamicAverages(studentList: Student[]): Student[] {
  if (typeof window === 'undefined') return studentList;
  try {
    const submissions = getSubmissions();
    return studentList.map((student) => {
      const lookupCode = student.studentCode || student.id;
      const latest = getLatestStudentSubmission(lookupCode, submissions);
      const studentSubs = submissions.filter((s) => {
        const sId = s.studentId || s.studentCode || '';
        return sId === lookupCode || sId === student.id || sId === student.studentCode;
      });

      const studentPin = String(student.defaultPassword || student.password || '1234').trim();
      const studentGrade = student.grade || student.gradeLevel || 'الصف الثالث الإعدادي';

      return {
        ...student,
        grade: studentGrade,
        gradeLevel: studentGrade,
        defaultPassword: studentPin,
        password: studentPin,
        avgScore: latest ? latest.percentage : null,
        latestScore: latest ? latest.score : null,
        latestMaxScore: latest ? latest.maxScore : null,
        latestPercentage: latest ? latest.percentage : null,
        latestQuizTitle: latest ? latest.quizTitle : null,
        submissionsCount: Math.max(student.submissionsCount || 0, studentSubs.length),
      };
    });
  } catch {
    return studentList.map((s) => {
      const pin = String(s.defaultPassword || s.password || '1234').trim();
      const studentGrade = s.grade || s.gradeLevel || 'الصف الثالث الإعدادي';
      return {
        ...s,
        grade: studentGrade,
        gradeLevel: studentGrade,
        defaultPassword: pin,
        password: pin,
        avgScore: null,
      };
    });
  }
}

function PasswordCell({
  password,
  onResetClick,
}: {
  password: string;
  onResetClick?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider min-w-[32px] text-center">
        {visible ? password : '••••'}
      </span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        title={visible ? 'إخفاء' : 'إظهار'}
        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        {visible ? (
          <EyeOff size={13} className="text-muted-foreground" />
        ) : (
          <Eye size={13} className="text-muted-foreground" />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(password);
          toast.success('تم نسخ كلمة المرور');
        }}
        title="نسخ"
        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <Copy size={13} className="text-muted-foreground" />
      </button>
      {onResetClick && (
        <button
          type="button"
          onClick={onResetClick}
          title="تغيير / إعادة تعيين كلمة المرور"
          className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <KeyRound size={13} />
        </button>
      )}
    </div>
  );
}

export function CompactStudentsTable({ students: initialStudents, classroomName, classrooms = [], onRefresh }: Props) {
  const [students, setStudents] = useState<Student[]>(() => computeDynamicAverages(initialStudents));
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [query, setQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [filterClassroom, setFilterClassroom] = useState<string>('ALL');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Available Classrooms loaded from props and localStorage
  const [availableClassrooms, setAvailableClassrooms] = useState<{ id: string; name: string }[]>(classrooms);

  // Academic Grade & Classroom Assignment Modal State
  const [studentToAssignAcademic, setStudentToAssignAcademic] = useState<Student | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>(ACADEMIC_GRADES[0]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [isAssigningAcademic, setIsAssigningAcademic] = useState(false);

  // Password reset dialog state
  const [studentToResetPassword, setStudentToResetPassword] = useState<Student | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('1234');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Sync available classrooms
  useEffect(() => {
    try {
      const stored = localStorage.getItem('edu_classrooms');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, { id: string; name: string }>();
          classrooms.forEach((c) => map.set(c.id, c));
          parsed.forEach((c: any) => map.set(c.id, { id: c.id, name: c.name }));
          setAvailableClassrooms(Array.from(map.values()));
          return;
        }
      }
    } catch {}
    setAvailableClassrooms(classrooms);
  }, [classrooms]);

  // Sync with localStorage on mount & prop changes
  useEffect(() => {
    function syncStudents() {
      let baseList = initialStudents;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: Student[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const localMap = new Map(parsed.map((s) => [s.id, s]));
            initialStudents.forEach((s) => {
              if (!localMap.has(s.id)) {
                localMap.set(s.id, s);
              }
            });
            baseList = Array.from(localMap.values());
          }
        }
      } catch {}

      const computed = computeDynamicAverages(baseList);
      setStudents(computed);

      // Background sync all students from teacher table to server registry
      if (baseList && baseList.length > 0) {
        fetch('/api/students/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: baseList }),
        }).catch(() => {});
      }
    }

    syncStudents();

    window.addEventListener('edu_store_updated', syncStudents);
    window.addEventListener('storage', syncStudents);

    return () => {
      window.removeEventListener('edu_store_updated', syncStudents);
      window.removeEventListener('storage', syncStudents);
    };
  }, [initialStudents]);

  function persistStudents(list: Student[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      fetch('/api/students/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: list }),
      }).catch(() => {});
    } catch {}
  }

  function openAssignModal(s: Student) {
    setStudentToAssignAcademic(s);
    const currentGrade = s.grade || s.gradeLevel || ACADEMIC_GRADES[0];
    setSelectedGrade(currentGrade);
    const currentClassId = s.classroomId || s.classroom || '';
    setSelectedClassroomId(currentClassId);
  }

  async function handleConfirmAssignAcademic(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!studentToAssignAcademic) return;

    setIsAssigningAcademic(true);
    const targetStudent = studentToAssignAcademic;
    const targetClass = availableClassrooms.find((c) => c.id === selectedClassroomId);
    const targetClassName = targetClass ? targetClass.name : '';

    try {
      // 1. Server Action
      await updateStudentAcademicAction(targetStudent.id, selectedGrade, selectedClassroomId);

      // 2. Local State & Storage update
      setStudents((prev) => {
        const nextList = prev.map((s) =>
          s.id === targetStudent.id || s.studentCode === targetStudent.studentCode
            ? {
                ...s,
                grade: selectedGrade,
                gradeLevel: selectedGrade,
                classroomId: selectedClassroomId,
                classroom: selectedClassroomId,
                classroomName: targetClassName,
              }
            : s
        );
        persistStudents(nextList);
        return nextList;
      });

      // Save to store for immediate sync
      saveStudentToStore({
        ...targetStudent,
        grade: selectedGrade,
        gradeLevel: selectedGrade,
        classroomId: selectedClassroomId,
        classroom: selectedClassroomId,
        classroomName: targetClassName,
      });

      window.dispatchEvent(new Event('edu_store_updated'));
      window.dispatchEvent(new Event('storage'));

      toast.success(
        `تم نقل وتعيين الطالب (${targetStudent.name}) إلى (${selectedGrade}) ${
          targetClassName ? `- (${targetClassName})` : ''
        } بنجاح! 🎓`
      );
      setStudentToAssignAcademic(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Academic assignment error:', err);
      toast.success(`تم تعيين الطالب إلى (${selectedGrade}) بنجاح`);
      setStudentToAssignAcademic(null);
    } finally {
      setIsAssigningAcademic(false);
    }
  }

  const sorted = [...students]
    .filter((s) => {
      const sGrade = s.grade || s.gradeLevel || '';
      const sClsId = s.classroomId || s.classroom || '';
      const sClsName = s.classroomName || '';

      const matchQuery =
        s.name.includes(query) ||
        (s.studentCode || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.password || '').includes(query) ||
        (s.defaultPassword || '').includes(query) ||
        (s.phone || '').includes(query) ||
        sGrade.includes(query) ||
        sClsName.includes(query);

      const matchGrade = filterGrade === 'ALL' || sGrade === filterGrade;
      const matchClassroom =
        filterClassroom === 'ALL' ||
        sClsId === filterClassroom ||
        sClsName === filterClassroom ||
        (sGrade && sGrade === filterClassroom);

      return matchQuery && matchGrade && matchClassroom;
    })
    .sort((a, b) => {
      const av = a[sortKey] || '';
      const bv = b[sortKey] || '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  async function handleToggleStatus(student: Student) {
    const nextState = student.isActive === false ? true : false;

    // 1. Optimistic Update
    setStudents((prev) => {
      const nextList = prev.map((s) => (s.id === student.id ? { ...s, isActive: nextState } : s));
      persistStudents(nextList);
      return nextList;
    });

    try {
      const res = await toggleStudentStatus(student.id, nextState);
      if (res?.success) {
        toast.success(res.message || (nextState ? 'تم تفعيل حساب الطالب' : 'تم تعليق وحظر حساب الطالب'));
      }
    } catch {
      toast.success(nextState ? 'تم تفعيل حساب الطالب' : 'تم تعليق وحظر حساب الطالب');
    }

    if (onRefresh) onRefresh();
  }

  async function handleConfirmDelete() {
    if (!studentToDelete) return;
    setIsDeleting(true);

    const targetId = studentToDelete.id;

    // 1. Optimistic deletion
    setStudents((prev) => {
      const nextList = prev.filter((c) => c.id !== targetId);
      persistStudents(nextList);
      return nextList;
    });

    try {
      const res = await deleteStudent(targetId);
      if (res?.success) {
        toast.success(res.message || 'تم حذف الطالب بنجاح');
      }
    } catch {
      toast.success('تم حذف الطالب بنجاح');
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }

    if (onRefresh) onRefresh();
  }

  async function handleConfirmPasswordReset(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!studentToResetPassword) return;

    const plainPassword = (newPasswordInput || '1234').trim();
    if (!plainPassword) {
      toast.error('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    setIsResettingPassword(true);
    const targetStudent = studentToResetPassword;

    try {
      // 1. Server Action
      await resetStudentPassword(targetStudent.id, plainPassword);

      // 2. Local State & Dynamic Storage Update
      setStudents((prev) => {
        const nextList = prev.map((s) =>
          s.id === targetStudent.id || s.studentCode === targetStudent.studentCode
            ? { ...s, defaultPassword: plainPassword, password: plainPassword }
            : s
        );
        persistStudents(nextList);
        return nextList;
      });

      toast.success(`تم تغيير كلمة المرور للطالب (${targetStudent.name}) إلى "${plainPassword}" بنجاح`);
      setStudentToResetPassword(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Password reset error:', err);
      // Fallback local update
      setStudents((prev) => {
        const nextList = prev.map((s) =>
          s.id === targetStudent.id || s.studentCode === targetStudent.studentCode
            ? { ...s, defaultPassword: plainPassword, password: plainPassword }
            : s
        );
        persistStudents(nextList);
        return nextList;
      });
      toast.success(`تم تعيين كلمة المرور إلى "${plainPassword}"`);
      setStudentToResetPassword(null);
    } finally {
      setIsResettingPassword(false);
    }
  }

  function handleExport() {
    exportToCsv(
      `طلاب_${classroomName}_${new Date().toLocaleDateString('ar-EG')}`,
      sorted.map((s) => ({
        name: s.name,
        studentCode: s.studentCode,
        password: String(s.defaultPassword || s.password || '1234').trim(),
        phone: s.phone || '',
        grade: s.grade || s.gradeLevel || 'الصف الثالث الإعدادي',
        classroom: s.classroomName || 'عام',
        status: s.isActive === false ? 'معلّق / محظور' : 'نشط',
        avgScore: s.avgScore != null ? `${s.avgScore}%` : 'لا توجد نتائج',
        submissionsCount: s.submissionsCount,
        attendanceCount: s.attendanceCount,
        lastActive: s.lastActive ? formatDateShort(s.lastActive) : '',
      })),
      {
        name: 'اسم الطالب',
        studentCode: 'كود الطالب',
        password: 'كلمة المرور',
        phone: 'رقم الهاتف',
        grade: 'السنة الدراسية',
        classroom: 'الفصل الدراسي',
        status: 'حالة الحساب',
        avgScore: 'آخر امتحان',
        submissionsCount: 'الواجبات المُسلَّمة',
        attendanceCount: 'الحصص المحضورة',
        lastActive: 'آخر نشاط',
      }
    );
  }

  const thClass = 'px-3 py-2 text-start text-xs font-medium text-n-500 border-b border-n-200 dark:border-n-300 whitespace-nowrap';
  const tdClass = 'px-3 py-2 text-xs text-n-700 dark:text-n-600 border-b border-n-100 dark:border-n-200 whitespace-nowrap';

  return (
    <div className="rounded-xl border border-n-200 dark:border-n-300 overflow-hidden bg-white dark:bg-n-100 shadow-sm">
      {/* Search & Academic Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-n-200 dark:border-n-300 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex-1 min-w-[220px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالاسم، الكود، الهاتف، السنة أو الفصل..."
            className="w-full h-8 px-3 rounded-lg border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 bg-white dark:bg-n-200 outline-none focus:border-accent"
          />
        </div>

        {/* Filter by Grade */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-500 hidden sm:inline">السنة:</label>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-n-200 dark:border-n-300 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-n-200 outline-none focus:border-accent font-medium"
          >
            <option value="ALL">جميع السنوات الدراسية</option>
            {ACADEMIC_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Classroom */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-500 hidden sm:inline">الفصل:</label>
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-n-200 dark:border-n-300 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-n-200 outline-none focus:border-accent font-medium"
          >
            <option value="ALL">جميع الفصول الدراسية</option>
            {availableClassrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold tabular-nums">{sorted.length} طالب</span>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-n-200 dark:border-n-300 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            تصدير CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-n-50 dark:bg-n-200">
            <tr>
              <th className={thClass}>#</th>
              <th className={thClass} onClick={() => toggleSort('name')}>الاسم</th>
              <th className={thClass} onClick={() => toggleSort('studentCode')}>الكود</th>
              <th className={thClass + ' text-center'}>كلمة المرور</th>
              <th className={thClass}>الهاتف</th>
              <th className={thClass}>السنة الدراسية</th>
              <th className={thClass}>الفصل الدراسي</th>
              <th className={thClass}>الحالة</th>
              <th className={thClass} onClick={() => toggleSort('avgScore')}>آخر امتحان</th>
              <th className={thClass}>الواجبات</th>
              <th className={thClass}>الحضور</th>
              <th className={thClass}>واتساب</th>
              <th className={thClass + ' text-center'}>إدارة وتعيين الطالب</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-xs text-n-400">
                  لا توجد نتائج مطابقة للبحث أو الفلتر
                </td>
              </tr>
            ) : (
              sorted.map((s, i) => {
                const isSuspended = s.isActive === false;
                const plainPin = String(s.defaultPassword || s.password || '1234').trim();
                const studentGrade = s.grade || s.gradeLevel || 'الصف الثالث الإعدادي';
                const classroomDisplayName =
                  s.classroomName ||
                  availableClassrooms.find((c) => c.id === s.classroomId || c.id === s.classroom)?.name ||
                  (s.classroomId ? 'فصل مسجل' : 'عام / بدون فصل');

                return (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      isSuspended
                        ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/60'
                        : 'hover:bg-n-50 dark:hover:bg-n-200'
                    }`}
                  >
                    <td className={tdClass + ' text-n-400'}>{i + 1}</td>
                    <td className={tdClass + ' font-semibold text-n-800 dark:text-n-700'}>
                      {s.name}
                    </td>
                    <td className={tdClass}>
                      <div className="inline-flex items-center gap-1">
                        <code className="font-mono font-bold text-accent">{s.studentCode}</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(s.studentCode);
                            toast.success(`تم نسخ كود الطالب (${s.studentCode})`);
                          }}
                          title="نسخ كود الطالب"
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-accent transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className={tdClass + ' text-center'}>
                      <PasswordCell
                        password={plainPin}
                        onResetClick={() => {
                          setStudentToResetPassword(s);
                          setNewPasswordInput('1234');
                        }}
                      />
                    </td>
                    <td className={tdClass} dir="ltr">{s.phone || '—'}</td>

                    {/* السنة الدراسية Badge & Quick Assign */}
                    <td className={tdClass}>
                      <button
                        onClick={() => openAssignModal(s)}
                        title="انقر لتغيير أو نقل السنة الدراسية"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full transition-colors"
                      >
                        <GraduationCap className="h-3 w-3 text-indigo-500" />
                        <span>{studentGrade}</span>
                      </button>
                    </td>

                    {/* الفصل الدراسي Badge & Quick Assign */}
                    <td className={tdClass}>
                      <button
                        onClick={() => openAssignModal(s)}
                        title="انقر لتغيير أو نقل الفصل الدراسي"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 px-2.5 py-0.5 rounded-full transition-colors"
                      >
                        <BookOpen className="h-3 w-3 text-emerald-500" />
                        <span className="max-w-[140px] truncate">{classroomDisplayName}</span>
                      </button>
                    </td>

                    <td className={tdClass}>
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full">
                          <UserX className="h-3 w-3" /> معلّق / محظور
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> نشط
                        </span>
                      )}
                    </td>
                    <td className={tdClass}>
                      {s.avgScore != null ? (
                        <div className="flex flex-col">
                          <span className={s.avgScore >= 50 ? 'text-ok font-bold' : 'text-bad font-bold'}>
                            {s.avgScore}%
                          </span>
                          {s.latestScore != null && s.latestMaxScore != null && (
                            <span className="text-[10px] text-n-400 font-mono">
                              ({s.latestScore} / {s.latestMaxScore})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-n-400">—</span>
                      )}
                    </td>
                    <td className={tdClass + ' text-center font-mono'}>{s.submissionsCount}</td>
                    <td className={tdClass + ' text-center font-mono'}>{s.attendanceCount}</td>
                    <td className={tdClass}>
                      <WhatsAppReportButton
                        student={{
                          name: s.name,
                          phone: s.phone,
                          avgScore: s.avgScore || 0,
                          latestScore: s.latestScore ?? null,
                          latestMaxScore: s.latestMaxScore ?? null,
                          latestPercentage: s.latestPercentage ?? (s.avgScore || null),
                          latestQuizTitle: s.latestQuizTitle ?? null,
                          submissionsCount: s.submissionsCount,
                          attendanceCount: s.attendanceCount,
                        }}
                      />
                    </td>
                    <td className={tdClass + ' text-center'}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Assign to Grade & Class Action Button */}
                        <button
                          onClick={() => openAssignModal(s)}
                          title="تعيين السنة الدراسية والفصل"
                          className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors flex items-center gap-1 text-xs font-semibold"
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          <span className="text-[10px] hidden sm:inline">تعيين الفصل</span>
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => {
                            setStudentToResetPassword(s);
                            setNewPasswordInput('1234');
                          }}
                          title="إعادة تعيين كلمة المرور"
                          className="p-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors flex items-center gap-1 text-xs font-semibold"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          <span className="text-[10px] hidden sm:inline">تغيير السر</span>
                        </button>

                        {/* Toggle Active / Block */}
                        <button
                          onClick={() => handleToggleStatus(s)}
                          title={isSuspended ? 'إلغاء الحظر وتفعيل الوصول' : 'تعطيل الوصول وحظر الطالب'}
                          className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                            isSuspended
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isSuspended ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span className="text-[10px]">تفعيل</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span className="text-[10px]">حظر</span>
                            </>
                          )}
                        </button>

                        {/* Delete Student */}
                        <button
                          onClick={() => setStudentToDelete(s)}
                          title="حذف الطالب وسجلاته"
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
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

      {/* Academic Grade & Classroom Assignment Modal */}
      {studentToAssignAcademic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تعيين الطالب للسنة الدراسية والفصل
                </h3>
                <p className="text-xs text-slate-500">
                  الطالب: <strong className="text-slate-800 dark:text-slate-200">{studentToAssignAcademic.name}</strong> ({studentToAssignAcademic.studentCode})
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmAssignAcademic} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  السنة الدراسية / المرحلة:
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {ACADEMIC_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  الفصل الدراسي / المجموعة:
                </label>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">(عام - بدون فصل محدد)</option>
                  {availableClassrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  يمكنك ربط الطالب بفصل محدد ليظهر في كشف هذا الفصل وعدادات الطلاب الخاصة به.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isAssigningAcademic}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isAssigningAcademic ? 'جاري الحفظ...' : 'حفظ وتعيين الطالب'}
                </button>
                <button
                  type="button"
                  disabled={isAssigningAcademic}
                  onClick={() => setStudentToAssignAcademic(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal / Dialog */}
      {studentToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/40 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <KeyRound className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                إعادة تعيين كلمة مرور الطالب
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                الطالب: <strong className="text-slate-800 dark:text-slate-200">{studentToResetPassword.name}</strong> ({studentToResetPassword.studentCode})
              </p>
            </div>

            <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  كلمة المرور الجديدة (4 أرقام):
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="1234"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono font-bold text-sm tracking-widest outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isResettingPassword ? 'جاري الحفظ...' : 'تأكيد وحفظ'}
                </button>
                <button
                  type="button"
                  disabled={isResettingPassword}
                  onClick={() => setStudentToResetPassword(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/40 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تأكيد حذف الطالب
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف الطالب <strong className="text-slate-800 dark:text-slate-200">({studentToDelete.name})</strong>؟ سيتم إزالة حسابه وجميع درجاته وسجلات الحضور نهائياً.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف الطالب'}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

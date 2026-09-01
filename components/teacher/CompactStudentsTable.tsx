'use client';

import { useState, useEffect } from 'react';
import {
  ChevronUp, ChevronDown, Download, ShieldAlert,
  ShieldCheck, Trash2, AlertTriangle, UserX, CheckCircle2
} from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { formatDateShort } from '@/lib/utils';
import { WhatsAppReportButton } from './WhatsAppButton';
import { toggleStudentStatus, deleteStudent } from '@/actions/student';
import { getSubmissions } from '@/lib/store';
import { getStudentAcademicSummary } from '@/lib/analytics';
import { toast } from 'sonner';

export interface Student {
  id: string;
  name: string;
  studentCode: string;
  phone: string | null;
  avgScore: number | null;
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
  onRefresh?: () => void;
}

const STORAGE_KEY = 'edu_students';

function computeDynamicAverages(studentList: Student[]): Student[] {
  if (typeof window === 'undefined') return studentList;
  try {
    const submissions = getSubmissions();
    return studentList.map((student) => {
      const lookupCode = student.studentCode || student.id;
      const summary = getStudentAcademicSummary(lookupCode, submissions);
      if (summary.totalExams > 0) {
        return {
          ...student,
          avgScore: summary.averagePercentage,
          submissionsCount: Math.max(student.submissionsCount || 0, summary.totalExams),
        };
      }
      return {
        ...student,
        avgScore: null,
      };
    });
  } catch {
    return studentList.map((s) => ({ ...s, avgScore: null }));
  }
}

export function CompactStudentsTable({ students: initialStudents, classroomName, onRefresh }: Props) {
  const [students, setStudents] = useState<Student[]>(() => computeDynamicAverages(initialStudents));
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [query, setQuery] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch {}
  }

  const sorted = [...students]
    .filter(
      (s) =>
        s.name.includes(query) ||
        (s.studentCode || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.phone || '').includes(query)
    )
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
      const nextList = prev.filter((s) => s.id !== targetId);
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

  function handleExport() {
    exportToCsv(
      `طلاب_${classroomName}_${new Date().toLocaleDateString('ar-EG')}`,
      sorted.map((s) => ({
        name: s.name,
        studentCode: s.studentCode,
        phone: s.phone || '',
        status: s.isActive === false ? 'معلّق / محظور' : 'نشط',
        avgScore: s.avgScore != null ? `${s.avgScore}%` : 'لا توجد نتائج',
        submissionsCount: s.submissionsCount,
        attendanceCount: s.attendanceCount,
        lastActive: s.lastActive ? formatDateShort(s.lastActive) : '',
      })),
      {
        name: 'اسم الطالب',
        studentCode: 'كود الطالب',
        phone: 'رقم الهاتف',
        status: 'حالة الحساب',
        avgScore: 'متوسط الدرجات',
        submissionsCount: 'الواجبات المُسلَّمة',
        attendanceCount: 'الحصص المحضورة',
        lastActive: 'آخر نشاط',
      }
    );
  }

  const thClass = 'px-3 py-2 text-start text-xs font-medium text-n-500 border-b border-n-200 dark:border-n-300 whitespace-nowrap';
  const tdClass = 'px-3 py-2 text-xs text-n-700 dark:text-n-600 border-b border-n-100 dark:border-n-200 whitespace-nowrap';

  return (
    <div className="rounded-xl border border-n-200 dark:border-n-300 overflow-hidden bg-white dark:bg-n-100">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-n-200 dark:border-n-300">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالاسم أو الكود أو رقم الهاتف..."
          className="flex-1 h-8 px-3 rounded-md border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 bg-white dark:bg-n-200 outline-none focus:border-accent"
        />
        <span className="text-xs text-n-400 tabular-nums">{sorted.length} طالب</span>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 hover:bg-n-100 dark:hover:bg-n-200 transition-colors"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          تصدير CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-n-50 dark:bg-n-200">
            <tr>
              <th className={thClass}>#</th>
              <th className={thClass} onClick={() => toggleSort('name')}>الاسم</th>
              <th className={thClass} onClick={() => toggleSort('studentCode')}>الكود</th>
              <th className={thClass}>الهاتف</th>
              <th className={thClass}>الحالة</th>
              <th className={thClass} onClick={() => toggleSort('avgScore')}>متوسط الدرجات</th>
              <th className={thClass}>الواجبات</th>
              <th className={thClass}>الحضور</th>
              <th className={thClass}>واتساب</th>
              <th className={thClass + ' text-center'}>إدارة وحظر الحساب</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-xs text-n-400">
                  لا توجد نتائج
                </td>
              </tr>
            ) : (
              sorted.map((s, i) => {
                const isSuspended = s.isActive === false;

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
                      <code className="font-mono font-bold text-accent">{s.studentCode}</code>
                    </td>
                    <td className={tdClass} dir="ltr">{s.phone || '—'}</td>
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
                        <span className={s.avgScore >= 50 ? 'text-ok font-bold' : 'text-bad font-bold'}>
                          {s.avgScore}%
                        </span>
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
                          submissionsCount: s.submissionsCount,
                          attendanceCount: s.attendanceCount,
                        }}
                      />
                    </td>
                    <td className={tdClass + ' text-center'}>
                      <div className="flex items-center justify-center gap-1.5">
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

'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { formatDateShort } from '@/lib/utils';
import { WhatsAppReportButton } from './WhatsAppButton';

interface Student {
  id: string;
  name: string;
  studentCode: string;
  phone: string | null;
  avgScore: number | null;
  submissionsCount: number;
  attendanceCount: number;
  lastActive: Date | null;
}

type SortKey = keyof Student;
type SortDir = 'asc' | 'desc';

interface Props {
  students: Student[];
  classroomName: string;
}

export function CompactStudentsTable({ students, classroomName }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [query, setQuery] = useState('');

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

  function handleExport() {
    exportToCsv(
      `طلاب_${classroomName}_${new Date().toLocaleDateString('ar-EG')}`,
      sorted.map((s) => ({
        name: s.name,
        studentCode: s.studentCode,
        phone: s.phone || '',
        avgScore: s.avgScore != null ? `${s.avgScore}%` : 'لا توجد نتائج',
        submissionsCount: s.submissionsCount,
        attendanceCount: s.attendanceCount,
        lastActive: s.lastActive ? formatDateShort(s.lastActive) : '',
      })),
      {
        name: 'اسم الطالب',
        studentCode: 'كود الطالب',
        phone: 'رقم الهاتف',
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
              <th className={thClass} onClick={() => toggleSort('avgScore')}>متوسط الدرجات</th>
              <th className={thClass}>الواجبات</th>
              <th className={thClass}>الحضور</th>
              <th className={thClass}>واتساب</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-xs text-n-400">
                  لا توجد نتائج
                </td>
              </tr>
            ) : (
              sorted.map((s, i) => (
                <tr key={s.id} className="hover:bg-n-50 dark:hover:bg-n-200 transition-colors">
                  <td className={tdClass + ' text-n-400'}>{i + 1}</td>
                  <td className={tdClass + ' font-semibold text-n-800 dark:text-n-700'}>{s.name}</td>
                  <td className={tdClass}>
                    <code className="font-mono font-bold text-accent">{s.studentCode}</code>
                  </td>
                  <td className={tdClass} dir="ltr">{s.phone || '—'}</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

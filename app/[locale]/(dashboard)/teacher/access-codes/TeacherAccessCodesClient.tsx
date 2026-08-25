'use client';

import React, { useState, useMemo } from 'react';
import {
  Ticket, Plus, Download, Copy, Check, Filter,
  CheckCircle2, Clock, XCircle, AlertCircle, Sparkles, DollarSign, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveSessionItem {
  id: string;
  title: string;
  roomCode: string;
  isActive: boolean;
  classroomName: string;
}

interface AccessCodeItem {
  id: string;
  code: string;
  price: number;
  liveSessionId: string;
  liveSessionTitle: string;
  roomCode: string;
  usedByStudentId: string | null;
  studentName: string | null;
  studentCode: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  status: 'USED' | 'AVAILABLE' | 'EXPIRED';
}

export function TeacherAccessCodesClient({
  sessions,
  initialCodes,
}: {
  sessions: LiveSessionItem[];
  initialCodes: AccessCodeItem[];
}) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[0]?.id || 'ALL'
  );
  const [codes, setCodes] = useState<AccessCodeItem[]>(initialCodes);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'USED' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(50);
  const [expiresAt, setExpiresAt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalSessionId, setModalSessionId] = useState<string>(sessions[0]?.id || '');
  const [modalError, setModalError] = useState('');

  // Copy Feedback State
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filtered Codes
  const filteredCodes = useMemo(() => {
    return codes.filter((c) => {
      const matchesSession =
        selectedSessionId === 'ALL' || c.liveSessionId === selectedSessionId;
      const matchesStatus =
        statusFilter === 'ALL' || c.status === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.studentName && c.studentName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSession && matchesStatus && matchesSearch;
    });
  }, [codes, selectedSessionId, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const relevant =
      selectedSessionId === 'ALL'
        ? codes
        : codes.filter((c) => c.liveSessionId === selectedSessionId);

    const total = relevant.length;
    const available = relevant.filter((c) => c.status === 'AVAILABLE').length;
    const used = relevant.filter((c) => c.status === 'USED').length;
    const expired = relevant.filter((c) => c.status === 'EXPIRED').length;
    const revenue = relevant
      .filter((c) => c.status === 'USED')
      .reduce((sum, c) => sum + (c.price || 0), 0);

    return { total, available, used, expired, revenue };
  }, [codes, selectedSessionId]);

  // Handle Generate Codes
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!modalSessionId) {
      setModalError('يرجى اختيار الحصة المباشرة');
      return;
    }

    setIsGenerating(true);
    setModalError('');

    try {
      const res = await fetch('/api/admin/access-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liveSessionId: modalSessionId,
          quantity,
          price,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل في توليد الأكواد');
      }

      // Refresh codes list from API
      const refreshRes = await fetch('/api/admin/access-codes');
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setCodes(refreshData.codes);
      }

      setIsModalOpen(false);
      // Auto select the session we generated for
      setSelectedSessionId(modalSessionId);
    } catch (err: any) {
      setModalError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle Copy All Available Codes
  function handleCopyAllUnused() {
    const available = filteredCodes
      .filter((c) => c.status === 'AVAILABLE')
      .map((c) => c.code);

    if (available.length === 0) {
      alert('لا توجد أكواد متاحة للنسخ');
      return;
    }

    navigator.clipboard.writeText(available.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  }

  // Handle Copy Single Code
  function handleCopySingle(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Handle Export CSV
  function handleExportCSV() {
    if (filteredCodes.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = [
      'الكود',
      'الحصة المباشرة',
      'السعر (ج.م)',
      'الحالة',
      'اسم الطالب',
      'كود الطالب',
      'تاريخ الاستخدام',
      'تاريخ الانتهاء',
      'تاريخ الإنشاء',
    ];

    const rows = filteredCodes.map((c) => [
      `"${c.code}"`,
      `"${c.liveSessionTitle}"`,
      c.price,
      `"${c.status === 'USED' ? 'مستخدم' : c.status === 'AVAILABLE' ? 'متاح' : 'منتهي'}"`,
      `"${c.studentName || '—'}"`,
      `"${c.studentCode || '—'}"`,
      `"${c.usedAt ? new Date(c.usedAt).toLocaleString('ar-EG') : '—'}"`,
      `"${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ar-EG') : 'بدون انتهاء'}"`,
      `"${new Date(c.createdAt).toLocaleDateString('ar-EG')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `access-codes-${selectedSessionId}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 shadow-sm';

  return (
    <div className="space-y-6">
      {/* ── Top Action Bar ────────────────────────────────────────── */}
      <div className={`${card} p-5 flex flex-wrap items-center justify-between gap-4`}>
        {/* Session Selector */}
        <div className="flex items-center gap-3 min-w-[280px]">
          <label className="text-xs font-bold text-n-600 dark:text-n-400 whitespace-nowrap">
            اختر الحصة المباشرة:
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full text-xs font-semibold bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
          >
            <option value="ALL">جميع الحصص المباشرة ({codes.length} كود)</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.classroomName}) {s.isActive ? '🟢 مباشر الآن' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyAllUnused}
            className="flex items-center gap-1.5 text-xs"
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5 text-ok" />
                <span className="text-ok font-bold">تم نسخ الأكواد المتاحة!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-n-500" />
                <span>نسخ الأكواد المتاحة ({stats.available})</span>
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5 text-n-500" />
            <span>تصدير CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setModalSessionId(selectedSessionId !== 'ALL' ? selectedSessionId : sessions[0]?.id || '');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>توليد أكواد جديدة</span>
          </Button>
        </div>
      </div>

      {/* ── Stats Summary Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">إجمالي الأكواد</p>
            <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-0.5">{stats.total}</p>
          </div>
          <Ticket className="h-6 w-6 text-accent" strokeWidth={1.75} />
        </div>

        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">الأكواد المتاحة للبيع</p>
            <p className="text-2xl font-bold text-accent mt-0.5">{stats.available}</p>
          </div>
          <Clock className="h-6 w-6 text-accent/60" strokeWidth={1.75} />
        </div>

        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">الأكواد المستخدمة</p>
            <p className="text-2xl font-bold text-ok mt-0.5">{stats.used}</p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-ok" strokeWidth={1.75} />
        </div>

        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-n-500 dark:text-n-400">إجمالي المبيعات المحصلة</p>
            <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-0.5">
              {stats.revenue} <span className="text-xs font-normal text-n-500">ج.م</span>
            </p>
          </div>
          <DollarSign className="h-6 w-6 text-ok" strokeWidth={1.75} />
        </div>
      </div>

      {/* ── Filter Bar & Search ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-n-100 dark:bg-n-200 rounded-lg border border-n-200 dark:border-n-300 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'الكل', count: stats.total },
            { id: 'AVAILABLE', label: 'متاح للبيع 🟡', count: stats.available },
            { id: 'USED', label: 'مستخدم ومفعل ✅', count: stats.used },
            { id: 'EXPIRED', label: 'منتهي الصلاحية 🔴', count: stats.expired },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === tab.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-n-600 dark:text-n-400 hover:text-n-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder="بحث بالكود أو اسم الطالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2 pl-8 focus:outline-none focus:border-accent"
          />
          <Filter className="h-3.5 w-3.5 text-n-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* ── Access Codes Table ────────────────────────────────────── */}
      <div className={`${card} overflow-hidden`}>
        {filteredCodes.length === 0 ? (
          <div className="p-12 text-center text-sm text-n-400">
            <Ticket className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="font-semibold text-n-700 dark:text-n-600">لا توجد أكواد مطابقة للمعايير المحددة</p>
            <p className="text-xs text-n-400 mt-1">اضغط على زر "توليد أكواد جديدة" لإنشاء باقة أكواد للحصة المباشرة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-n-50 dark:bg-n-200 border-b border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 font-bold">
                  <th className="p-3 text-start">الكود (Code)</th>
                  <th className="p-3 text-start">الحصة المباشرة</th>
                  <th className="p-3 text-start">السعر</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start">الطالب المستخدم</th>
                  <th className="p-3 text-start">تاريخ الاستخدام</th>
                  <th className="p-3 text-start">تاريخ الانتهاء</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-n-100 dark:divide-n-200">
                {filteredCodes.map((c) => (
                  <tr key={c.id} className="hover:bg-n-50/60 dark:hover:bg-n-200/50 transition-colors">
                    {/* Code */}
                    <td className="p-3 font-mono font-bold text-n-800 dark:text-n-700">
                      <span className="bg-accent-light text-accent-text border border-accent/20 px-2 py-1 rounded">
                        {c.code}
                      </span>
                    </td>

                    {/* Live Session */}
                    <td className="p-3 font-semibold text-n-700 dark:text-n-600 max-w-[200px] truncate">
                      {c.liveSessionTitle}
                    </td>

                    {/* Price */}
                    <td className="p-3 font-bold text-n-800 dark:text-n-700 tabular-nums">
                      {c.price} ج.م
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      {c.status === 'USED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok bg-ok-light border border-ok/20 px-2 py-0.5 rounded">
                          <CheckCircle2 className="h-3 w-3" /> مستخدم
                        </span>
                      )}
                      {c.status === 'AVAILABLE' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-text bg-accent-light border border-accent/20 px-2 py-0.5 rounded">
                          <Clock className="h-3 w-3" /> متاح للبيع
                        </span>
                      )}
                      {c.status === 'EXPIRED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-bad bg-bad-light border border-bad/20 px-2 py-0.5 rounded">
                          <XCircle className="h-3 w-3" /> منتهي
                        </span>
                      )}
                    </td>

                    {/* Student Name */}
                    <td className="p-3 text-n-700 dark:text-n-600">
                      {c.studentName ? (
                        <div>
                          <p className="font-bold text-n-800 dark:text-n-700">{c.studentName}</p>
                          <p className="text-[10px] text-n-400 font-mono">{c.studentCode || ''}</p>
                        </div>
                      ) : (
                        <span className="text-n-400">—</span>
                      )}
                    </td>

                    {/* Used At */}
                    <td className="p-3 text-n-500 tabular-nums">
                      {c.usedAt ? new Date(c.usedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>

                    {/* Expires At */}
                    <td className="p-3 text-n-500 tabular-nums">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ar-EG') : 'بدون انتهاء'}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySingle(c.code)}
                        className="h-7 px-2 text-xs"
                      >
                        {copiedCode === c.code ? (
                          <span className="text-ok font-bold flex items-center gap-1">
                            <Check className="h-3 w-3" /> تم
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="h-3 w-3" /> نسخ
                          </span>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Generate Codes Modal ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-n-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-n-100 rounded-2xl border border-n-200 dark:border-n-300 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-n-200 dark:border-n-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent-light text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-n-800 dark:text-n-700">توليد باقة أكواد جديدة</h3>
                  <p className="text-xs text-n-500 dark:text-n-400">إنشاء أكواد فريدة للحصة المباشرة بنظام الدفع الفردي</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-n-400 hover:text-n-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-bad-light border border-bad/20 text-bad text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Target Live Session */}
              <div>
                <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                  الحصة المباشرة المستهدفة *
                </label>
                <select
                  value={modalSessionId}
                  onChange={(e) => setModalSessionId(e.target.value)}
                  className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">-- اختر الحصة المباشرة --</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.classroomName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                    عدد الأكواد *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                    required
                  />
                  <p className="text-[10px] text-n-400 mt-1">الحد الأقصى 100 كود في المرة</p>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1">
                    سعر الكود (ج.م) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-n-700 dark:text-n-600 mb-1 flex items-center justify-between">
                  <span>تاريخ انتهاء الصلاحية (اختياري)</span>
                  <span className="text-[10px] text-n-400">اتركه فارغاً لصلاحية مفتوحة</span>
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full text-xs bg-n-50 dark:bg-n-200 border border-n-200 dark:border-n-300 text-n-800 dark:text-n-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Notice Box */}
              <div className="p-3 bg-accent-light/50 border border-accent/20 rounded-lg text-[11px] text-accent-text space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5" /> تنسيق الكود الناتج:
                </p>
                <p className="font-mono text-xs font-bold text-accent">EDU-XXXX-XXXX (مثل: EDU-A8K2-9B7C)</p>
                <p>كل كود صالح للاستخدام لمرة واحدة فقط ويرتبط فوراً بحساب الطالب عند التفعيل.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isGenerating}
                  className="px-6"
                >
                  توليد وحفظ الأكواد الآن
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

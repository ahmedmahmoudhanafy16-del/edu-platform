'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { updateTeacherProfileAction, updateTeacherPasswordAction } from '@/actions/teacher';

interface TeacherProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export function TeacherSettingsClient({
  initialTeacher,
  locale,
}: {
  initialTeacher: TeacherProfile;
  locale: string;
}) {
  const isAr = locale === 'ar';

  // Profile Form State
  const [name, setName] = useState(initialTeacher?.name || '');
  const [email, setEmail] = useState(initialTeacher?.email || '');
  const [phone, setPhone] = useState(initialTeacher?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Active initials for instant preview
  const initials =
    (name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('')) ||
    (isAr ? 'م' : 'T');

  // Handle Profile Update
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error(isAr ? 'يرجى إدخال اسم صحيح لا يقل عن حرفين' : 'Please enter a valid name (at least 2 characters)');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateTeacherProfileAction({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      if (res.success && res.user) {
        toast.success(isAr ? 'تم حفظ وتحديث بيانات المعلم بنجاح' : 'Teacher profile updated successfully');

        // Broadcast event across UI (e.g. TopNav)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('edu_teacher_updated', {
              detail: {
                id: res.user.id,
                name: res.user.name,
                email: res.user.email,
                phone: res.user.phone,
              },
            })
          );

          // Update local storage session if exists
          try {
            const rawSession = localStorage.getItem('user_session');
            if (rawSession) {
              const parsed = JSON.parse(rawSession);
              localStorage.setItem(
                'user_session',
                JSON.stringify({ ...parsed, name: res.user.name, email: res.user.email, phone: res.user.phone })
              );
            }
          } catch {}
        }
      } else {
        toast.error(res.error || (isAr ? 'فشل تحديث البيانات' : 'Failed to update profile'));
      }
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Handle Password Update
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword) {
      toast.error(isAr ? 'يرجى كتابة كلمة المرور الحالية' : 'Please enter current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error(isAr ? 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام' : 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(isAr ? 'كلمة المرور وتأكيدها غير متطابقين' : 'New password and confirmation do not match');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await updateTeacherPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        toast.success(isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.error || (isAr ? 'فشل تغيير كلمة المرور' : 'Failed to change password'));
      }
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error'));
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Profile Summary Hero Card ───────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {name || (isAr ? 'المعلم' : 'Teacher')}
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {isAr ? 'حساب المعلم المعتمد' : 'Verified Teacher Account'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {email || 'teacher@school.com'}
              {phone ? ` · ${phone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span>{isAr ? 'الحساب مؤمّن ومحمى بنظام المصادقة المشفرة' : 'Account secured with encrypted authentication'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Section 1: Edit Account Details ───────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'البيانات الشخصية والحساب' : 'Personal Profile & Contact'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'تعديل اسمك الظاهر للطلاب ومعلومات التواصل' : 'Change your public display name and contact email'}
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الاسم الظاهر للطلاب:' : 'Display Name for Students:'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? 'مثال: أ/ أحمد محمود' : 'e.g. Mr. Ahmed Mahmoud'}
                  required
                  className="pe-9 h-11 text-sm bg-slate-50/50 dark:bg-slate-800/50"
                />
                <User className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr
                  ? 'هذا الاسم سيظهر للطلاب في بنك الاختبارات والواجبات ورسائل الواتساب وشريط الموقع'
                  : 'This name appears to students across exams, assignments, WhatsApp notifications, and navbar'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="pe-9 h-11 text-sm font-mono bg-slate-50/50 dark:bg-slate-800/50"
                />
                <Mail className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'رقم الهاتف للتواصل والتنبيهات:' : 'Phone Number (Alerts & Contact):'}
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isAr ? 'مثال: 01012345678' : 'e.g. +201012345678'}
                  className="pe-9 h-11 text-sm font-mono bg-slate-50/50 dark:bg-slate-800/50"
                />
                <Phone className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 px-5 shadow-sm flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                {isSavingProfile
                  ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                  : (isAr ? 'حفظ تعديلات الحساب' : 'Save Account Changes')}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Section 2: Change Password ─────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'الأمان وتغيير كلمة المرور' : 'Security & Password Update'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'تحديث كلمة المرور لحماية حسابك من الوصول غير المصرح به' : 'Update your password to keep your teacher account secure'}
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'كلمة المرور الحالية:' : 'Current Password:'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={isAr ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                  required
                  className="pe-9 h-11 text-sm bg-slate-50/50 dark:bg-slate-800/50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass((p) => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                  aria-label={showCurrentPass ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'كلمة المرور الجديدة:' : 'New Password:'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isAr ? 'لا تقل عن 6 أحرف أو أرقام' : 'At least 6 characters'}
                  required
                  minLength={6}
                  className="pe-9 h-11 text-sm bg-slate-50/50 dark:bg-slate-800/50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass((p) => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                  aria-label={showNewPass ? 'Hide password' : 'Show password'}
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'تأكيد كلمة المرور الجديدة:' : 'Confirm New Password:'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isAr ? 'أعد كتابة كلمة المرور الجديدة' : 'Re-enter new password'}
                  required
                  minLength={6}
                  className="pe-9 h-11 text-sm bg-slate-50/50 dark:bg-slate-800/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((p) => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                  aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && (
              <div className="text-xs flex items-center gap-1.5 pt-1">
                {newPassword === confirmPassword ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isAr ? 'كلمتا المرور متطابقتان' : 'Passwords match'}
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                  </span>
                )}
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-10 px-5 shadow-sm flex items-center gap-1.5"
              >
                <Lock className="h-4 w-4" />
                {isSavingPassword
                  ? (isAr ? 'جاري التحديث...' : 'Updating...')
                  : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

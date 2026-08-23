import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-n-200 dark:border-n-300 bg-white dark:bg-n-100 mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-n-400">
          {year} منصة التعليم الإلكتروني. جميع الحقوق محفوظة.
        </p>
        <nav className="flex items-center gap-4 text-xs text-n-400">
          <Link href="/privacy" className="hover:text-n-700 transition-colors">سياسة الخصوصية</Link>
          <Link href="/terms" className="hover:text-n-700 transition-colors">شروط الاستخدام</Link>
          <Link href="/support" className="hover:text-n-700 transition-colors">الدعم والمساعدة</Link>
        </nav>
      </div>
    </footer>
  )
}

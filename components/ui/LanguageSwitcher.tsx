'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function toggle() {
    const next = locale === 'ar' ? 'en' : 'ar'
    const newPath = pathname.replace(`/${locale}`, `/${next}`)
    router.push(newPath)
  }

  return (
    <button
      onClick={toggle}
      aria-label="تغيير اللغة / Switch language"
      className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-n-500 hover:text-n-800 hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-[140ms] text-xs font-medium"
    >
      <Globe className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
      <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  )
}

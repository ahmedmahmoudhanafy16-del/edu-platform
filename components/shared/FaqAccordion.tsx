'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaqItem {
  q: string
  a: string
}

const FAQ_AR: FaqItem[] = [
  {
    q: 'كيف أدخل الحصة المباشرة؟',
    a: 'اذهب إلى قسم "الحصص المباشرة" في القائمة الجانبية، أدخل الكود الذي أرسله لك المعلم في الحقل المخصص، ثم اضغط "دخول الحصة". لا تحتاج لتحميل أي تطبيق.',
  },
  {
    q: 'كيف أُسلِّم الواجب؟',
    a: 'من قسم "الواجبات"، اختر الواجب المطلوب واضغط عليه. اكتب إجابتك في المربع المخصص ثم اضغط "تسليم الواجب". ستصلك رسالة تأكيد فور التسليم.',
  },
  {
    q: 'نسيت كود الدخول، ماذا أفعل؟',
    a: 'تواصل مع المعلم مباشرة لاسترداد كودك. الكود هو معرّفك الشخصي في المنصة ولا يمكن تغييره إلا عن طريق المعلم.',
  },
  {
    q: 'لماذا تم تسليم امتحاني تلقائياً؟',
    a: 'يحدث التسليم التلقائي في حالتين: انتهاء الوقت المحدد للامتحان، أو مغادرة نافذة الامتحان أكثر من مرتين. احرص على البقاء في نافذة الامتحان طوال فترته.',
  },
]

export function FaqAccordion({ items = FAQ_AR }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-n-200 dark:divide-n-300 rounded-xl border border-n-200 dark:border-n-300 overflow-hidden">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={cn(
                'w-full flex items-center justify-between gap-4 px-5 py-4 text-start text-sm font-medium transition-colors duration-[140ms]',
                isOpen ? 'bg-n-50 dark:bg-n-200 text-n-800 dark:text-n-700' : 'bg-white dark:bg-n-100 text-n-700 dark:text-n-600 hover:bg-n-50'
              )}
            >
              <span>{item.q}</span>
              <ChevronDown
                className={cn('h-4 w-4 flex-shrink-0 text-n-400 transition-transform duration-[140ms]', isOpen && 'rotate-180')}
                strokeWidth={1.75}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-2 bg-white dark:bg-n-100 text-sm text-n-500 dark:text-n-400 leading-relaxed">
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

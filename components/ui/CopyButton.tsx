'use client'
import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text?: string
  value?: string
  className?: string
  label?: string
}

export function CopyButton({ text, value, className, label }: CopyButtonProps) {
  const contentToCopy = text || value || ''
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCopy = useCallback(async () => {
    if (loading || copied || !contentToCopy) return
    setLoading(true)
    try {
      await navigator.clipboard.writeText(contentToCopy)
      setLoading(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setLoading(false)
      const el = document.createElement('textarea')
      el.value = contentToCopy
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [contentToCopy, loading, copied])

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'تم النسخ' : `نسخ ${label ?? ''}`}
      className={cn(
        'relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium',
        'border transition-colors duration-[140ms]',
        copied
          ? 'border-ok/30 bg-ok-light text-ok'
          : 'border-n-200 dark:border-n-300 text-n-500 hover:text-n-800 hover:bg-n-100 dark:hover:bg-n-200 hover:border-n-300',
        className
      )}
    >
      {copied
        ? <Check className="h-3 w-3 flex-shrink-0" strokeWidth={2.5} />
        : <Copy className="h-3 w-3 flex-shrink-0" strokeWidth={1.75} />}
      <span>{copied ? 'تم النسخ' : (label ?? 'نسخ')}</span>
    </button>
  )
}

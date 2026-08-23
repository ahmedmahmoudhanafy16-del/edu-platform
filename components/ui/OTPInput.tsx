'use client'
import { useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  className?: string
  autoFocus?: boolean
}

export function OTPInput({
  length = 8,
  value,
  onChange,
  className,
  autoFocus = false,
}: OTPInputProps) {
  const chars = value.split('').slice(0, length)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function focusAt(i: number) {
    inputs.current[Math.min(Math.max(0, i), length - 1)]?.focus()
  }

  function handleChange(i: number, char: string) {
    const sanitized = char.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!sanitized) return
    const next = [...chars]
    next[i] = sanitized[0]
    onChange(next.join('').slice(0, length))
    if (i < length - 1) focusAt(i + 1)
  }

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...chars]
      if (next[i]) {
        next[i] = ''
        onChange(next.join(''))
      } else {
        focusAt(i - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusAt(i + 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusAt(i - 1)
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, length)
    onChange(pasted)
    focusAt(Math.min(pasted.length, length - 1))
  }

  const cellClass = [
    'w-9 h-11 rounded-md border text-center',
    'text-base font-bold font-mono text-n-800 dark:text-n-700 uppercase tracking-wider',
    'focus:border-accent focus:outline-none focus:bg-accent-light dark:focus:bg-accent-light',
    'transition-colors duration-[140ms]',
    'bg-white dark:bg-n-100',
    'caret-transparent select-none',
  ].join(' ')

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      dir="ltr"
      role="group"
      aria-label="كود الحصة"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el }}
          type="text"
          inputMode="text"
          maxLength={1}
          value={chars[i] ?? ''}
          autoFocus={autoFocus && i === 0}
          aria-label={`الحرف ${i + 1}`}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={cn(
            cellClass,
            chars[i]
              ? 'border-n-400 dark:border-n-400'
              : 'border-n-200 dark:border-n-300'
          )}
        />
      ))}
    </div>
  )
}

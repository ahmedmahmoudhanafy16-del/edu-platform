import { cn } from '@/lib/utils'

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded bg-n-200 dark:bg-n-300',
        'animate-pulse',
        className
      )}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-5 py-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-7 w-16" />
          <SkeletonBox className="h-2.5 w-20" />
        </div>
        <SkeletonBox className="h-5 w-5" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox className={`h-3 ${i === 0 ? 'w-3/4' : 'w-1/2'}`} />
        </td>
      ))}
    </tr>
  )
}

export function AssignmentCardSkeleton() {
  return (
    <div className="rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-5 py-4 space-y-2">
      <div className="flex items-start justify-between">
        <SkeletonBox className="h-4 w-2/3" />
        <SkeletonBox className="h-5 w-14 rounded" />
      </div>
      <SkeletonBox className="h-3 w-1/2" />
      <SkeletonBox className="h-3 w-1/3" />
    </div>
  )
}

export function QuizListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5 flex-1">
              <SkeletonBox className="h-4 w-1/2" />
              <SkeletonBox className="h-3 w-1/3" />
            </div>
            <SkeletonBox className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

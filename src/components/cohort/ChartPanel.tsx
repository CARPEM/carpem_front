import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  /** Element rendered in the top-right corner of the header (e.g. search input) */
  headerRight?: ReactNode
  children: ReactNode
  loading?: boolean
  error?: string | null
  /** Extra Tailwind classes on the outer wrapper */
  className?: string
}

/**
 * Reusable panel frame used by all cohort analytics chart panels.
 * Consistent with the card style used in the Patient 360° view panels.
 */
export default function ChartPanel({ title, subtitle, headerRight, children, loading, error, className = '' }: Props) {
  return (
    <div className={`flex flex-col rounded border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100 shrink-0 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-700 leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 relative p-2">
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[11px] text-red-500 text-center px-2">
            {error}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2 p-1 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-16 bg-gray-100 rounded mt-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

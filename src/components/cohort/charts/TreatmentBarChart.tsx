import {
  BarChart, Bar, XAxis, YAxis, Cell, LabelList,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { TreatmentItem } from '@/types/cohortAnalytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  data: TreatmentItem[]
  /** Return the fill colour for a bar, given the entry and its index. */
  getColor: (entry: TreatmentItem, index: number) => string
  /** Truncate axis labels to this many characters. Omit to show full labels. */
  maxLabelChars?: number
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: TreatmentItem }>
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-900 text-white text-[10px] rounded px-2 py-1.5 shadow-lg pointer-events-none max-w-[220px]">
      <div className="font-semibold leading-snug">{d.category}</div>
      <div className="text-gray-300 mt-0.5">N = {d.count} ({d.pct}%)</div>
    </div>
  )
}

// ─── TreatmentBarChart ────────────────────────────────────────────────────────

export default function TreatmentBarChart({ data, getColor, maxLabelChars }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-gray-400 italic">
        No data
      </div>
    )
  }

  const display = data.map((d) => ({
    ...d,
    label:
      maxLabelChars && d.category.length > maxLabelChars
        ? d.category.slice(0, maxLabelChars) + '…'
        : d.category,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={display} margin={{ top: 14, right: 8, bottom: 0, left: 4 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 8, fill: '#6B7280', angle: -40, textAnchor: 'end', dx: -2 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
          interval={0}
          height={52}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F3F4F6' }} />
        <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={48}>
          {display.map((entry, i) => (
            <Cell key={entry.category} fill={getColor(entry, i)} />
          ))}
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontSize: 9, fill: '#374151' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

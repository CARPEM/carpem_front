import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useCohortStore } from '@/store/cohort'

const COLORS: Record<string, string> = {
  Female:  '#E53E3E',
  Male:    '#3182CE',
  Other:   '#DD6B20',
  Unknown: '#718096',
}

interface TooltipPayload {
  name: string
  value: number
  payload: { label: string; count: number; pct: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const { label, count, pct } = payload[0].payload
  return (
    <div className="bg-gray-900 text-white text-[11px] rounded px-2 py-1.5 shadow-lg">
      <div className="font-semibold">{label}</div>
      <div className="text-gray-300">N = {count} ({pct}%)</div>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: { value: string; color: string; payload: { count: number; pct: string } }[] }) {
  if (!payload) return null
  return (
    <ul className="flex flex-col gap-1 justify-center pl-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-[11px] text-gray-700">
          <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: entry.color }} />
          <span>{entry.value}</span>
          <span className="text-gray-400 ml-auto pl-2">{entry.payload.pct}%</span>
        </li>
      ))}
    </ul>
  )
}

export default function GenderDistribution() {
  const { analytics, setFilter, filters } = useCohortStore()

  if (!analytics) return null

  const total = analytics.gender.reduce((s, g) => s + g.count, 0)
  const data = analytics.gender.map((g) => ({
    label: g.label,
    count: g.count,
    pct:   total > 0 ? ((g.count / total) * 100).toFixed(0) : '0',
  }))

  const handleClick = (entry: { label: string }) => {
    const val = entry.label.toLowerCase()
    // Toggle off if already active
    setFilter('gender', filters.gender === val ? undefined : val)
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="40%"
          cy="50%"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={2}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.label}
              fill={COLORS[entry.label] ?? '#A0AEC0'}
              opacity={!filters.gender || filters.gender === entry.label.toLowerCase() ? 1 : 0.35}
              stroke="white"
              strokeWidth={1}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          content={<CustomLegend />}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

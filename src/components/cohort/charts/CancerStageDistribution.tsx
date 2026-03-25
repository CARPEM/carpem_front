import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts'
import { useCohortStore } from '@/store/cohort'

const BAR_COLOR = '#2E7D4F'

// Abbreviate labels to fit narrow bars
function shortStage(s: string): string {
  return s.replace('Stage ', '')
}

interface TooltipPayload {
  payload: { stage: string; count: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const { stage, count } = payload[0].payload
  return (
    <div className="bg-gray-900 text-white text-[11px] rounded px-2 py-1.5 shadow-lg">
      <div className="font-semibold">{stage}</div>
      <div className="text-gray-300">N = {count}</div>
    </div>
  )
}

export default function CancerStageDistribution() {
  const { analytics, setFilter, filters } = useCohortStore()
  if (!analytics) return null

  const data = analytics.stages.map((s) => ({
    ...s,
    short: shortStage(s.stage),
  }))

  if (data.length === 0) return (
    <div className="flex items-center justify-center h-full text-[11px] text-gray-400 italic">No data</div>
  )

  const handleClick = (entry: { stage: string }) => {
    // Extract the Roman numeral part (e.g. "Stage IIB" → "IIB")
    const val = shortStage(entry.stage)
    setFilter('stage', filters.stage === val ? undefined : val)
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 14, right: 8, left: -20, bottom: 0 }}
        onClick={(e) => { if (e?.activePayload?.[0]) handleClick(e.activePayload[0].payload as { stage: string }) }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid vertical={false} stroke="#F3F4F6" />
        <XAxis
          dataKey="short"
          tick={{ fontSize: 9, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0FAF4' }} />
        <Bar
          dataKey="count"
          radius={[2, 2, 0, 0]}
          maxBarSize={36}
          fill={BAR_COLOR}
        >
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

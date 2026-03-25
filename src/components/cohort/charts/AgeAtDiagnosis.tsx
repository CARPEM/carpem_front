import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts'
import { useCohortStore } from '@/store/cohort'

const BAR_COLOR = '#1A7F8E'

interface TooltipPayload {
  payload: { range: string; count: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const { range, count } = payload[0].payload
  return (
    <div className="bg-gray-900 text-white text-[11px] rounded px-2 py-1.5 shadow-lg">
      <div className="font-semibold">{range} years</div>
      <div className="text-gray-300">N = {count}</div>
    </div>
  )
}

export default function AgeAtDiagnosis() {
  const { analytics } = useCohortStore()
  if (!analytics) return null

  const data = analytics.ageBins.filter((b) => b.count > 0)
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-full text-[11px] text-gray-400 italic">No data</div>
  )

  // Weighted mean across all bins with data
  const totalN = data.reduce((s, b) => s + b.count, 0)
  const weightedMean = data.reduce((s, b) => s + (b.meanAge ?? 0) * b.count, 0) / (totalN || 1)

  return (
    <div className="flex flex-col h-full">
      <p className="text-[10px] text-gray-500 text-right pr-2 shrink-0">
        Mean: {weightedMean.toFixed(1)} yrs
      </p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 14, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey="range"
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0F7FB' }} />
            <Bar dataKey="count" fill={BAR_COLOR} radius={[2, 2, 0, 0]} maxBarSize={32}>
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontSize: 9, fill: '#374151' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

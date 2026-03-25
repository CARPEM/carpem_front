import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts'
import { usePatientStore } from '@/store/patient'
import { useTimelineStore } from '@/store/timeline'
import { toMonthsFromT0 } from '@/lib/t0'

// Known biomarkers — all entries that match loaded observations are shown
const BIOMARKER_CONFIG = [
  { loincCode: '6690-2',  label: 'WBC',      unit: '10⁹/L' },
  { loincCode: '718-7',   label: 'Hb',       unit: 'g/dL'  },
  { loincCode: '10334-1', label: 'CA 15-3',  unit: 'U/mL'  },
  { loincCode: '24108-3', label: 'CA 19-9',  unit: 'U/mL'  },
  { loincCode: '2857-1',  label: 'CEA',      unit: 'ng/mL' },
  { loincCode: '19197-8', label: 'PSA',      unit: 'ng/mL' },
  { loincCode: '14804-9', label: 'LDH',      unit: 'U/L'   },
  { loincCode: '12994-6', label: 'S100B',    unit: 'µg/L'  },
  { loincCode: '83050-6', label: 'CA-125',   unit: 'U/mL'  },
  { loincCode: '6768-6',  label: 'Alk Phos', unit: 'U/L'   },
  { loincCode: '1975-2',  label: 'Bilirubin',unit: 'mg/dL' },
]

interface SparkPoint {
  months: number
  value: number
  isHigh: boolean
}

// Custom dot: red if above reference range, blue if normal
function SparkDot(props: unknown) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: SparkPoint }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill={payload.isHigh ? '#EF4444' : '#3B82F6'}
      stroke="white"
      strokeWidth={1}
    />
  )
}

interface BiomarkerDataItem {
  loincCode: string
  label: string
  unit: string
  points: SparkPoint[]
  refHigh: number | null
  yMin: number
  yMax: number
}

export default function BiomarkerSparklines() {
  const { observations, t0 } = usePatientStore()
  const { zoom, offset, centralPlotWidth, hoverMonths, setHoverMonths } = useTimelineStore()

  // Expensive filtering/sorting/mapping — only recompute when patient data changes,
  // not on every zoom/pan/hover event
  const biomarkerData = useMemo<BiomarkerDataItem[]>(() => {
    if (!t0) return []
    const result: BiomarkerDataItem[] = []
    for (const { loincCode, label, unit } of BIOMARKER_CONFIG) {
      const bioObs = observations
        .filter(
          (o) =>
            o.category?.some((cat) => cat.coding?.some((c) => c.code === 'laboratory')) &&
            o.code?.coding?.some((c) => c.code === loincCode) &&
            o.effectiveDateTime != null &&
            o.valueQuantity?.value != null,
        )
        .sort(
          (a, b) =>
            new Date(a.effectiveDateTime!).getTime() - new Date(b.effectiveDateTime!).getTime(),
        )
      if (bioObs.length === 0) continue
      const refHigh =
        bioObs.find((o) => o.referenceRange?.[0]?.high?.value != null)
          ?.referenceRange?.[0]?.high?.value ?? null
      const points: SparkPoint[] = bioObs.map((o) => {
        const value = o.valueQuantity!.value!
        return {
          months: toMonthsFromT0(new Date(o.effectiveDateTime!), t0),
          value,
          isHigh: refHigh != null ? value > refHigh : false,
        }
      })
      const allValues = points.map((p) => p.value)
      result.push({
        loincCode, label, unit, points, refHigh,
        yMin: Math.min(...allValues) * 0.8,
        yMax: Math.max(...allValues, refHigh ?? 0) * 1.2,
      })
    }
    return result
  }, [observations, t0])

  if (!t0) return null

  // Compute the shared time domain from the centre panel
  const viewMonths = centralPlotWidth > 0 ? centralPlotWidth / zoom : 60
  const domainMin = offset
  const domainMax = offset + viewMonths

  return (
    <section className="rounded border border-gray-200 bg-white flex flex-col">
      <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100 shrink-0">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-900">
          Biomarker Sparklines
        </h2>
      </div>
      <div className="p-3 flex flex-col gap-1">

      {biomarkerData.map(({ loincCode, label, unit, points, refHigh, yMin, yMax }) => {
        return (
          <div
            key={loincCode}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const margin = { left: 0, right: 4 }
              const chartWidth = rect.width - margin.left - margin.right
              const mouseX = e.clientX - rect.left - margin.left
              if (mouseX >= 0 && mouseX <= chartWidth) {
                setHoverMonths(domainMin + (mouseX / chartWidth) * (domainMax - domainMin))
              } else {
                setHoverMonths(null)
              }
            }}
            onMouseLeave={() => setHoverMonths(null)}
          >
            <div className="flex items-baseline justify-between mb-0.5">
              <span className="text-[13px] font-semibold text-gray-700">{label}</span>
              <span className="text-base text-gray-400">{unit}</span>
            </div>

            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <XAxis
                  dataKey="months"
                  type="number"
                  domain={[domainMin, domainMax]}
                  hide
                />
                <YAxis domain={[yMin, yMax]} hide />

                {refHigh != null && (
                  <ReferenceLine
                    y={refHigh}
                    stroke="#F97316"
                    strokeDasharray="4 3"
                    strokeWidth={1}
                  />
                )}

                {hoverMonths != null && hoverMonths >= domainMin && hoverMonths <= domainMax && (
                  <ReferenceLine
                    x={hoverMonths}
                    stroke="#64748B"
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                )}

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as SparkPoint
                    return (
                      <div className="bg-gray-900 text-white text-[13px] rounded px-2 py-1 shadow-lg">
                        <div className={p.isHigh ? 'text-red-400' : 'text-blue-400'}>
                          {p.value} {unit}
                        </div>
                        <div className="text-gray-400">{p.months.toFixed(1)} mo</div>
                      </div>
                    )
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#CBD5E1"
                  strokeWidth={1.5}
                  dot={<SparkDot />}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })}
      </div>
    </section>
  )
}

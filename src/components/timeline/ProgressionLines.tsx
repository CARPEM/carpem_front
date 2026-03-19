import { usePatientStore } from '@/store/patient'
import { useTimelineStore } from '@/store/timeline'
import { toMonthsFromT0, T0_ANCHOR_URL } from '@/lib/t0'
import { LABEL_WIDTH, AXIS_HEIGHT } from './constants'

const T0_ANCHOR = T0_ANCHOR_URL
const LOINC_PROGRESSION = '21976-6'
const PROG_COLOR = '#DC2626'

interface Props {
  totalHeight: number
  plotWidth: number
}

export default function ProgressionLines({ totalHeight, plotWidth }: Props) {
  const { conditions, observations, t0 } = usePatientStore()
  const { zoom, offset } = useTimelineStore()

  if (!t0) return null

  const toX = (months: number) => LABEL_WIDTH + (months - offset) * zoom

  const months: number[] = []

  conditions
    .filter((c) => !c.extension?.some((e) => e.url === T0_ANCHOR) && c.onsetDateTime != null)
    .forEach((c) => months.push(toMonthsFromT0(new Date(c.onsetDateTime!), t0)))

  observations
    .filter((o) => o.code?.coding?.some((c) => c.code === LOINC_PROGRESSION) && o.effectiveDateTime != null)
    .forEach((o) => {
      const m = toMonthsFromT0(new Date(o.effectiveDateTime!), t0)
      if (!months.some((existing) => Math.abs(existing - m) < 0.2)) months.push(m)
    })

  return (
    <g>
      {months.map((m, i) => {
        const x = toX(m)
        if (x < LABEL_WIDTH - 1 || x > LABEL_WIDTH + plotWidth + 1) return null
        return (
          <line
            key={m}
            x1={x} y1={AXIS_HEIGHT}
            x2={x} y2={totalHeight}
            stroke={PROG_COLOR}
            strokeWidth={1.5}
            opacity={0.4}
          />
        )
      })}
    </g>
  )
}

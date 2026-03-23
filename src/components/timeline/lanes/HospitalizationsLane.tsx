import { usePatientStore } from '@/store/patient'
import { useTimelineStore } from '@/store/timeline'
import { toMonthsFromT0 } from '@/lib/t0'
import { formatDate, formatTemporalLabel } from '@/lib/formatters'
import { LABEL_WIDTH } from '../constants'
import type { MarkerInfo } from '../types'

const FILL = '#FFBB00'
const TEXT = '#7A5800'

const BAR_H      = 32
const BAR_RADIUS = 3

interface Props {
  laneY: number
  laneHeight: number
  plotWidth: number
  onHover: (info: MarkerInfo | null, e?: React.MouseEvent) => void
}

export default function HospitalizationsLane({ laneY, laneHeight, plotWidth, onHover }: Props) {
  const { encounters, t0 } = usePatientStore()
  const { zoom, offset } = useTimelineStore()

  if (!t0) return null

  const toX = (months: number) => LABEL_WIDTH + (months - offset) * zoom

  const hospEncounters = encounters.filter(
    (e) => e.class?.code === 'IMP' && e.period?.start,
  )

  if (hospEncounters.length === 0) return null

  const barY = laneY + (laneHeight - BAR_H) / 2

  return (
    <g>
      {hospEncounters.map((enc) => {
        const startDate = new Date(enc.period!.start!)
        const endDate   = enc.period?.end ? new Date(enc.period.end) : startDate
        const x1 = toX(toMonthsFromT0(startDate, t0))
        const x2 = toX(toMonthsFromT0(endDate,   t0))
        const barW = Math.max(x2 - x1, 4)

        if (x1 > LABEL_WIDTH + plotWidth + 4 || x2 < LABEL_WIDTH - 4) return null

        const reason = enc.type?.[0]?.text ?? 'Hospitalisation'

        // Visible portion of the bar (clipped to plot area)
        const visX1 = Math.max(x1, LABEL_WIDTH)
        const visW  = Math.min(x1 + barW, LABEL_WIDTH + plotWidth) - visX1

        // Characters that fit in the visible portion (≈6 px per char, 8 px padding)
        const maxChars = Math.floor((visW - 8) / 6)
        const labelText = maxChars > 4
          ? reason.length > maxChars ? reason.slice(0, maxChars) + '…' : reason
          : null

        return (
          <g
            key={enc.id}
            onMouseEnter={(e) =>
              onHover(
                {
                  resourceType: 'Encounter',
                  label: reason,
                  date: `${formatDate(enc.period!.start)} → ${formatDate(enc.period?.end)}`,
                  temporal: formatTemporalLabel(startDate, t0),
                },
                e,
              )
            }
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'default' }}
          >
            <rect
              x={x1}
              y={barY}
              width={barW}
              height={BAR_H}
              rx={BAR_RADIUS}
              fill={FILL}
            />
            {labelText && (
              <text
                x={visX1 + 6}
                y={barY + BAR_H / 2}
                dominantBaseline="middle"
                fontSize={11}
                fill={TEXT}
                pointerEvents="none"
              >
                {labelText}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

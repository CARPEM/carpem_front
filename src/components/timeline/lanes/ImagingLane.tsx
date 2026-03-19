import { usePatientStore } from '@/store/patient'
import { useTimelineStore } from '@/store/timeline'
import { toMonthsFromT0 } from '@/lib/t0'
import { formatDate, formatTemporalLabel } from '@/lib/formatters'
import { LABEL_WIDTH } from '../constants'
import type { MarkerInfo } from '../types'

const IMAGING_FILL = '#BAE6FD'
const IMAGING_STROKE = '#1B2A4A'

interface Props {
  laneY: number
  laneHeight: number
  plotWidth: number
  onHover: (info: MarkerInfo | null, e?: React.MouseEvent) => void
}

export default function ImagingLane({ laneY, laneHeight, plotWidth, onHover }: Props) {
  const { imagingStudies, t0 } = usePatientStore()
  const { zoom, offset } = useTimelineStore()

  if (!t0) return null

  const toX = (months: number) => LABEL_WIDTH + (months - offset) * zoom
  const cy = laneY + laneHeight / 2

  return (
    <g>
      {imagingStudies.map((study) => {
        const dateStr = study.started
        if (!dateStr) return null
        const date = new Date(dateStr)
        const x = toX(toMonthsFromT0(date, t0))
        if (x < LABEL_WIDTH - 20 || x > LABEL_WIDTH + plotWidth + 20) return null

        const modality = study.modality?.[0]?.code ?? '?'
        const seriesCount = study.numberOfSeries ?? 0
        const label = study.description ?? `${modality} — ${seriesCount} series`

        return (
          <g
            key={study.id}
            transform={`translate(${x}, ${cy})`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) =>
              onHover(
                {
                  resourceType: 'ImagingStudy',
                  label,
                  date: formatDate(dateStr),
                  temporal: formatTemporalLabel(date, t0),
                },
                e,
              )
            }
            onMouseLeave={() => onHover(null)}
          >
            {/* Invisible hit area */}
            <rect x={-22} y={-26} width={44} height={44} fill="transparent" />
            {/* Downward-pointing triangle — light blue fill, dark blue outline */}
            <polygon
              points="-20,-16 20,-16 0,16"
              fill={IMAGING_FILL}
              stroke={IMAGING_STROKE}
              strokeWidth={2}
            />
            {/* Modality label above triangle */}
            <text
              y={-22}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fill={IMAGING_STROKE}
            >
              {modality}
            </text>
          </g>
        )
      })}
    </g>
  )
}

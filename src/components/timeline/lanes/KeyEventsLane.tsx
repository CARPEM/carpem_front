import { useState, useMemo } from 'react'
import { usePatientStore } from '@/store/patient'
import { useTimelineStore } from '@/store/timeline'
import { toMonthsFromT0, T0_ANCHOR_URL } from '@/lib/t0'
import { formatDate, formatTemporalLabel } from '@/lib/formatters'
import { LABEL_WIDTH } from '../constants'
import type { MarkerInfo } from '../types'

const T0_ANCHOR = T0_ANCHOR_URL
const LOINC_PROGRESSION = '21976-6'

const DX_COLOR    = '#0D9488'
const PROG_COLOR  = '#DC2626'
const DEATH_COLOR = '#1B3A6B'

interface Flag {
  id: string
  months: number
  color: string
  shortLabel: string
  fullLabel: string
  code: string
  stage?: string
  resourceType: string
  date: Date
}

interface Props {
  laneY: number
  laneHeight: number
  plotWidth: number
  onHover: (info: MarkerInfo | null, e?: React.MouseEvent) => void
}

export default function KeyEventsLane({ laneY, laneHeight, plotWidth, onHover }: Props) {
  const { conditions, observations, patient, t0 } = usePatientStore()
  const { zoom, offset } = useTimelineStore()
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null)

  // Rebuild flags only when patient data changes, not on every zoom/pan
  const flags = useMemo<Flag[]>(() => {
    if (!t0) return []
    const result: Flag[] = []

    const primaryCondition = conditions.find((c) =>
      c.extension?.some((e) => e.url === T0_ANCHOR && e.valueBoolean === true),
    ) ?? conditions.find((c) =>
      c.clinicalStatus?.coding?.some((cd) => cd.code === 'active') &&
      c.verificationStatus?.coding?.some((cd) => cd.code === 'confirmed'),
    )

    if (primaryCondition) {
      result.push({
        id: primaryCondition.id ?? 'dx',
        months: 0,
        color: DX_COLOR,
        shortLabel: 'DX',
        fullLabel: primaryCondition.code?.text ?? primaryCondition.code?.coding?.[0]?.display ?? 'Diagnosis',
        code: primaryCondition.code?.coding?.[0]?.display ?? primaryCondition.code?.text ?? '—',
        resourceType: 'Condition',
        date: t0,
      })
    }

    conditions
      .filter((c) => !c.extension?.some((e) => e.url === T0_ANCHOR) && c.onsetDateTime != null)
      .forEach((c) => {
        const date = new Date(c.onsetDateTime!)
        result.push({
          id: c.id ?? `cond-${c.onsetDateTime}`,
          months: toMonthsFromT0(date, t0),
          color: PROG_COLOR,
          shortLabel: 'P',
          fullLabel: c.code?.text ?? c.code?.coding?.[0]?.display ?? 'Event',
          code: c.code?.coding?.[0]?.display ?? c.code?.text ?? '—',
          resourceType: 'Condition',
          date,
        })
      })

    observations
      .filter((o) => o.code?.coding?.some((c) => c.code === LOINC_PROGRESSION) && o.effectiveDateTime != null)
      .forEach((o) => {
        const date = new Date(o.effectiveDateTime!)
        const alreadyCovered = result.some(
          (f) => Math.abs(f.months - toMonthsFromT0(date, t0)) < 0.2,
        )
        if (!alreadyCovered) {
          result.push({
            id: o.id ?? `obs-${o.effectiveDateTime}`,
            months: toMonthsFromT0(date, t0),
            color: PROG_COLOR,
            shortLabel: 'P',
            fullLabel: o.valueCodeableConcept?.text ?? o.valueCodeableConcept?.coding?.[0]?.display ?? 'Progression',
            code: o.code?.coding?.[0]?.display ?? '—',
            resourceType: 'Observation',
            date,
          })
        }
      })

    if (patient?.deceasedDateTime) {
      const date = new Date(patient.deceasedDateTime)
      result.push({
        id: 'death',
        months: toMonthsFromT0(date, t0),
        color: DEATH_COLOR,
        shortLabel: 'D',
        fullLabel: 'Death',
        code: 'Death',
        resourceType: 'Patient',
        date,
      })
    }
    return result
  }, [conditions, observations, patient, t0])

  if (!t0) return null

  const toX = (months: number) => LABEL_WIDTH + (months - offset) * zoom

  const cy = laneY + laneHeight / 2
  const SQ = 24 // square side length

  return (
    <g>
      <defs>
        <filter id="kef-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
        </filter>
      </defs>

      {flags.map((flag) => {
        const x = toX(flag.months)
        if (x < LABEL_WIDTH - 20 || x > LABEL_WIDTH + plotWidth + 20) return null
        const isSelected = selectedFlag?.id === flag.id

        return (
          <g
            key={flag.id}
            transform={`translate(${x}, ${cy})`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) =>
              onHover(
                {
                  resourceType: flag.resourceType,
                  label: flag.fullLabel,
                  date: formatDate(flag.date.toISOString()),
                  temporal: formatTemporalLabel(flag.date, t0),
                },
                e,
              )
            }
            onMouseLeave={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedFlag(isSelected ? null : flag)
            }}
          >
            {/* Vertical stem */}
            <line
              x1={0} y1={-laneHeight / 2 + 4}
              x2={0} y2={laneHeight / 2 - 4}
              stroke={flag.color} strokeWidth={1.5} opacity={0.5}
            />
            {/* Invisible hit area */}
            <rect x={-22} y={-22} width={44} height={44} fill="transparent" />
            {/* Square marker */}
            <rect
              x={-SQ / 2} y={-SQ / 2}
              width={SQ} height={SQ}
              rx={3}
              fill={flag.color}
              filter="url(#kef-shadow)"
            />
            {/* Short label inside square */}
            <text
              y={0}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={16}
              fontWeight={800}
              fill="white"
              pointerEvents="none"
            >
              {flag.shortLabel}
            </text>
          </g>
        )
      })}

      {/* Click popover */}
      {selectedFlag && (() => {
        const popX = Math.min(
          toX(selectedFlag.months) + 14,
          LABEL_WIDTH + plotWidth - 190,
        )
        const popY = laneY + 4
        return (
          <g>
            <rect
              x={popX} y={popY}
              width={190} height={56}
              rx={5} fill="white"
              stroke={selectedFlag.color} strokeWidth={1.5}
              filter="url(#kef-shadow)"
            />
            {/* Close hit area (transparent rect to dismiss via parent onClick) */}
            <text x={popX + 178} y={popY + 13} fontSize={12} fill="#94A3B8" style={{ cursor: 'pointer' }}
              onClick={() => setSelectedFlag(null)}>×</text>
            <text x={popX + 10} y={popY + 16} fontSize={13} fontWeight={700} fill="#1E293B">
              {selectedFlag.code.length > 34
                ? selectedFlag.code.slice(0, 34) + '…'
                : selectedFlag.code}
            </text>
            <text x={popX + 10} y={popY + 30} fontSize={12} fill="#475569">
              {selectedFlag.fullLabel.length > 38
                ? selectedFlag.fullLabel.slice(0, 38) + '…'
                : selectedFlag.fullLabel}
            </text>
            <text x={popX + 10} y={popY + 45} fontSize={12} fill="#64748B">
              {formatDate(selectedFlag.date.toISOString())}
              {'  '}
              <tspan fill={selectedFlag.color} fontFamily="monospace">
                {formatTemporalLabel(selectedFlag.date, t0)}
              </tspan>
            </text>
          </g>
        )
      })()}
    </g>
  )
}

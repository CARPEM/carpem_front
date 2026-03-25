import { useMemo } from 'react'
import { usePatientStore } from '@/store/patient'
import { useTimelineStore } from '@/store/timeline'
import { toMonthsFromT0 } from '@/lib/t0'
import { formatDate, formatTemporalLabel } from '@/lib/formatters'
import { LABEL_WIDTH } from '../constants'
import type { MarkerInfo } from '../types'

// ATC drug class → colour from spec
function drugColor(coding: fhir4.Coding[]): string {
  for (const c of coding) {
    const code = c.code ?? ''
    if (code.startsWith('L01F')) return '#7B4FBC'  // Immunotherapy
    if (code.startsWith('L01X')) return '#2E7D4F'  // Targeted / mAb
    if (code.startsWith('L02')) return '#D97706'   // Hormone
    if (code.startsWith('L01')) return '#4A7FB5'   // Chemo
  }
  return '#6B7280'
}

interface Track {
  text: string
  color: string
  isProphylactic: boolean
  doses: { months: number; date: Date; index: number }[]
}

interface Props {
  laneY: number
  laneHeight: number
  plotWidth: number
  onHover: (info: MarkerInfo | null, e?: React.MouseEvent) => void
}

const BAR_H = 20
const BAR_GAP = 8
const DOSE_R = 13

export default function SystemicTherapyLane({ laneY, laneHeight, plotWidth, onHover }: Props) {
  const { medicationAdministrations, medicationRequests, t0 } = usePatientStore()
  const { zoom, offset } = useTimelineStore()

  // Rebuild tracks only when patient data changes, not on every zoom/pan
  const tracks = useMemo<Track[]>(() => {
    if (!t0) return []
    const trackMap = new Map<string, Track>()
    for (const ma of medicationAdministrations) {
      const coding = ma.medicationCodeableConcept?.coding ?? []
      const text = ma.medicationCodeableConcept?.text ?? coding[0]?.display ?? 'Unknown'
      const dateStr = ma.effectiveDateTime ?? (ma.effectivePeriod as fhir4.Period | undefined)?.start
      if (!dateStr) continue
      const date = new Date(dateStr)
      if (!trackMap.has(text)) {
        trackMap.set(text, { text, color: drugColor(coding), isProphylactic: false, doses: [] })
      }
      const track = trackMap.get(text)!
      track.doses.push({ months: toMonthsFromT0(date, t0), date, index: track.doses.length + 1 })
    }
    for (const mr of medicationRequests) {
      if (mr.intent !== 'prophylactic') continue
      const text = (mr.medicationCodeableConcept as fhir4.CodeableConcept | undefined)?.text
      if (text && trackMap.has(text)) {
        trackMap.get(text)!.isProphylactic = true
      }
    }
    return [...trackMap.values()]
  }, [medicationAdministrations, medicationRequests, t0])

  if (!t0) return null

  const toX = (months: number) => LABEL_WIDTH + (months - offset) * zoom
  const totalH = tracks.length * BAR_H + Math.max(0, tracks.length - 1) * BAR_GAP
  const startY = laneY + (laneHeight - totalH) / 2

  return (
    <g>
      {tracks.map((track, ti) => {
        if (track.doses.length === 0) return null

        const barY = startY + ti * (BAR_H + BAR_GAP)
        const barCy = barY + BAR_H / 2

        const sortedDoses = [...track.doses].sort((a, b) => a.months - b.months)
        const firstX = toX(sortedDoses[0].months)
        const lastX = toX(sortedDoses[sortedDoses.length - 1].months)
        const barW = Math.max(lastX - firstX, 1)

        return (
          <g key={track.text}>
            {/* Protocol bar */}
            <rect
              x={firstX} y={barY}
              width={barW} height={BAR_H}
              rx={BAR_H / 2}
              fill={track.color}
              opacity={0.25}
              strokeDasharray={track.isProphylactic ? '4 3' : undefined}
              stroke={track.isProphylactic ? track.color : 'none'}
              strokeWidth={track.isProphylactic ? 1.5 : 0}
            />

            {/* Track label — left of bar only when it fully clears the lane title column,
                otherwise right of bar */}
            {(() => {
              // Approximate glyph width at fontSize 14 (~8px per char) + padding
              const approxW = track.text.length * 8.5 + 8
              const spaceLeft = firstX - LABEL_WIDTH
              const showLeft = spaceLeft > approxW
              return (
                <text
                  x={showLeft ? firstX - 4 : lastX + 4}
                  y={barCy}
                  textAnchor={showLeft ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fontSize={14}
                  fill={track.color}
                  fontWeight={600}
                >
                  {track.text}
                </text>
              )
            })()}

            {/* Dose markers */}
            {sortedDoses.map((dose) => {
              const dx = toX(dose.months)
              if (dx < LABEL_WIDTH - DOSE_R || dx > LABEL_WIDTH + plotWidth + DOSE_R) return null
              return (
                <g
                  key={`${track.text}-${dose.index}`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) =>
                    onHover(
                      {
                        resourceType: 'MedicationAdministration',
                        label: `${track.text} — Dose ${dose.index}`,
                        date: formatDate(dose.date.toISOString()),
                        temporal: formatTemporalLabel(dose.date, t0),
                      },
                      e,
                    )
                  }
                  onMouseLeave={() => onHover(null)}
                >
                  <circle cx={dx} cy={barCy} r={DOSE_R} fill={track.color} />
                  <text
                    x={dx} y={barCy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={15}
                    fontWeight={700}
                    fill="white"
                    pointerEvents="none"
                  >
                    {dose.index}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

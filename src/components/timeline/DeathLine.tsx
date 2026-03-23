import { usePatientStore } from '@/store/patient'
import { useTimelineStore } from '@/store/timeline'
import { toMonthsFromT0 } from '@/lib/t0'
import { LABEL_WIDTH, AXIS_HEIGHT } from './constants'

const DEATH_COLOR = '#1B3A6B'

interface Props {
  totalHeight: number
  plotWidth: number
}

export default function DeathLine({ totalHeight, plotWidth }: Props) {
  const { patient, t0 } = usePatientStore()
  const { zoom, offset } = useTimelineStore()

  if (!t0 || !patient?.deceasedDateTime) return null

  const x = LABEL_WIDTH + (toMonthsFromT0(new Date(patient.deceasedDateTime), t0) - offset) * zoom
  if (x < LABEL_WIDTH - 1 || x > LABEL_WIDTH + plotWidth + 1) return null

  return (
    <line
      x1={x} y1={AXIS_HEIGHT}
      x2={x} y2={totalHeight}
      stroke={DEATH_COLOR}
      strokeWidth={1.5}
      opacity={0.4}
    />
  )
}

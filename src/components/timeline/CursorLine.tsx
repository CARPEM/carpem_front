import { LABEL_WIDTH, AXIS_HEIGHT } from './constants'

interface Props {
  zoom: number
  offset: number
  hoverMonths: number | null
  totalHeight: number
  plotWidth: number
}

export default function CursorLine({ zoom, offset, hoverMonths, totalHeight, plotWidth }: Props) {
  if (hoverMonths == null) return null

  const x = LABEL_WIDTH + (hoverMonths - offset) * zoom

  // Don't render if outside the plot area
  if (x < LABEL_WIDTH || x > LABEL_WIDTH + plotWidth) return null

  return (
    <line
      x1={x} y1={AXIS_HEIGHT}
      x2={x} y2={totalHeight}
      stroke="#64748B"
      strokeWidth={1}
      opacity={0.5}
      pointerEvents="none"
    />
  )
}

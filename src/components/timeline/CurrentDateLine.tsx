import { LABEL_WIDTH, AXIS_HEIGHT } from './constants'

interface Props {
  zoom: number
  offset: number
  currentMonths: number
  totalHeight: number
}

export default function CurrentDateLine({ zoom, offset, currentMonths, totalHeight }: Props) {
  const x = LABEL_WIDTH + (currentMonths - offset) * zoom

  return (
    <g>
      <line
        x1={x} y1={AXIS_HEIGHT}
        x2={x} y2={totalHeight}
        stroke="#94A3B8"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      {/* Triangle pointer at top */}
      <polygon
        points={`${x - 5},${AXIS_HEIGHT} ${x + 5},${AXIS_HEIGHT} ${x},${AXIS_HEIGHT + 6}`}
        fill="#94A3B8"
      />
    </g>
  )
}

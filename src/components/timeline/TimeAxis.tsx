import { LABEL_WIDTH, AXIS_HEIGHT, SEMANTIC_TICKS } from './constants'

interface Props {
  zoom: number
  offset: number
  plotWidth: number
  currentMonths: number
  totalHeight: number
}

const MIN_PX_BETWEEN_LABELS = 40

export default function TimeAxis({ zoom, offset, plotWidth, currentMonths, totalHeight }: Props) {
  const viewEnd = offset + plotWidth / zoom

  // Convert months to x in the full SVG coordinate space
  const toX = (months: number) => LABEL_WIDTH + (months - offset) * zoom

  // ── visible semantic ticks ─────────────────────────────────────────────────
  const visibleTicks = SEMANTIC_TICKS.filter(
    (t) => t.months >= offset - 1 && t.months <= viewEnd + 1,
  )

  // ── minor gridlines every 6 months ────────────────────────────────────────
  const minorStep = zoom >= 10 ? 3 : 6
  const firstMinor = Math.ceil(offset / minorStep) * minorStep
  const minorTicks: number[] = []
  for (let m = firstMinor; m <= viewEnd; m += minorStep) {
    const isSemantic = SEMANTIC_TICKS.some((t) => t.months === m)
    if (!isSemantic) minorTicks.push(m)
  }

  // Deduplicate label positions so they don't collide
  const labelPositions: number[] = []
  const filteredTicks = visibleTicks.filter((t) => {
    const x = toX(t.months)
    if (x < LABEL_WIDTH - 10 || x > LABEL_WIDTH + plotWidth + 10) return false
    const tooClose = labelPositions.some((px) => Math.abs(px - x) < MIN_PX_BETWEEN_LABELS)
    if (!tooClose) { labelPositions.push(x); return true }
    return false
  })

  return (
    <g>
      {/* Axis background — label column blue-gray, plot area white */}
      <rect x={0} y={0} width={LABEL_WIDTH} height={AXIS_HEIGHT} fill="#C8D8E8" />
      <rect x={LABEL_WIDTH} y={0} width={plotWidth} height={AXIS_HEIGHT} fill="white" />

      {/* Minor gridlines */}
      {minorTicks.map((m) => {
        const x = toX(m)
        return (
          <line
            key={`minor-${m}`}
            x1={x} y1={AXIS_HEIGHT}
            x2={x} y2={totalHeight}
            stroke="#E8EFF5" strokeWidth={1}
          />
        )
      })}

      {/* Semantic tick marks + labels */}
      {filteredTicks.map(({ months, label }) => {
        const x = toX(months)
        const isDX = months === 0
        return (
          <g key={`tick-${months}`}>
            <line
              x1={x} y1={isDX ? 6 : 10}
              x2={x} y2={totalHeight}
              stroke={isDX ? '#0D9488' : '#B8CCDC'}
              strokeWidth={isDX ? 2 : 1}
              strokeDasharray={isDX ? undefined : '3 3'}
            />
            <text
              x={x}
              y={isDX ? 18 : 22}
              textAnchor="middle"
              fontSize={isDX ? 11 : 9}
              fontWeight={isDX ? 800 : 500}
              fill={isDX ? '#0D9488' : '#475569'}
              fontFamily="system-ui, sans-serif"
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* Axis baseline */}
      <line
        x1={0} y1={AXIS_HEIGHT}
        x2={LABEL_WIDTH + plotWidth} y2={AXIS_HEIGHT}
        stroke="#A0B4C8" strokeWidth={1}
      />

      {/* Current date label */}
      {currentMonths >= offset && currentMonths <= viewEnd && (() => {
        const x = toX(currentMonths)
        return (
          <text
            x={x}
            y={28}
            textAnchor="middle"
            fontSize={12}
            fill="#94A3B8"
            fontFamily="system-ui, sans-serif"
          >
            Today
          </text>
        )
      })()}
    </g>
  )
}

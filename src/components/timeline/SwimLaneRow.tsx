import { ReactNode } from 'react'
import { LABEL_WIDTH } from './constants'

interface Props {
  label: readonly [string, string] | string
  y: number
  height: number
  plotWidth: number
  isLast: boolean
  children?: ReactNode
}

export default function SwimLaneRow({ label, y, height, plotWidth, isLast, children }: Props) {
  const lines = Array.isArray(label) ? label : [label]
  const clipId = `clip-lane-${(Array.isArray(label) ? label.join('-') : label).replace(/\s+|[^a-zA-Z0-9-]/g, '-')}`
  const cy = y + height / 2

  return (
    <g>
      {/* Row separator */}
      <line
        x1={0} y1={y + height}
        x2={LABEL_WIDTH + plotWidth} y2={y + height}
        stroke="#CBD5E1" strokeWidth={isLast ? 0 : 1}
      />

      {/* Left label column background — blue-gray matching mock */}
      <rect x={0} y={y} width={LABEL_WIDTH} height={height} fill="#C8D8E8" />

      {/* Two-line label text */}
      <text
        x={8}
        textAnchor="start"
        fontSize={14}
        fontWeight={700}
        fill="#1B2A4A"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.02em"
      >
        {lines.length === 2 ? (
          <>
            <tspan x={8} dy={0} y={cy - 9}>{lines[0]}</tspan>
            <tspan x={8} dy={16}>{lines[1]}</tspan>
          </>
        ) : (
          <tspan y={cy} dominantBaseline="middle">{lines[0]}</tspan>
        )}
      </text>

      {/* Vertical divider */}
      <line
        x1={LABEL_WIDTH} y1={y}
        x2={LABEL_WIDTH} y2={y + height}
        stroke="#A0B4C8" strokeWidth={1}
      />

      {/* Plot area clip + children */}
      <clipPath id={clipId}>
        <rect x={LABEL_WIDTH} y={y} width={plotWidth} height={height} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {children}
      </g>
    </g>
  )
}

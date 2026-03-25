import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { KMPoint } from '@/types/cohortAnalytics'

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN = { top: 10, right: 16, bottom: 34, left: 44 }

// ─── Types ────────────────────────────────────────────────────────────────────

interface TooltipState {
  x: number; y: number
  t: number; s: number; ciLow: number; ciHigh: number; nAtRisk: number
}

interface Props {
  data: KMPoint[]
  color?: string
}

// ─── KMChart ─────────────────────────────────────────────────────────────────

export default function KMChart({ data, color = '#1A7F8E' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef      = useRef<SVGSVGElement>(null)
  const [dims, setDims]       = useState({ w: 0, h: 0 })
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const hideTooltip = useCallback(() => setTooltip(null), [])

  // Measure container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // D3 chart
  useEffect(() => {
    if (!data.length || !svgRef.current || dims.w === 0 || dims.h === 0) return

    const { w, h } = dims
    const innerW = w - MARGIN.left - MARGIN.right
    const innerH = h - MARGIN.top - MARGIN.bottom
    if (innerW <= 0 || innerH <= 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', w).attr('height', h)

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    const maxT = Math.max(d3.max(data, (d) => d.t) ?? 0, 1)
    const xScale = d3.scaleLinear().domain([0, Math.ceil(maxT)]).range([0, innerW])
    const yScale = d3.scaleLinear().domain([0, 1]).range([innerH, 0])

    // Horizontal gridlines
    g.append('g')
      .attr('stroke', '#F3F4F6')
      .attr('stroke-dasharray', '3,2')
      .call(
        d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(() => ''),
      )
      .call((gg) => gg.select('.domain').remove())

    // CI band
    const area = d3.area<KMPoint>()
      .x((d) => xScale(d.t))
      .y0((d) => yScale(Math.max(0, d.ciLow)))
      .y1((d) => yScale(Math.min(1, d.ciHigh)))
      .curve(d3.curveStepAfter)

    g.append('path').datum(data)
      .attr('fill', color)
      .attr('opacity', 0.12)
      .attr('d', area)

    // KM step line
    const line = d3.line<KMPoint>()
      .x((d) => xScale(d.t))
      .y((d) => yScale(d.s))
      .curve(d3.curveStepAfter)

    g.append('path').datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line)

    // Extend line to right edge at last S value
    const last = data[data.length - 1]
    g.append('line')
      .attr('x1', xScale(last.t)).attr('y1', yScale(last.s))
      .attr('x2', innerW).attr('y2', yScale(last.s))
      .attr('stroke', color).attr('stroke-width', 2).attr('stroke-dasharray', '4,3')

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(Math.min(Math.ceil(maxT), 6))
          .tickFormat((d) => `${+d}y`),
      )
      .call((gg) => {
        gg.select('.domain').attr('stroke', '#E5E7EB')
        gg.selectAll('.tick line').attr('stroke', '#E5E7EB')
        gg.selectAll('text').attr('font-size', 9).attr('fill', '#6B7280')
      })

    // Y axis
    g.append('g')
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${Math.round(+d * 100)}%`),
      )
      .call((gg) => {
        gg.select('.domain').attr('stroke', '#E5E7EB')
        gg.selectAll('.tick line').attr('stroke', '#E5E7EB')
        gg.selectAll('text').attr('font-size', 9).attr('fill', '#6B7280')
      })

    // Invisible overlay for hover
    const times   = data.map((d) => d.t)
    const bisect  = d3.bisector<number, number>((d) => d).left

    g.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', innerW).attr('height', innerH)
      .attr('fill', 'transparent')
      .on('mousemove', function (event: MouseEvent) {
        const [mx] = d3.pointer(event, this as Element)
        const t   = xScale.invert(mx)
        const idx = Math.max(0, bisect(times, t) - 1)
        const pt  = data[Math.min(idx, data.length - 1)]
        if (!pt) return
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        setTooltip({
          x: event.clientX - rect.left + 10,
          y: event.clientY - rect.top - 10,
          t: pt.t, s: pt.s,
          ciLow: pt.ciLow, ciHigh: pt.ciHigh,
          nAtRisk: pt.nAtRisk,
        })
      })
      .on('mouseleave', () => setTooltip(null))
  }, [data, dims, color])

  return (
    <div ref={containerRef} className="h-full w-full relative" onMouseLeave={hideTooltip}>
      <svg ref={svgRef} />
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-gray-900 text-white text-[10px] rounded px-2 py-1.5 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-semibold">t = {tooltip.t.toFixed(2)} years</div>
          <div>S(t) = {(tooltip.s * 100).toFixed(1)}%</div>
          <div className="text-gray-400">
            95% CI: [{(tooltip.ciLow * 100).toFixed(1)}%,{' '}
            {(tooltip.ciHigh * 100).toFixed(1)}%]
          </div>
          <div className="text-gray-400">N at risk: {tooltip.nAtRisk}</div>
        </div>
      )}
    </div>
  )
}

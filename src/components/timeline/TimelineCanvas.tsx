import { useEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTimelineStore } from '@/store/timeline'
import { usePatientStore } from '@/store/patient'
import { useSelectionStore } from '@/store/selection'
import { toMonthsFromT0 } from '@/lib/t0'
import {
  LABEL_WIDTH,
  AXIS_HEIGHT,
  LANE_HEIGHT,
  SWIM_LANES,
  ZOOM_PX_MAX,
} from './constants'
import TimeAxis from './TimeAxis'
import CursorLine from './CursorLine'
import SwimLaneRow from './SwimLaneRow'
import TooltipOverlay from './TooltipOverlay'
import KeyEventsLane from './lanes/KeyEventsLane'
import HospitalizationsLane from './lanes/HospitalizationsLane'
import SystemicTherapyLane from './lanes/SystemicTherapyLane'
import RadioSurgeryLane from './lanes/RadioSurgeryLane'
import ImagingLane from './lanes/ImagingLane'
import BiobankingLane from './lanes/BiobankingLane'
import ProgressionLines from './ProgressionLines'
import DeathLine from './DeathLine'
import type { TooltipState, MarkerInfo } from './types'

interface Props {
  plotWidthRef?: React.MutableRefObject<number>
}

export default function TimelineCanvas({ plotWidthRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const widthRef = useRef(0)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Store
  const { zoom, offset, hoverMonths, setZoom, setOffset, setHoverMonths, initZoom, setCentralPlotWidth } = useTimelineStore()
  const { t0 } = usePatientStore()
  const { setSelectedSpecimen, setSelectedProcedure } = useSelectionStore()

  // Derived layout — per-lane heights, systemic therapy gets 2×
  const plotWidth = containerSize.width - LABEL_WIDTH
  const laneHeights: Record<string, number> = {
    'key-events':       LANE_HEIGHT,
    'hospitalizations': LANE_HEIGHT,
    'systemic':         LANE_HEIGHT * 2,
    'rt-surgery':       LANE_HEIGHT,
    'imaging':          LANE_HEIGHT,
    'biobanking':       LANE_HEIGHT,
  }
  // Cumulative Y positions for each lane
  const laneYs: Record<string, number> = {}
  let _y = AXIS_HEIGHT
  for (const lane of SWIM_LANES) {
    laneYs[lane.id] = _y
    _y += laneHeights[lane.id]
  }
  const totalHeight = _y

  const currentMonths = t0 ? toMonthsFromT0(new Date(), t0) : 60

  // ── ResizeObserver ─────────────────────────────────────────────────────────
  const hasInited = useRef(false)
  // Track whether the URL-param effect already consumed the first patient load
  const firstPatientInited = useRef(false)
  // Track the previous t0 to detect patient switches
  const prevT0Ref = useRef<Date | null>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      widthRef.current = width
      setContainerSize({ width, height })
      const pw = width - LABEL_WIDTH
      if (plotWidthRef) plotWidthRef.current = pw
      setCentralPlotWidth(pw)
      if (!hasInited.current && t0 && width > 0) {
        initZoom(currentMonths, pw)
        hasInited.current = true
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [t0, currentMonths, initZoom])

  // Re-init zoom when T0 arrives or changes (patient switch)
  useEffect(() => {
    if (!t0 || widthRef.current === 0) return
    const t0Changed = prevT0Ref.current?.getTime() !== t0.getTime()
    if (!t0Changed) return
    prevT0Ref.current = t0
    if (!firstPatientInited.current) {
      // First patient: URL params may have already set the zoom — respect them
      firstPatientInited.current = true
      if (!hasInited.current) {
        initZoom(currentMonths, widthRef.current - LABEL_WIDTH)
        hasInited.current = true
      }
    } else {
      // Patient switched: always reset zoom to fit the new patient's timeline
      initZoom(currentMonths, widthRef.current - LABEL_WIDTH)
    }
  }, [t0, currentMonths, initZoom])

  // ── URL sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    p.set('zoom', zoom.toFixed(3))
    p.set('offset', offset.toFixed(3))
    window.history.replaceState(null, '', `?${p}`)
  }, [zoom, offset])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const z = parseFloat(p.get('zoom') ?? '')
    const o = parseFloat(p.get('offset') ?? '')
    if (!isNaN(z) && !isNaN(o)) {
      setZoom(z); setOffset(o); hasInited.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Wheel zoom (around cursor) ─────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const { zoom: z, offset: o, setZoom: sz, setOffset: so } = useTimelineStore.getState()
      const rect = el.getBoundingClientRect()
      const mouseX = e.clientX - rect.left - LABEL_WIDTH
      const mouseMonths = o + mouseX / z
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      const pw = rect.width - LABEL_WIDTH
      const newZoom = Math.max(pw / (currentMonths + 9), Math.min(ZOOM_PX_MAX, z * factor))
      const newOffset = mouseMonths - mouseX / newZoom
      sz(newZoom)
      so(Math.max(-3, Math.min(newOffset, currentMonths + 6 - pw / newZoom)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [currentMonths])

  // ── Drag pan ───────────────────────────────────────────────────────────────
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    dragRef.current = { startX: e.clientX, startOffset: useTimelineStore.getState().offset }
  }, [])

  const onMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const { zoom: z, offset: o, setOffset: so, setHoverMonths: shm } = useTimelineStore.getState()
      if (dragRef.current) {
        const dMonths = -(e.clientX - dragRef.current.startX) / z
        const newOffset = dragRef.current.startOffset + dMonths
        const viewMonths = plotWidth / z
        so(Math.max(-3, Math.min(newOffset, currentMonths + 6 - viewMonths)))
      }
      // Update cursor line position
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const mouseX = e.clientX - rect.left - LABEL_WIDTH
        if (mouseX >= 0 && mouseX <= plotWidth) {
          shm(o + mouseX / z)
        } else {
          shm(null)
        }
      }
    },
    [plotWidth, currentMonths],
  )

  const onMouseUp = useCallback(() => { dragRef.current = null }, [])
  const onMouseLeave = useCallback(() => {
    dragRef.current = null
    useTimelineStore.getState().setHoverMonths(null)
  }, [])

  // ── Keyboard: + / - ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key !== '+' && e.key !== '-' && e.key !== '=') return
      const { zoom: z, offset: o, setZoom: sz, setOffset: so } = useTimelineStore.getState()
      const factor = e.key === '-' ? 1 / 1.3 : 1.3
      const pw = widthRef.current - LABEL_WIDTH
      const centre = o + pw / z / 2
      const newZoom = Math.max(pw / (currentMonths + 9), Math.min(ZOOM_PX_MAX, z * factor))
      const newOffset = centre - pw / newZoom / 2
      sz(newZoom)
      so(Math.max(-3, Math.min(newOffset, currentMonths + 6 - pw / newZoom)))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentMonths])

  // ── Tooltip ────────────────────────────────────────────────────────────────
  // Store viewport coords so tooltip can be portalled to body (avoids overflow-hidden clipping)
  const showTooltip = useCallback((info: MarkerInfo | null, e?: React.MouseEvent) => {
    if (!info || !e) { setTooltip(null); return }
    setTooltip({ x: e.clientX, y: e.clientY, info })
  }, [])

  // ── Lane content map ───────────────────────────────────────────────────────
  const laneContent: Record<string, React.ReactNode> = {
    'key-events': (
      <KeyEventsLane
        laneY={laneYs['key-events']}
        laneHeight={laneHeights['key-events']}
        plotWidth={plotWidth}
        onHover={showTooltip}
      />
    ),
    'hospitalizations': (
      <HospitalizationsLane
        laneY={laneYs['hospitalizations']}
        laneHeight={laneHeights['hospitalizations']}
        plotWidth={plotWidth}
        onHover={showTooltip}
      />
    ),
    'systemic': (
      <SystemicTherapyLane
        laneY={laneYs['systemic']}
        laneHeight={laneHeights['systemic']}
        plotWidth={plotWidth}
        onHover={showTooltip}
      />
    ),
    'rt-surgery': (
      <RadioSurgeryLane
        laneY={laneYs['rt-surgery']}
        laneHeight={laneHeights['rt-surgery']}
        plotWidth={plotWidth}
        onHover={showTooltip}
        onClickProcedure={setSelectedProcedure}
      />
    ),
    'imaging': (
      <ImagingLane
        laneY={laneYs['imaging']}
        laneHeight={laneHeights['imaging']}
        plotWidth={plotWidth}
        onHover={showTooltip}
      />
    ),
    'biobanking': (
      <BiobankingLane
        laneY={laneYs['biobanking']}
        laneHeight={laneHeights['biobanking']}
        plotWidth={plotWidth}
        onHover={showTooltip}
        onClickSpecimen={setSelectedSpecimen}
      />
    ),
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="flex-1 relative overflow-y-auto select-none">
      <svg
        ref={svgRef}
        width="100%"
        height={totalHeight}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {containerSize.width > 0 && (
          <>
            {/* White background for the entire SVG canvas */}
            <rect x={0} y={0} width={containerSize.width} height={totalHeight} fill="white" />
            <TimeAxis
              zoom={zoom}
              offset={offset}
              plotWidth={plotWidth}
              totalHeight={totalHeight}
            />
            <ProgressionLines totalHeight={totalHeight} plotWidth={plotWidth} />
            <DeathLine totalHeight={totalHeight} plotWidth={plotWidth} />
            {SWIM_LANES.map((lane, i) => (
              <SwimLaneRow
                key={lane.id}
                label={lane.label}
                y={laneYs[lane.id]}
                height={laneHeights[lane.id]}
                plotWidth={plotWidth}
                isLast={i === SWIM_LANES.length - 1}
              >
                {laneContent[lane.id]}
              </SwimLaneRow>
            ))}
            <CursorLine
              zoom={zoom}
              offset={offset}
              hoverMonths={hoverMonths}
              totalHeight={totalHeight}
              plotWidth={plotWidth}
            />
          </>
        )}
      </svg>

      {tooltip && createPortal(
        <TooltipOverlay state={tooltip} />,
        document.body,
      )}
    </div>
  )
}

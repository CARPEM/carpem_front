import { create } from 'zustand'
import { ZOOM_PX_MAX } from '@/components/timeline/constants'

interface TimelineState {
  /** Pixels per month. Higher = more zoomed in. */
  zoom: number
  /** Left-edge of the visible window, in months from T0. */
  offset: number
  /** Plot area width of the centre panel (px). Used by sparklines for shared time domain. */
  centralPlotWidth: number
  setZoom: (zoom: number) => void
  setOffset: (offset: number) => void
  setCentralPlotWidth: (width: number) => void
  /** Initialise to default view: T0 → (currentMonths + 6 months), clamped to ZOOM_PX_MAX. */
  initZoom: (currentMonths: number, plotWidth: number) => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  zoom: 10,
  offset: 0,
  centralPlotWidth: 0,
  setZoom: (zoom) => set({ zoom }),
  setOffset: (offset) => set({ offset }),
  setCentralPlotWidth: (width) => set({ centralPlotWidth: width }),
  initZoom: (currentMonths, plotWidth) => {
    const defaultZoom = Math.min(plotWidth / (currentMonths + 6), ZOOM_PX_MAX)
    set({ zoom: defaultZoom, offset: 0, centralPlotWidth: plotWidth })
  },
}))

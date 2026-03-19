import TimelineCanvas from '@/components/timeline/TimelineCanvas'
import ZoomControls from '@/components/timeline/ZoomControls'
import { useTimelineStore } from '@/store/timeline'
import { usePatientStore } from '@/store/patient'
import { toMonthsFromT0 } from '@/lib/t0'
import { useCallback, useRef } from 'react'
import { ZOOM_PX_MAX } from '@/components/timeline/constants'

export default function CentrePanel() {
  const { zoom, offset, setZoom, setOffset } = useTimelineStore()
  const { t0 } = usePatientStore()
  const currentMonths = t0 ? toMonthsFromT0(new Date(), t0) : 60
  const plotWidthRef = useRef(0)

  const handleZoomBtn = useCallback(
    (direction: 1 | -1) => {
      const { zoom: z, offset: o } = useTimelineStore.getState()
      const pw = plotWidthRef.current
      const factor = direction > 0 ? 1.3 : 1 / 1.3
      const minZoom = pw > 0 ? pw / (currentMonths + 9) : 1
      const newZoom = Math.max(minZoom, Math.min(ZOOM_PX_MAX, z * factor))
      const viewMonths = pw / z
      const centre = o + viewMonths / 2
      const newOffset = centre - pw / newZoom / 2
      const newViewMonths = pw / newZoom
      setZoom(newZoom)
      setOffset(Math.max(-3, Math.min(newOffset, currentMonths + 6 - newViewMonths)))
    },
    [currentMonths, setZoom, setOffset],
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0 m-2.5 rounded border border-[#b0c8dc] bg-white shadow-sm">
      {/* Header with zoom controls */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#c8d8e8] shrink-0 bg-white rounded-t">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-900">
          Longitudinal Care Timeline
        </h2>
        <ZoomControls onZoom={handleZoomBtn} />
      </div>

      {/* Timeline fills remaining height; flex-col so TimelineCanvas flex-1 works */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TimelineCanvas plotWidthRef={plotWidthRef} />
      </div>
    </div>
  )
}

import type { TooltipState } from './types'

interface Props {
  state: TooltipState
}

export default function TooltipOverlay({ state }: Props) {
  const { x, y, info } = state
  // Viewport-level fixed positioning — clamp to viewport edges
  const left = Math.min(x + 14, window.innerWidth - 200)
  const top = Math.max(4, y - 80)

  return (
    <div
      style={{ left, top }}
      className="fixed z-50 pointer-events-none bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
    >
      <div className="text-base font-semibold">{info.label}</div>
      <div className="text-[13px] text-gray-300 mt-0.5">
        {info.date}
        {info.temporal && (
          <span className="ml-1.5 font-mono text-[#4DD8C9]">{info.temporal}</span>
        )}
      </div>
      <div className="text-base text-gray-500 mt-0.5">{info.resourceType}</div>
    </div>
  )
}

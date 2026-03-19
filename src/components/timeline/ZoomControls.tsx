interface Props {
  onZoom: (direction: 1 | -1) => void
}

export default function ZoomControls({ onZoom }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">Zoom</span>
      {/* Magnifier icon */}
      <svg width={14} height={14} viewBox="0 0 16 16" fill="none" className="text-gray-400">
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <button
        onClick={() => onZoom(-1)}
        title="Zoom out (−)"
        className="w-6 h-6 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-base font-bold flex items-center justify-center leading-none"
      >
        −
      </button>
      <button
        onClick={() => onZoom(1)}
        title="Zoom in (+)"
        className="w-6 h-6 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-base font-bold flex items-center justify-center leading-none"
      >
        +
      </button>
    </div>
  )
}

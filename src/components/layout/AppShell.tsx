import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  patientId?: string
  patientSwitcher?: ReactNode
}

export default function AppShell({ children, patientId, patientSwitcher }: Props) {
  return (
    <div className="flex flex-col h-full text-gray-900">
      {/* Top navigation bar — deep blue */}
      <header className="flex items-center justify-between px-5 h-12 bg-[#1B2A4A] shrink-0">
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] text-blue-200 font-medium tracking-wide">
            Medical and Translational Research Data Warehouse
          </span>
          <span className="text-[13px] text-white font-bold tracking-wide">
            CARPEM Master Observational Trial
          </span>
        </div>
        <div className="flex items-center gap-4 text-blue-200 text-base">
          {patientSwitcher}
          <button className="hover:text-white transition-colors">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button className="w-7 h-7 rounded-full bg-blue-300/30 border border-blue-300/50 text-white text-base font-bold flex items-center justify-center">
            U
          </button>
        </div>
      </header>

      {/* Page title — same colour as background */}
      <div className="px-5 py-2 bg-[#dce8f0] shrink-0 border-b border-[#b8d0e0]">
        <h1 className="text-xl font-black tracking-widest text-[#1B2A4A] uppercase">
          Single Patient 360-Degree Profile:{' '}
          <span className="font-black">{patientId ?? '—'}</span>
        </h1>
      </div>

      {/* Three-column layout — light blue background */}
      <div className="flex flex-1 min-h-0 bg-[#dce8f0]">
        {children}
      </div>
    </div>
  )
}

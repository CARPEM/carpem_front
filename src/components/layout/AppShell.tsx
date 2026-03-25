import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

interface Props {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  return (
    <div className="flex flex-col h-full text-gray-900">
      {/* Top navigation bar — deep blue */}
      <header className="flex items-center justify-between px-5 h-12 bg-[#1B2A4A] shrink-0">
        {/* Left: branding */}
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] text-blue-200 font-medium tracking-wide">
            Medical and Translational Research Data Warehouse
          </span>
          <span className="text-[13px] text-white font-bold tracking-wide">
            CARPEM Master Observational Trial
          </span>
        </div>

        {/* Centre: view nav tabs */}
        <nav className="flex items-center gap-1">
          <NavLink
            to="/cohort"
            className={({ isActive }) =>
              `text-[12px] font-semibold uppercase tracking-widest px-4 py-1 rounded transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-300 hover:text-white hover:bg-white/10'
              }`
            }
          >
            Cohort
          </NavLink>
          <NavLink
            to="/patient"
            end={false}
            className={({ isActive }) =>
              `text-[12px] font-semibold uppercase tracking-widest px-4 py-1 rounded transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-300 hover:text-white hover:bg-white/10'
              }`
            }
          >
            Patient 360°
          </NavLink>
        </nav>

        {/* Right: utility icons */}
        <div className="flex items-center gap-4 text-blue-200">
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

      {/* View content — fills the rest of the viewport */}
      <div className="flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}

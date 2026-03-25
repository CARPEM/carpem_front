import type { ReactNode } from 'react'
import { useCohortStore } from '@/store/cohort'

// ─── Shared style tokens ──────────────────────────────────────────────────────

const selectCls =
  'w-full text-[11px] border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-[#1A7F8E]'
const inputCls =
  'w-full text-[11px] border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#1A7F8E]'

// ─── FilterSection wrapper ────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
        {title}
      </h4>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

// ─── CohortLeftPanel ──────────────────────────────────────────────────────────

export default function CohortLeftPanel() {
  const { analytics, filters, setFilter, resetFilters } = useCohortStore()

  return (
    <aside className="flex flex-col gap-2 p-2 bg-white border-r border-gray-200 overflow-y-auto shrink-0 w-[20%]">

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="text-[11px] font-semibold uppercase tracking-wide text-white bg-[#1B2A4A] hover:bg-[#0D1B30] rounded px-3 py-1.5 transition-colors"
      >
        Reset Filters
      </button>

      {/* N counter */}
      <div className="rounded border border-gray-200 bg-[#f0f7fb] p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
          Cohort Summary
        </p>
        <p className="text-4xl font-black text-[#1B2A4A] leading-none">
          N={analytics?.n ?? '—'}
        </p>
      </div>

      {/* Tumour location + Gene */}
      <FilterSection title="Filter by Mutations">
        <label className="text-[10px] text-gray-500 uppercase tracking-wide">
          Tumour Location
        </label>
        <input
          type="text"
          placeholder="e.g. breast"
          value={filters.bodySite ?? ''}
          onChange={(e) => setFilter('bodySite', e.target.value || undefined)}
          className={inputCls}
        />

        <label className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">
          Gene
        </label>
        <input
          type="text"
          placeholder="e.g. KRAS"
          value={filters.gene ?? ''}
          onChange={(e) => setFilter('gene', e.target.value || undefined)}
          className={inputCls}
        />
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender">
        <select
          className={selectCls}
          value={filters.gender ?? ''}
          onChange={(e) => setFilter('gender', e.target.value || undefined)}
        >
          <option value="">All</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      </FilterSection>

      {/* Stage */}
      <FilterSection title="Stage">
        <select
          className={selectCls}
          value={filters.stage ?? ''}
          onChange={(e) => setFilter('stage', e.target.value || undefined)}
        >
          <option value="">All</option>
          <option value="I">Stage I</option>
          <option value="II">Stage II</option>
          <option value="III">Stage III</option>
          <option value="IV">Stage IV</option>
        </select>
      </FilterSection>

    </aside>
  )
}

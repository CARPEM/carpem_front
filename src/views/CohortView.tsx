import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCohortStore } from '@/store/cohort'
import { COHORT_CONFIG } from '@/config/cohortConfig'
import CohortLeftPanel from '@/components/cohort/CohortLeftPanel'
import ChartPanel from '@/components/cohort/ChartPanel'
import GenderDistribution from '@/components/cohort/charts/GenderDistribution'
import AgeAtDiagnosis from '@/components/cohort/charts/AgeAtDiagnosis'
import CancerStageDistribution from '@/components/cohort/charts/CancerStageDistribution'
import KeySomaticMutations, { MutationSearch } from '@/components/cohort/charts/KeySomaticMutations'
import OverallSurvivalKM from '@/components/cohort/charts/OverallSurvivalKM'
import ProgressionFreeSurvivalKM from '@/components/cohort/charts/ProgressionFreeSurvivalKM'
import SurgeryMix from '@/components/cohort/charts/SurgeryMix'
import ChemotherapyMix from '@/components/cohort/charts/ChemotherapyMix'
import RadiotherapyMix from '@/components/cohort/charts/RadiotherapyMix'

// ─── Main chart grid ──────────────────────────────────────────────────────────

function MainGrid() {
  const { loading, error } = useCohortStore()
  const [mutSearch, setMutSearch] = useState('')

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-1.5 p-1.5 overflow-hidden">

      {/* Row 1: Demographics */}
      <div className="flex gap-1.5 flex-[0_0_auto]" style={{ height: '28%' }}>
        <ChartPanel title="Gender Distribution" loading={loading} error={error} className="flex-1">
          <GenderDistribution />
        </ChartPanel>
        <ChartPanel title="Age at Diagnosis" loading={loading} error={error} className="flex-1">
          <AgeAtDiagnosis />
        </ChartPanel>
        <ChartPanel title="Cancer Stage Distribution" loading={loading} error={error} className="flex-1">
          <CancerStageDistribution />
        </ChartPanel>
      </div>

      {/* Row 2: Key Somatic Mutations (full width) */}
      <div className="flex gap-1.5 flex-[0_0_auto]" style={{ height: '46%' }}>
        <ChartPanel
          title="Key Somatic Mutations"
          subtitle="(Percent of Patients)"
          headerRight={<MutationSearch value={mutSearch} onChange={setMutSearch} />}
          loading={loading}
          error={error}
          className="flex-1"
        >
          <KeySomaticMutations search={mutSearch} />
        </ChartPanel>
      </div>

      {/* Row 3: Survival curves + Treatment mix */}
      <div className="flex gap-1.5 flex-[0_0_auto] min-h-0" style={{ height: '26%' }}>
        <ChartPanel title="Overall Survival" loading={loading} error={error} className="flex-1">
          <OverallSurvivalKM />
        </ChartPanel>
        <ChartPanel title="Progression-Free Survival" loading={loading} error={error} className="flex-1">
          <ProgressionFreeSurvivalKM />
        </ChartPanel>
        <ChartPanel title="Surgery Mix" loading={loading} error={error} className="flex-1">
          <SurgeryMix />
        </ChartPanel>
        <ChartPanel title="Chemotherapy Mix" loading={loading} error={error} className="flex-1">
          <ChemotherapyMix />
        </ChartPanel>
        <ChartPanel title="Radiotherapy Mix" loading={loading} error={error} className="flex-1">
          <RadiotherapyMix />
        </ChartPanel>
      </div>

    </div>
  )
}

// ─── CohortView ───────────────────────────────────────────────────────────────

export default function CohortView() {
  const { analytics, filters, setFilter, setFilters } = useCohortStore()
  const [searchParams, setSearchParams] = useSearchParams()

  // On mount: restore filter state from URL params, then fetch once
  useEffect(() => {
    const p = (key: string) => searchParams.get(key) || undefined
    setFilters({ gender: p('gender'), stage: p('stage'), bodySite: p('bodySite'), gene: p('gene') })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep URL in sync with store filters (replace — no extra history entries)
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.gender)   params.set('gender',   filters.gender)
    if (filters.stage)    params.set('stage',     filters.stage)
    if (filters.bodySite) params.set('bodySite',  filters.bodySite)
    if (filters.gene)     params.set('gene',      filters.gene)
    setSearchParams(params, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Title bar */}
      <div className="flex items-center justify-between px-5 py-2 bg-[#dce8f0] shrink-0 border-b border-[#b8d0e0]">
        <h1 className="text-xl font-black tracking-widest text-[#1B2A4A] uppercase">
          Full Cohort Analytics Dashboard
          {analytics?.n != null && (
            <span className="ml-2 font-black">(N={analytics.n})</span>
          )}
        </h1>
        <select
          className="bg-white border border-[#b8d0e0] text-[#1B2A4A] text-xs font-semibold rounded px-3 py-1 focus:outline-none"
          value={filters.bodySite ?? ''}
          onChange={(e) => setFilter('bodySite', e.target.value || undefined)}
        >
          {COHORT_CONFIG.map(({ label, bodySite }) => (
            <option key={bodySite} value={bodySite}>{label}</option>
          ))}
        </select>
      </div>

      {/* Two-zone layout */}
      <div className="flex flex-1 min-h-0 bg-[#dce8f0]">
        <CohortLeftPanel />
        <MainGrid />
      </div>

    </div>
  )
}

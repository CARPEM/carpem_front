import { create } from 'zustand'
import { fetchCohortAnalytics } from '@/lib/cohortApi'
import type { CohortAnalyticsResponse, CohortFilters } from '@/types/cohortAnalytics'

interface CohortState {
  filters: CohortFilters
  analytics: CohortAnalyticsResponse | null
  loading: boolean
  error: string | null
  /** Re-query the analytics API with the current filters (full phase). */
  fetchAnalytics: () => Promise<void>
  /** Set a single filter key and immediately re-fetch. */
  setFilter: (key: keyof CohortFilters, value: string | undefined) => void
  /** Replace the entire filter set and re-fetch once. */
  setFilters: (filters: CohortFilters) => void
  /** Clear all filters and re-fetch. */
  resetFilters: () => void
}

export const useCohortStore = create<CohortState>((set, get) => ({
  filters: {},
  analytics: null,
  loading: false,
  error: null,

  fetchAnalytics: async () => {
    set({ loading: true, error: null })
    try {
      const analytics = await fetchCohortAnalytics(get().filters, 'full')
      set({ analytics, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false })
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }))
    void get().fetchAnalytics()
  },

  setFilters: (filters) => {
    set({ filters })
    void get().fetchAnalytics()
  },

  resetFilters: () => {
    set({ filters: {} })
    void get().fetchAnalytics()
  },
}))

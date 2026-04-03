import type { CohortAnalyticsResponse, CohortFilters } from '@/types/cohortAnalytics'
import fhirConfig from '@/config/fhirConfig'

/**
 * Fetch aggregated cohort analytics from the server.
 * All computation is server-side — only chart-ready data is returned.
 *
 * @param filters  Active cohort filters (gender, stage, bodySite, gene, code)
 * @param phase    'demographics' returns only Row 1 data (fast); 'full' returns everything
 */
export async function fetchCohortAnalytics(
  filters: CohortFilters = {},
  phase: 'demographics' | 'full' = 'full',
): Promise<CohortAnalyticsResponse> {
  const params = new URLSearchParams({ phase })
  if (filters.gender)   params.set('gender',   filters.gender)
  if (filters.stage)    params.set('stage',     filters.stage)
  if (filters.bodySite) params.set('bodySite',  filters.bodySite)
  if (filters.gene)     params.set('gene',      filters.gene)
  if (filters.code)     params.set('code',      filters.code)

  const res = await fetch(`${fhirConfig.baseUrl}/cohort/analytics?${params}`, {
    headers: fhirConfig.analyticsHeaders,
  })
  if (!res.ok) throw new Error(`Analytics request failed: ${res.status} ${res.statusText}`)
  return res.json() as Promise<CohortAnalyticsResponse>
}

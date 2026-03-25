// ─── Cohort Analytics API response types ─────────────────────────────────────
// Returned by GET /fhir/R4/cohort/analytics
// All aggregation is server-side; the client receives only pre-computed chart data.

export interface GenderItem {
  label: string
  count: number
}

export interface AgeBinItem {
  range: string
  count: number
  meanAge: number | null
}

export interface StageItem {
  stage: string
  count: number
}

export interface OncoPrintAlteration {
  type: string
}

export interface OncoPrintGene {
  gene: string
  /** Percentage of patients in the cohort with at least one alteration in this gene */
  pct: number
  /** One entry per patient (same order as OncoPrintData.patients). null = unaltered. */
  alterations: (OncoPrintAlteration[] | null)[]
}

export interface OncoPrintData {
  /** Patient display IDs, ordered most-altered first */
  patients: string[]
  /** Genes ordered by pct descending (GOI re-ordering done client-side) */
  genes: OncoPrintGene[]
}

export interface TreatmentItem {
  category: string
  count: number
  pct: number
}

export interface KMPoint {
  /** Time in years from T0 */
  t: number
  /** Survival probability 0–1 */
  s: number
  ciLow: number
  ciHigh: number
  nAtRisk: number
}

export interface CohortAnalyticsResponse {
  n: number
  gender: GenderItem[]
  ageBins: AgeBinItem[]
  stages: StageItem[]
  oncoPrint: OncoPrintData
  surgeryMix: TreatmentItem[]
  chemoMix: TreatmentItem[]
  rtMix: TreatmentItem[]
  osCurve: KMPoint[]
  pfsCurve: KMPoint[]
}

export interface CohortFilters {
  gender?: string
  stage?: string
  bodySite?: string
  gene?: string
  /** Condition.code — cancer type filter */
  code?: string
}

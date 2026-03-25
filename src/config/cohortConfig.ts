/**
 * CARPEM CMOT — Cohort Analytics Dashboard Configuration
 *
 * Defines per-location clinical context: relevant genes, surgery types, and
 * chemotherapy classes. Also exports normalizeSurgeryLabel(), used server-side
 * to map verbose FHIR procedure texts to canonical category names.
 *
 * Update this file to adapt the dashboard to a new study or tumour location.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CohortTypeConfig {
  /** Label shown in the Cohort Type selector. */
  label: string
  /** Value passed to the `bodySite` filter. Empty string = no filter (Full Trial). */
  bodySite: string
  /**
   * Clinically relevant genes for this location.
   * Displayed first in the somatic mutations waterfall, regardless of frequency.
   * Listed in the order they should appear (most actionable first).
   */
  genesOfInterest: string[]
  /**
   * Canonical surgery category names expected for this location.
   * Used to order the Surgery Mix chart. Names must match what
   * normalizeSurgeryLabel() returns.
   */
  surgeryTypes: string[]
  /**
   * Relevant chemotherapy class labels for this location, in display order.
   * Names must match the ATC class labels returned by the server
   * ('Standard chemotherapy' | 'Targeted / mAb' | 'Immunotherapy' | 'Hormone therapy').
   */
  chemoTypes: string[]
}

// ─── Surgery label normalisation ─────────────────────────────────────────────
//
// The FHIR server stores full procedure descriptions.
// This map collapses them into canonical chart categories.
// Key: lowercase fragment that appears anywhere in the procedure text.
// Value: canonical category name (must match surgeryTypes in COHORT_CONFIG).
// Earlier entries take priority when multiple fragments match.

export const SURGERY_ALIASES: [fragment: string, canonical: string][] = [
  // Breast
  ['mastectomy',         'Mastectomy'],
  ['lumpectomy',         'Lumpectomy'],
  ['sentinel',           'Sentinel node biopsy'],
  ['axillary',           'Axillary dissection'],
  // Colorectal
  ['colectomy',          'Colectomy'],
  ['sigmoid',            'Colectomy'],
  ['anterior resection', 'Anterior resection'],
  ['hartmann',           'Hartmann procedure'],
  // General resection (after more specific matches above)
  ['resection',          'Resection'],
  // Lung
  ['lobectomy',          'Lobectomy'],
  ['pneumonectomy',      'Pneumonectomy'],
  ['vats',               'VATS'],
  ['wedge',              'Wedge resection'],
  // Gynaecology
  ['hysterectomy',       'Hysterectomy'],
  ['oophorectomy',       'Oophorectomy'],
  ['cytoreductive',      'Cytoreductive surgery'],
  ['peritonectomy',      'Cytoreductive surgery'],
  // Haematology / interventional
  ['transplant',         'Stem cell transplant'],
  ['ercp',               'Endoscopy / Stent'],
  ['stent',              'Endoscopy / Stent'],
  // Generic fallback
  ['biopsy',             'Biopsy'],
]

/**
 * Map a raw FHIR Procedure.code.text to a canonical surgery category name.
 * Returns the raw text unchanged when no alias matches.
 * Exported for use in mock-server/routes/cohortAnalytics.ts.
 */
export function normalizeSurgeryLabel(raw: string): string {
  const lower = raw.toLowerCase()
  for (const [fragment, canonical] of SURGERY_ALIASES) {
    if (lower.includes(fragment)) return canonical
  }
  return raw
}

// ─── Per-location configuration ───────────────────────────────────────────────

export const COHORT_CONFIG: CohortTypeConfig[] = [
  {
    label:    'Full Trial',
    bodySite: '',
    genesOfInterest: ['TP53', 'KRAS', 'PIK3CA', 'BRCA1', 'PTEN'],
    surgeryTypes: [
      'Mastectomy', 'Lumpectomy', 'Resection', 'Colectomy',
      'Lobectomy', 'Hysterectomy', 'Cytoreductive surgery',
      'Stem cell transplant', 'Biopsy',
    ],
    chemoTypes: [
      'Standard chemotherapy', 'Targeted / mAb', 'Immunotherapy', 'Hormone therapy',
    ],
  },
  {
    label:    'Breast',
    bodySite: 'Breast',
    genesOfInterest: ['BRCA1', 'BRCA2', 'PIK3CA', 'TP53', 'PTEN', 'ERBB2', 'CDH1', 'ESR1'],
    surgeryTypes: ['Mastectomy', 'Lumpectomy', 'Sentinel node biopsy', 'Axillary dissection'],
    chemoTypes: [
      'Standard chemotherapy', 'Targeted / mAb', 'Hormone therapy', 'Immunotherapy',
    ],
  },
  {
    label:    'Ovarian',
    bodySite: 'Ovary',
    genesOfInterest: ['BRCA1', 'BRCA2', 'TP53', 'KRAS', 'PTEN', 'ARID1A', 'CCNE1'],
    surgeryTypes: ['Cytoreductive surgery', 'Hysterectomy', 'Oophorectomy', 'Biopsy'],
    chemoTypes: ['Standard chemotherapy', 'Targeted / mAb', 'Immunotherapy'],
  },
  {
    label:    'Colorectal',
    bodySite: 'Colon',
    genesOfInterest: ['KRAS', 'NRAS', 'BRAF', 'TP53', 'APC', 'PIK3CA', 'SMAD4'],
    surgeryTypes: ['Colectomy', 'Resection', 'Anterior resection', 'Hartmann procedure'],
    chemoTypes: ['Standard chemotherapy', 'Targeted / mAb', 'Immunotherapy'],
  },
  {
    label:    'Lung',
    bodySite: 'Lung',
    genesOfInterest: ['KRAS', 'EGFR', 'ALK', 'ROS1', 'BRAF', 'MET', 'TP53', 'STK11'],
    surgeryTypes: ['Lobectomy', 'Pneumonectomy', 'VATS', 'Wedge resection'],
    chemoTypes: ['Standard chemotherapy', 'Targeted / mAb', 'Immunotherapy'],
  },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Return the config for the active bodySite filter, falling back to Full Trial. */
export function getActiveCohortConfig(bodySite?: string): CohortTypeConfig {
  return (
    COHORT_CONFIG.find((c) => c.bodySite === (bodySite ?? '')) ??
    COHORT_CONFIG[0]
  )
}

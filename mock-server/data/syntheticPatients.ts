/**
 * 90 lightweight synthetic patient bundles for cohort analytics testing.
 * Server-side only — never sent to the client as full bundles.
 *
 * Coverage goals (sp01–sp90):
 *  - Gender: ~48F / 42M
 *  - Stages: ~18×I, 27×II, 27×III, 18×IV
 *  - Deceased: ~29 patients → ~32 OS events total with real bundles
 *  - PFS events: ~62 patients
 *  - Treatments: Standard chemo × ≈40, Immunotherapy × ≈18, Targeted/mAb × ≈18, Hormone × ≈7
 *  - Body sites: Breast × ≈31, Colon × ≈29, Lung × ≈17, Ovary × ≈14
 *  - Genomic variants: ~50 of the 60 new patients carry variants for OncoPrint
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = Record<string, any>
type Bundle = { entry: Array<{ resource: Res }> }

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addYears(base: string, years: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + Math.round(years * 365.25))
  return d.toISOString().slice(0, 10)
}

// ─── Resource builders ────────────────────────────────────────────────────────

const pt = (id: string, gender: string, birthYear: number, deceasedDate?: string): Res => ({
  resourceType: 'Patient',
  id: `syn-${id}`,
  gender,
  birthDate: `${birthYear}-06-15`,
  ...(deceasedDate ? { deceasedDateTime: deceasedDate } : {}),
})

const cond = (id: string, onset: string, bodySite?: string): Res => ({
  resourceType: 'Condition',
  id: `syn-cond-${id}`,
  clinicalStatus:    { coding: [{ code: 'active' }] },
  verificationStatus:{ coding: [{ code: 'confirmed' }] },
  category:          [{ coding: [{ code: 'encounter-diagnosis' }] }],
  onsetDateTime: onset,
  ...(bodySite ? { bodySite: [{ coding: [{ display: bodySite }] }] } : {}),
})

const stageObs = (id: string, stage: string, date: string): Res => ({
  resourceType: 'Observation',
  id: `syn-stage-${id}`,
  status: 'final',
  code: { coding: [{ code: '21908-9', display: 'Stage group.pathology Cancer' }] },
  valueCodeableConcept: { coding: [{ code: stage, display: stage }], text: stage },
  effectiveDateTime: date,
})

const medAdmin = (id: string, atcCode: string, date: string): Res => ({
  resourceType: 'MedicationAdministration',
  id: `syn-med-${id}`,
  status: 'completed',
  medicationCodeableConcept: {
    coding: [{ system: 'http://www.whocc.no/atc', code: atcCode }],
  },
  subject: { reference: `Patient/syn-${id}` },
  effectiveDateTime: date,
})

const surg = (id: string, text: string, date: string): Res => ({
  resourceType: 'Procedure',
  id: `syn-surg-${id}`,
  status: 'completed',
  category: { coding: [{ code: '387713003', display: 'Surgical procedure' }] },
  code: { text },
  performedDateTime: date,
})

const rt = (id: string, text: string, date: string): Res => ({
  resourceType: 'Procedure',
  id: `syn-rt-${id}`,
  status: 'completed',
  category: { coding: [{ code: '108290001', display: 'Radiation oncology AND/OR radiotherapy' }] },
  code: { text },
  performedDateTime: date,
})

const prog = (id: string, date: string): Res => ({
  resourceType: 'Observation',
  id: `syn-prog-${id}`,
  status: 'final',
  code: { coding: [{ code: '21976-6', display: 'RECIST response' }] },
  valueCodeableConcept: { text: 'Progressive disease' },
  effectiveDateTime: date,
})

const gv = (patientId: string, gene: string, variantType: string, date: string): Res => ({
  resourceType: 'Observation',
  id: `syn-gv-${patientId}-${gene.toLowerCase()}`,
  status: 'final',
  category: [{ coding: [{ code: 'genomic-variant', system: 'http://terminology.hl7.org/CodeSystem/observation-category' }] }],
  code: { coding: [{ code: '69548-6', system: 'http://loinc.org', display: 'Genetic variant assessment' }] },
  effectiveDateTime: date,
  component: [
    {
      code: { coding: [{ code: '48018-6', system: 'http://loinc.org' }] },
      valueCodeableConcept: { coding: [{ display: gene }] },
    },
    {
      code: { coding: [{ code: '48019-4', system: 'http://loinc.org' }] },
      valueCodeableConcept: { coding: [{ code: variantType }] },
    },
  ],
})

// ─── Bundle assembler ─────────────────────────────────────────────────────────

interface SynPt {
  id: string
  gender: string
  birthYear: number
  t0: string
  stage: string
  bodySite?: string
  deathYears?: number
  progYears?: number
  atcCode: string
  surgeryText?: string
  rtText?: string
  variants?: Array<{ gene: string; variantType: string }>
}

function makeBundle(p: SynPt): Bundle {
  const deathDate = p.deathYears != null ? addYears(p.t0, p.deathYears) : undefined
  const progDate  = p.progYears  != null ? addYears(p.t0, p.progYears)  : undefined
  const medDate   = addYears(p.t0, 0.08)   // ~1 month after diagnosis
  const surgDate  = addYears(p.t0, 0.33)   // ~4 months after diagnosis
  const rtDate    = addYears(p.t0, 0.5)    // ~6 months after diagnosis

  const resources: Res[] = [
    pt(p.id, p.gender, p.birthYear, deathDate),
    cond(p.id, p.t0, p.bodySite),
    stageObs(p.id, p.stage, p.t0),
    medAdmin(p.id, p.atcCode, medDate),
  ]
  if (p.surgeryText) resources.push(surg(p.id, p.surgeryText, surgDate))
  if (p.rtText)      resources.push(rt(p.id, p.rtText, rtDate))
  if (progDate)      resources.push(prog(p.id, progDate))
  for (const v of (p.variants ?? [])) resources.push(gv(p.id, v.gene, v.variantType, p.t0))

  return { entry: resources.map((resource) => ({ resource })) }
}

// ─── Patient roster ───────────────────────────────────────────────────────────

const ROSTER: SynPt[] = [

  // ── Stage I: good prognosis, all alive ──────────────────────────────────────
  { id: 'sp01', gender: 'female', birthYear: 1980, t0: '2021-03-15', stage: 'Stage I',    bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Lumpectomy' },
  { id: 'sp02', gender: 'male',   birthYear: 1975, t0: '2022-01-20', stage: 'Stage I',    bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection' },
  { id: 'sp03', gender: 'female', birthYear: 1970, t0: '2020-06-10', stage: 'Stage IA',   bodySite: 'Ovary',  atcCode: 'L01' },
  { id: 'sp04', gender: 'female', birthYear: 1985, t0: '2022-08-05', stage: 'Stage I',    bodySite: 'Breast', atcCode: 'L02' },
  { id: 'sp05', gender: 'male',   birthYear: 1968, t0: '2021-11-20', stage: 'Stage IA',   bodySite: 'Lung',   atcCode: 'L01F' },
  { id: 'sp06', gender: 'female', birthYear: 1978, t0: '2020-04-25', stage: 'Stage I',    bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Lumpectomy' },

  // ── Stage II: moderate prognosis, all alive ──────────────────────────────────
  { id: 'sp07', gender: 'female', birthYear: 1972, t0: '2020-03-15', stage: 'Stage IIA',  bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy',              progYears: 2.0 },
  { id: 'sp08', gender: 'male',   birthYear: 1958, t0: '2019-06-20', stage: 'Stage IIB',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',  rtText: 'Adjuvant Radiotherapy', progYears: 1.5 },
  { id: 'sp09', gender: 'female', birthYear: 1965, t0: '2021-01-10', stage: 'Stage II',   bodySite: 'Ovary',  atcCode: 'L01',                                           progYears: 2.8 },
  { id: 'sp10', gender: 'male',   birthYear: 1963, t0: '2020-05-15', stage: 'Stage IIA',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',  rtText: 'Adjuvant Radiotherapy', progYears: 2.2 },
  { id: 'sp11', gender: 'female', birthYear: 1968, t0: '2020-07-20', stage: 'Stage IIB',  bodySite: 'Breast', atcCode: 'L02',   surgeryText: 'Mastectomy' },
  { id: 'sp12', gender: 'female', birthYear: 1975, t0: '2021-06-15', stage: 'Stage IIA',  bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy',              progYears: 1.0 },
  { id: 'sp13', gender: 'male',   birthYear: 1960, t0: '2019-09-10', stage: 'Stage IIA',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',               progYears: 2.0 },
  { id: 'sp14', gender: 'female', birthYear: 1971, t0: '2020-11-05', stage: 'Stage II',   bodySite: 'Ovary',  atcCode: 'L01',                              rtText: 'Adjuvant Radiotherapy', progYears: 1.8 },
  { id: 'sp15', gender: 'female', birthYear: 1978, t0: '2021-09-20', stage: 'Stage IIA',  bodySite: 'Breast', atcCode: 'L01F',                                          progYears: 1.5 },

  // ── Stage III: worse prognosis, mostly alive ─────────────────────────────────
  { id: 'sp16', gender: 'female', birthYear: 1958, t0: '2019-06-20', stage: 'Stage IIIA', bodySite: 'Colon',  atcCode: 'L01',                              rtText: 'Adjuvant Radiotherapy', progYears: 1.5 },
  { id: 'sp17', gender: 'male',   birthYear: 1955, t0: '2019-03-10', stage: 'Stage IIIB', bodySite: 'Lung',   atcCode: 'L01F',  deathYears: 2.5,           progYears: 0.8 },
  { id: 'sp18', gender: 'male',   birthYear: 1960, t0: '2018-09-25', stage: 'Stage IIIB', bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',  deathYears: 2.5, progYears: 1.2 },
  { id: 'sp19', gender: 'male',   birthYear: 1952, t0: '2018-04-05', stage: 'Stage IIIA', bodySite: 'Lung',   atcCode: 'L01F',                             rtText: 'Palliative Radiotherapy', deathYears: 3.5, progYears: 0.8 },
  { id: 'sp20', gender: 'male',   birthYear: 1957, t0: '2020-02-10', stage: 'Stage III',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',  rtText: 'Adjuvant Radiotherapy', progYears: 2.0 },
  { id: 'sp21', gender: 'female', birthYear: 1969, t0: '2019-12-05', stage: 'Stage IIIA', bodySite: 'Breast', atcCode: 'L01',   surgeryText: 'Mastectomy', rtText: 'Adjuvant Radiotherapy', progYears: 3.0 },
  { id: 'sp22', gender: 'male',   birthYear: 1961, t0: '2019-04-15', stage: 'Stage IIIA', bodySite: 'Colon',  atcCode: 'L01',                              rtText: 'Adjuvant Radiotherapy', progYears: 1.3 },
  { id: 'sp23', gender: 'female', birthYear: 1966, t0: '2020-12-01', stage: 'Stage IIIA', bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy',              progYears: 3.5 },
  { id: 'sp24', gender: 'male',   birthYear: 1964, t0: '2020-01-20', stage: 'Stage IIIB', bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',  rtText: 'Palliative Radiotherapy', progYears: 2.5 },

  // ── Stage IV: poor prognosis, mostly deceased ─────────────────────────────────
  { id: 'sp25', gender: 'female', birthYear: 1950, t0: '2018-03-01', stage: 'Stage IV',   bodySite: 'Lung',   atcCode: 'L01',   deathYears: 2.25, progYears: 1.0 },
  { id: 'sp26', gender: 'male',   birthYear: 1945, t0: '2017-09-15', stage: 'Stage IV',   bodySite: 'Colon',  atcCode: 'L01',                    rtText: 'Palliative Radiotherapy', deathYears: 2.25, progYears: 1.0 },
  { id: 'sp27', gender: 'male',   birthYear: 1948, t0: '2019-01-20', stage: 'Stage IV',   bodySite: 'Lung',   atcCode: 'L01F',  deathYears: 1.5,  progYears: 0.5 },
  { id: 'sp28', gender: 'female', birthYear: 1943, t0: '2018-07-20', stage: 'Stage IV',   bodySite: 'Lung',   atcCode: 'L01',   deathYears: 0.75, progYears: 0.5 },
  { id: 'sp29', gender: 'female', birthYear: 1956, t0: '2019-08-10', stage: 'Stage IV',   bodySite: 'Breast', atcCode: 'L01',   surgeryText: 'Mastectomy', rtText: 'Palliative Radiotherapy', deathYears: 3.5, progYears: 2.5 },
  { id: 'sp30', gender: 'male',   birthYear: 1953, t0: '2018-11-10', stage: 'Stage IV',   bodySite: 'Lung',   atcCode: 'L01F',  deathYears: 4.0,  progYears: 1.8 },

  // ══════════════════════════════════════════════════════════════════════════════
  // 60 additional patients (sp31–sp90) — includes genomic variants for OncoPrint
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Stage I (sp31–sp42) ───────────────────────────────────────────────────────
  { id: 'sp31', gender: 'female', birthYear: 1982, t0: '2021-03-10', stage: 'Stage I',    bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Lumpectomy',
    variants: [{ gene: 'PIK3CA', variantType: 'missense_variant' }] },
  { id: 'sp32', gender: 'male',   birthYear: 1970, t0: '2020-07-22', stage: 'Stage I',    bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',
    variants: [{ gene: 'APC', variantType: 'frameshift_variant' }] },
  { id: 'sp33', gender: 'female', birthYear: 1988, t0: '2022-02-14', stage: 'Stage I',    bodySite: 'Breast', atcCode: 'L02',   surgeryText: 'Lumpectomy',
    variants: [{ gene: 'BRCA1', variantType: 'missense_variant' }] },
  { id: 'sp34', gender: 'male',   birthYear: 1973, t0: '2021-09-05', stage: 'Stage IA',   bodySite: 'Lung',   atcCode: 'L01F',  surgeryText: 'VATS procedure' },
  { id: 'sp35', gender: 'female', birthYear: 1979, t0: '2020-04-18', stage: 'Stage I',    bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Oophorectomy',
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp36', gender: 'female', birthYear: 1984, t0: '2022-06-30', stage: 'Stage I',    bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Lumpectomy',
    variants: [{ gene: 'ERBB2', variantType: 'copy_number_gain' }] },
  { id: 'sp37', gender: 'male',   birthYear: 1976, t0: '2021-01-15', stage: 'Stage I',    bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection' },
  { id: 'sp38', gender: 'female', birthYear: 1990, t0: '2022-10-03', stage: 'Stage I',    bodySite: 'Breast', atcCode: 'L02',   surgeryText: 'Lumpectomy',
    variants: [{ gene: 'PIK3CA', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp39', gender: 'male',   birthYear: 1965, t0: '2020-11-20', stage: 'Stage IA',   bodySite: 'Lung',   atcCode: 'L01F',  surgeryText: 'Lobectomy',
    variants: [{ gene: 'EGFR', variantType: 'missense_variant' }] },
  { id: 'sp40', gender: 'female', birthYear: 1971, t0: '2021-05-08', stage: 'Stage I',    bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery',
    variants: [{ gene: 'BRCA2', variantType: 'frameshift_variant' }] },
  { id: 'sp41', gender: 'male',   birthYear: 1969, t0: '2020-08-25', stage: 'Stage I',    bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }] },
  { id: 'sp42', gender: 'female', birthYear: 1986, t0: '2022-04-12', stage: 'Stage I',    bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Lumpectomy',
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }] },

  // ── Stage II (sp43–sp60) ──────────────────────────────────────────────────────
  { id: 'sp43', gender: 'female', birthYear: 1964, t0: '2020-02-10', stage: 'Stage IIA',  bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy',              progYears: 2.5,
    variants: [{ gene: 'PIK3CA', variantType: 'missense_variant' }, { gene: 'BRCA1', variantType: 'missense_variant' }] },
  { id: 'sp44', gender: 'male',   birthYear: 1956, t0: '2019-05-14', stage: 'Stage IIB',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Adjuvant Radiotherapy', progYears: 2.0,
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'APC', variantType: 'frameshift_variant' }] },
  { id: 'sp45', gender: 'female', birthYear: 1967, t0: '2021-01-28', stage: 'Stage II',   bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery',    progYears: 1.8,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'BRCA1', variantType: 'missense_variant' }] },
  { id: 'sp46', gender: 'male',   birthYear: 1961, t0: '2020-09-17', stage: 'Stage IIA',  bodySite: 'Lung',   atcCode: 'L01F',  surgeryText: 'Lobectomy',               progYears: 1.5,
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }] },
  { id: 'sp47', gender: 'female', birthYear: 1975, t0: '2020-03-22', stage: 'Stage IIA',  bodySite: 'Breast', atcCode: 'L02',   surgeryText: 'Mastectomy',              progYears: 3.0,
    variants: [{ gene: 'ESR1', variantType: 'missense_variant' }] },
  { id: 'sp48', gender: 'male',   birthYear: 1959, t0: '2019-10-05', stage: 'Stage IIB',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Adjuvant Radiotherapy', progYears: 2.5,
    variants: [{ gene: 'APC', variantType: 'frameshift_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp49', gender: 'female', birthYear: 1972, t0: '2021-07-19', stage: 'Stage IIA',  bodySite: 'Breast', atcCode: 'L01',   surgeryText: 'Mastectomy',              progYears: 1.5,
    variants: [{ gene: 'BRCA2', variantType: 'missense_variant' }] },
  { id: 'sp50', gender: 'male',   birthYear: 1966, t0: '2020-06-08', stage: 'Stage IIA',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'PIK3CA', variantType: 'missense_variant' }] },
  { id: 'sp51', gender: 'female', birthYear: 1980, t0: '2021-04-30', stage: 'Stage II',   bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Oophorectomy',            progYears: 2.2,
    variants: [{ gene: 'BRCA1', variantType: 'frameshift_variant' }] },
  { id: 'sp52', gender: 'male',   birthYear: 1971, t0: '2020-12-03', stage: 'Stage IIA',  bodySite: 'Lung',   atcCode: 'L01F',  surgeryText: 'Lobectomy',               progYears: 2.0,
    variants: [{ gene: 'EGFR', variantType: 'missense_variant' }] },
  { id: 'sp53', gender: 'female', birthYear: 1968, t0: '2019-08-20', stage: 'Stage IIB',  bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy',              progYears: 4.0,
    variants: [{ gene: 'ERBB2', variantType: 'copy_number_gain' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp54', gender: 'male',   birthYear: 1963, t0: '2020-01-15', stage: 'Stage IIB',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Adjuvant Radiotherapy', progYears: 1.8,
    variants: [{ gene: 'APC', variantType: 'frameshift_variant' }] },
  { id: 'sp55', gender: 'female', birthYear: 1974, t0: '2021-10-11', stage: 'Stage IIA',  bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery',    progYears: 2.5,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'ARID1A', variantType: 'frameshift_variant' }] },
  { id: 'sp56', gender: 'male',   birthYear: 1960, t0: '2019-03-27', stage: 'Stage IIB',  bodySite: 'Lung',   atcCode: 'L01',   surgeryText: 'Lobectomy',               progYears: 1.2,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'STK11', variantType: 'stop_gained' }] },
  { id: 'sp57', gender: 'female', birthYear: 1976, t0: '2021-08-14', stage: 'Stage IIA',  bodySite: 'Breast', atcCode: 'L01F',  surgeryText: 'Lumpectomy', rtText: 'Adjuvant Radiotherapy', progYears: 2.8,
    variants: [{ gene: 'PIK3CA', variantType: 'missense_variant' }] },
  { id: 'sp58', gender: 'male',   birthYear: 1965, t0: '2020-04-02', stage: 'Stage IIB',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Adjuvant Radiotherapy',
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }] },
  { id: 'sp59', gender: 'female', birthYear: 1970, t0: '2020-10-18', stage: 'Stage IIA',  bodySite: 'Breast', atcCode: 'L02',   surgeryText: 'Mastectomy',              progYears: 3.5,
    variants: [{ gene: 'CDH1', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp60', gender: 'male',   birthYear: 1969, t0: '2019-12-09', stage: 'Stage IIA',  bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection',
    variants: [{ gene: 'BRAF', variantType: 'missense_variant' }, { gene: 'PIK3CA', variantType: 'missense_variant' }] },

  // ── Stage III (sp61–sp78) ─────────────────────────────────────────────────────
  { id: 'sp61', gender: 'female', birthYear: 1955, t0: '2018-05-20', stage: 'Stage IIIA', bodySite: 'Breast', atcCode: 'L01',   surgeryText: 'Mastectomy', rtText: 'Adjuvant Radiotherapy', deathYears: 4.5, progYears: 2.0,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'PIK3CA', variantType: 'missense_variant' }] },
  { id: 'sp62', gender: 'male',   birthYear: 1950, t0: '2018-11-04', stage: 'Stage IIIB', bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Palliative Radiotherapy', deathYears: 3.0, progYears: 1.0,
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp63', gender: 'female', birthYear: 1957, t0: '2019-07-16', stage: 'Stage IIIA', bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery',    progYears: 2.5,
    variants: [{ gene: 'BRCA1', variantType: 'frameshift_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp64', gender: 'male',   birthYear: 1952, t0: '2019-02-28', stage: 'Stage IIIB', bodySite: 'Lung',   atcCode: 'L01F',  rtText: 'Palliative Radiotherapy',       deathYears: 2.5, progYears: 0.8,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'KRAS', variantType: 'missense_variant' }] },
  { id: 'sp65', gender: 'female', birthYear: 1960, t0: '2019-09-10', stage: 'Stage IIIA', bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy',              progYears: 3.0,
    variants: [{ gene: 'ERBB2', variantType: 'copy_number_gain' }, { gene: 'PIK3CA', variantType: 'missense_variant' }] },
  { id: 'sp66', gender: 'male',   birthYear: 1955, t0: '2018-08-22', stage: 'Stage IIIA', bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Adjuvant Radiotherapy', progYears: 2.0,
    variants: [{ gene: 'APC', variantType: 'frameshift_variant' }, { gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp67', gender: 'female', birthYear: 1962, t0: '2019-04-06', stage: 'Stage IIIB', bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery',    deathYears: 3.5, progYears: 1.5,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'ARID1A', variantType: 'frameshift_variant' }] },
  { id: 'sp68', gender: 'male',   birthYear: 1958, t0: '2019-12-18', stage: 'Stage IIIA', bodySite: 'Lung',   atcCode: 'L01F',  rtText: 'Palliative Radiotherapy',       progYears: 1.5,
    variants: [{ gene: 'EGFR', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp69', gender: 'female', birthYear: 1953, t0: '2018-02-14', stage: 'Stage IIIB', bodySite: 'Breast', atcCode: 'L01',   surgeryText: 'Mastectomy', rtText: 'Adjuvant Radiotherapy', deathYears: 4.0, progYears: 2.5,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'BRCA1', variantType: 'missense_variant' }] },
  { id: 'sp70', gender: 'male',   birthYear: 1963, t0: '2020-07-05', stage: 'Stage IIIA', bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Adjuvant Radiotherapy', progYears: 3.0,
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'SMAD4', variantType: 'frameshift_variant' }] },
  { id: 'sp71', gender: 'female', birthYear: 1956, t0: '2019-10-23', stage: 'Stage IIIA', bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery',    deathYears: 3.0, progYears: 1.8,
    variants: [{ gene: 'BRCA2', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp72', gender: 'male',   birthYear: 1960, t0: '2018-06-30', stage: 'Stage IIIB', bodySite: 'Lung',   atcCode: 'L01',   rtText: 'Palliative Radiotherapy',       deathYears: 2.0, progYears: 0.8,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'STK11', variantType: 'stop_gained' }] },
  { id: 'sp73', gender: 'female', birthYear: 1957, t0: '2019-01-09', stage: 'Stage IIIA', bodySite: 'Breast', atcCode: 'L02',   surgeryText: 'Mastectomy',              progYears: 4.0,
    variants: [{ gene: 'ESR1', variantType: 'missense_variant' }, { gene: 'PIK3CA', variantType: 'missense_variant' }] },
  { id: 'sp74', gender: 'male',   birthYear: 1961, t0: '2019-05-17', stage: 'Stage IIIB', bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Adjuvant Radiotherapy', deathYears: 3.5, progYears: 1.5,
    variants: [{ gene: 'APC', variantType: 'frameshift_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp75', gender: 'female', birthYear: 1965, t0: '2021-03-25', stage: 'Stage IIIA', bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery',    progYears: 2.0,
    variants: [{ gene: 'BRCA1', variantType: 'missense_variant' }, { gene: 'PTEN', variantType: 'missense_variant' }] },
  { id: 'sp76', gender: 'male',   birthYear: 1954, t0: '2019-08-12', stage: 'Stage IIIA', bodySite: 'Lung',   atcCode: 'L01F',  rtText: 'Palliative Radiotherapy',       progYears: 2.0,
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'MET', variantType: 'copy_number_gain' }] },
  { id: 'sp77', gender: 'female', birthYear: 1960, t0: '2020-05-28', stage: 'Stage IIIB', bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy', rtText: 'Adjuvant Radiotherapy', progYears: 3.5,
    variants: [{ gene: 'PIK3CA', variantType: 'missense_variant' }, { gene: 'PTEN', variantType: 'stop_gained' }] },
  { id: 'sp78', gender: 'male',   birthYear: 1959, t0: '2019-11-01', stage: 'Stage IIIA', bodySite: 'Colon',  atcCode: 'L01',   surgeryText: 'Resection', rtText: 'Adjuvant Radiotherapy', progYears: 2.5,
    variants: [{ gene: 'NRAS', variantType: 'missense_variant' }, { gene: 'PIK3CA', variantType: 'missense_variant' }] },

  // ── Stage IV (sp79–sp90) ──────────────────────────────────────────────────────
  { id: 'sp79', gender: 'female', birthYear: 1948, t0: '2018-04-07', stage: 'Stage IV',   bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy', rtText: 'Palliative Radiotherapy', deathYears: 2.5, progYears: 1.0,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'PIK3CA', variantType: 'missense_variant' }, { gene: 'BRCA1', variantType: 'missense_variant' }] },
  { id: 'sp80', gender: 'male',   birthYear: 1945, t0: '2017-10-19', stage: 'Stage IV',   bodySite: 'Colon',  atcCode: 'L01',   rtText: 'Palliative Radiotherapy',       deathYears: 1.8, progYears: 0.8,
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }, { gene: 'APC', variantType: 'frameshift_variant' }] },
  { id: 'sp81', gender: 'female', birthYear: 1950, t0: '2018-09-03', stage: 'Stage IV',   bodySite: 'Lung',   atcCode: 'L01F',  rtText: 'Palliative Radiotherapy',       deathYears: 1.5, progYears: 0.5,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'KRAS', variantType: 'missense_variant' }] },
  { id: 'sp82', gender: 'male',   birthYear: 1943, t0: '2018-01-25', stage: 'Stage IV',   bodySite: 'Colon',  atcCode: 'L01',   rtText: 'Palliative Radiotherapy',       deathYears: 2.0, progYears: 0.8,
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }, { gene: 'BRAF', variantType: 'missense_variant' }] },
  { id: 'sp83', gender: 'female', birthYear: 1945, t0: '2018-07-11', stage: 'Stage IV',   bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery', rtText: 'Palliative Radiotherapy', deathYears: 1.8, progYears: 0.8,
    variants: [{ gene: 'BRCA1', variantType: 'frameshift_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp84', gender: 'male',   birthYear: 1952, t0: '2019-03-14', stage: 'Stage IV',   bodySite: 'Lung',   atcCode: 'L01F',  rtText: 'Palliative Radiotherapy',       deathYears: 2.5, progYears: 1.0,
    variants: [{ gene: 'EGFR', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp85', gender: 'female', birthYear: 1949, t0: '2018-12-06', stage: 'Stage IV',   bodySite: 'Breast', atcCode: 'L01',   surgeryText: 'Mastectomy', rtText: 'Palliative Radiotherapy', deathYears: 3.0, progYears: 1.5,
    variants: [{ gene: 'PIK3CA', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }, { gene: 'PTEN', variantType: 'stop_gained' }] },
  { id: 'sp86', gender: 'male',   birthYear: 1955, t0: '2018-03-22', stage: 'Stage IV',   bodySite: 'Colon',  atcCode: 'L01',   rtText: 'Palliative Radiotherapy',       deathYears: 1.5, progYears: 0.7,
    variants: [{ gene: 'APC', variantType: 'frameshift_variant' }, { gene: 'KRAS', variantType: 'missense_variant' }] },
  { id: 'sp87', gender: 'female', birthYear: 1946, t0: '2017-08-29', stage: 'Stage IV',   bodySite: 'Ovary',  atcCode: 'L01',   surgeryText: 'Cytoreductive surgery',    deathYears: 2.5, progYears: 1.0,
    variants: [{ gene: 'BRCA2', variantType: 'frameshift_variant' }, { gene: 'TP53', variantType: 'missense_variant' }, { gene: 'ARID1A', variantType: 'stop_gained' }] },
  { id: 'sp88', gender: 'male',   birthYear: 1950, t0: '2018-10-15', stage: 'Stage IV',   bodySite: 'Lung',   atcCode: 'L01',   rtText: 'Palliative Radiotherapy',       deathYears: 1.2, progYears: 0.5,
    variants: [{ gene: 'TP53', variantType: 'missense_variant' }, { gene: 'MET', variantType: 'copy_number_gain' }, { gene: 'KRAS', variantType: 'missense_variant' }] },
  { id: 'sp89', gender: 'female', birthYear: 1944, t0: '2018-06-17', stage: 'Stage IV',   bodySite: 'Breast', atcCode: 'L01XC', surgeryText: 'Mastectomy', rtText: 'Palliative Radiotherapy', deathYears: 2.8, progYears: 1.2,
    variants: [{ gene: 'ERBB2', variantType: 'copy_number_gain' }, { gene: 'PIK3CA', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
  { id: 'sp90', gender: 'male',   birthYear: 1947, t0: '2017-11-08', stage: 'Stage IV',   bodySite: 'Colon',  atcCode: 'L01F',  rtText: 'Palliative Radiotherapy',       deathYears: 1.8, progYears: 0.8,
    variants: [{ gene: 'KRAS', variantType: 'missense_variant' }, { gene: 'BRAF', variantType: 'missense_variant' }, { gene: 'TP53', variantType: 'missense_variant' }] },
]

export const syntheticBundles: Bundle[] = ROSTER.map(makeBundle)

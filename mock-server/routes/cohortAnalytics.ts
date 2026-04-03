import type { Request, Response } from 'express'
import { mockBundle } from '../data/mockBundle.ts'
import { mockBundle2 } from '../data/mockBundle2.ts'
import {
  mockBundle3,
  mockBundle4,
  mockBundle5,
  mockBundle6,
  mockBundle7,
  mockBundle8,
  mockBundle9,
  mockBundle10,
} from '../data/mockBundlesExtra.ts'
import { syntheticBundles } from '../data/syntheticPatients.ts'
import { normalizeSurgeryLabel } from '../../src/config/cohortConfig.ts'
import type {
  CohortAnalyticsResponse,
  CohortFilters,
  GenderItem,
  AgeBinItem,
  StageItem,
  OncoPrintData,
  OncoPrintGene,
  TreatmentItem,
  KMPoint,
} from '../../src/types/cohortAnalytics.ts'

// ─── Bundle registry ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResource = Record<string, any>
type BundleEntry = { resource?: AnyResource }
type AnyBundle = { entry?: BundleEntry[] }

const ALL_BUNDLES: AnyBundle[] = [
  mockBundle, mockBundle2, mockBundle3, mockBundle4, mockBundle5,
  mockBundle6, mockBundle7, mockBundle8, mockBundle9, mockBundle10,
  // 30 lightweight synthetic patients (server-side only, never sent to client)
  ...syntheticBundles,
]

// ─── Resource helpers ─────────────────────────────────────────────────────────

function getResources(bundle: AnyBundle, type: string): AnyResource[] {
  return (bundle.entry ?? [])
    .map((e) => e.resource)
    .filter((r): r is AnyResource => r?.resourceType === type)
}

function getPatient(bundle: AnyBundle): AnyResource | null {
  return getResources(bundle, 'Patient')[0] ?? null
}

// ─── T0 computation (mirrors src/lib/t0.ts) ───────────────────────────────────

const T0_ANCHOR = 'http://carpem.fr/fhir/StructureDefinition/t0-anchor'

function computeT0(conditions: AnyResource[]): Date | null {
  const anchored = conditions.find((c) =>
    c.extension?.some((e: AnyResource) => e.url === T0_ANCHOR && e.valueBoolean === true),
  )
  if (anchored?.onsetDateTime) return new Date(anchored.onsetDateTime as string)

  const eligible = conditions.filter(
    (c) =>
      c.clinicalStatus?.coding?.some((x: AnyResource) => x.code === 'active') &&
      c.verificationStatus?.coding?.some((x: AnyResource) => x.code === 'confirmed') &&
      c.category?.some((cat: AnyResource) =>
        cat.coding?.some((x: AnyResource) => x.code === 'encounter-diagnosis'),
      ) &&
      c.onsetDateTime != null,
  )
  if (eligible.length === 0) return null
  const times = eligible.map((c) => new Date(c.onsetDateTime as string).getTime())
  return new Date(Math.min(...times))
}

// ─── Filter parsing ───────────────────────────────────────────────────────────

function parseFilters(query: Record<string, unknown>): CohortFilters {
  return {
    gender:   typeof query['gender']   === 'string' ? query['gender']   : undefined,
    stage:    typeof query['stage']    === 'string' ? query['stage']    : undefined,
    bodySite: typeof query['bodySite'] === 'string' ? query['bodySite'] : undefined,
    gene:     typeof query['gene']     === 'string' ? query['gene']     : undefined,
    code:     typeof query['code']     === 'string' ? query['code']     : undefined,
  }
}

// ─── Bundle-level filtering ───────────────────────────────────────────────────

function filterBundles(bundles: AnyBundle[], filters: CohortFilters): AnyBundle[] {
  return bundles.filter((bundle) => {
    const patient = getPatient(bundle)
    if (!patient) return false

    if (filters.gender && patient.gender !== filters.gender) return false

    if (filters.stage) {
      const obs = getResources(bundle, 'Observation')
      const hasStage = obs.some(
        (o) =>
          o.code?.coding?.some((c: AnyResource) => c.code === '21908-9' || c.code === '21902-2') &&
          (
            o.valueCodeableConcept?.coding?.some((c: AnyResource) =>
              (c.code ?? '').toUpperCase().includes(filters.stage!.toUpperCase()),
            ) ||
            (o.valueCodeableConcept?.text ?? '').toUpperCase().includes(filters.stage!.toUpperCase())
          ),
      )
      if (!hasStage) return false
    }

    if (filters.bodySite) {
      const conds = getResources(bundle, 'Condition')
      const hasBodySite = conds.some((c) =>
        c.bodySite?.some((bs: AnyResource) =>
          bs.coding?.some((x: AnyResource) =>
            (x.display ?? '').toLowerCase().includes(filters.bodySite!.toLowerCase()),
          ),
        ),
      )
      if (!hasBodySite) return false
    }

    if (filters.gene) {
      const obs = getResources(bundle, 'Observation')
      const hasGene = obs.some(
        (o) =>
          (
            o.category?.some((cat: AnyResource) =>
              cat.coding?.some((c: AnyResource) => c.code === 'genomic-variant'),
            ) ||
            o.code?.coding?.some((c: AnyResource) => c.code === '69548-6')
          ) &&
          o.component?.some(
            (comp: AnyResource) =>
              comp.code?.coding?.some((c: AnyResource) => c.code === '48018-6') &&
              (comp.valueCodeableConcept?.coding?.[0]?.display ?? '')
                .toLowerCase()
                .includes(filters.gene!.toLowerCase()),
          ),
      )
      if (!hasGene) return false
    }

    if (filters.code) {
      const conds = getResources(bundle, 'Condition')
      const hasCode = conds.some((c) =>
        c.code?.coding?.some((x: AnyResource) =>
          (x.code ?? '').toLowerCase().includes(filters.code!.toLowerCase()) ||
          (x.display ?? '').toLowerCase().includes(filters.code!.toLowerCase()),
        ) ||
        (c.code?.text ?? '').toLowerCase().includes(filters.code!.toLowerCase()),
      )
      if (!hasCode) return false
    }

    return true
  })
}

// ─── Gender aggregation ───────────────────────────────────────────────────────

function computeGender(bundles: AnyBundle[]): GenderItem[] {
  const counts: Record<string, number> = { female: 0, male: 0, other: 0, unknown: 0 }
  for (const bundle of bundles) {
    const p = getPatient(bundle)
    const g = (p?.gender as string | undefined) ?? 'unknown'
    counts[g in counts ? g : 'other'] = (counts[g in counts ? g : 'other'] ?? 0) + 1
  }
  return [
    { label: 'Female',  count: counts['female']  ?? 0 },
    { label: 'Male',    count: counts['male']    ?? 0 },
    { label: 'Other',   count: counts['other']   ?? 0 },
    { label: 'Unknown', count: counts['unknown'] ?? 0 },
  ].filter((i) => i.count > 0)
}

// ─── Age at diagnosis aggregation ────────────────────────────────────────────

const AGE_BINS = [
  { range: '≤29',   min: 0,  max: 29  },
  { range: '30–39', min: 30, max: 39  },
  { range: '40–49', min: 40, max: 49  },
  { range: '50–59', min: 50, max: 59  },
  { range: '60–69', min: 60, max: 69  },
  { range: '70–79', min: 70, max: 79  },
  { range: '80–89', min: 80, max: 89  },
  { range: '90+',   min: 90, max: 999 },
]

function computeAgeBins(bundles: AnyBundle[]): AgeBinItem[] {
  const binCounts = AGE_BINS.map((b) => ({ ...b, total: 0, sum: 0 }))
  for (const bundle of bundles) {
    const p = getPatient(bundle)
    if (!p?.birthDate) continue
    const conditions = getResources(bundle, 'Condition')
    const t0 = computeT0(conditions)
    if (!t0) continue
    const ageMs = t0.getTime() - new Date(p.birthDate as string).getTime()
    const age = Math.floor(ageMs / (365.25 * 24 * 3600 * 1000))
    const bin = binCounts.find((b) => age >= b.min && age <= b.max)
    if (bin) { bin.total++; bin.sum += age }
  }
  return binCounts.map(({ range, total, sum }) => ({
    range,
    count: total,
    meanAge: total > 0 ? Math.round((sum / total) * 10) / 10 : null,
  }))
}

// ─── Stage distribution ───────────────────────────────────────────────────────

const STAGE_ORDER = ['Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unknown']

function normaliseStage(raw: string): string {
  const up = raw.toUpperCase()
  if (up.includes('IV'))  return 'Stage IV'
  if (up.includes('III')) return 'Stage III'
  if (up.includes('II'))  return 'Stage II'
  if (up.includes('I'))   return 'Stage I'
  return 'Unknown'
}

function computeStages(bundles: AnyBundle[]): StageItem[] {
  const counts: Record<string, number> = {}
  for (const bundle of bundles) {
    const obs = getResources(bundle, 'Observation')
    const tnm = obs.find((o) =>
      o.code?.coding?.some((c: AnyResource) => c.code === '21908-9' || c.code === '21902-2'),
    )
    if (!tnm) { counts['Unknown'] = (counts['Unknown'] ?? 0) + 1; continue }
    const raw =
      tnm.valueCodeableConcept?.coding?.[0]?.display ??
      tnm.valueCodeableConcept?.text ??
      'Unknown'
    const stage = normaliseStage(raw as string)
    counts[stage] = (counts[stage] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => {
      const ia = STAGE_ORDER.indexOf(a.stage)
      const ib = STAGE_ORDER.indexOf(b.stage)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
}

// ─── OncoPrint matrix ─────────────────────────────────────────────────────────

const VARIANT_TYPE_LABELS: Record<string, string> = {
  missense_variant:           'Missense',
  frameshift_variant:         'Frameshift',
  stop_gained:                'Nonsense',
  splice_region_variant:      'Splice site',
  splice_site_variant:        'Splice site',
  copy_number_gain:           'CNV',
  copy_number_loss:           'CNV',
  inframe_deletion:           'In-frame deletion',
  inframe_insertion:          'In-frame insertion',
}

function computeOncoPrint(bundles: AnyBundle[]): OncoPrintData {
  // patientId → gene → Set<variantType>
  const patientGeneMap = new Map<string, Map<string, Set<string>>>()
  const patientOrder: string[] = []

  for (const bundle of bundles) {
    const patient = getPatient(bundle)
    const patientId = (patient?.id as string | undefined) ?? 'unknown'
    if (!patientGeneMap.has(patientId)) {
      patientGeneMap.set(patientId, new Map())
      patientOrder.push(patientId)
    }
    const geneMap = patientGeneMap.get(patientId)!

    const obs = getResources(bundle, 'Observation')
    // Match genomic-variant category OR LOINC 69548-6 (covers P1/P2 'laboratory' category)
    const variants = obs.filter((o) =>
      o.category?.some((cat: AnyResource) =>
        cat.coding?.some((c: AnyResource) => c.code === 'genomic-variant'),
      ) ||
      o.code?.coding?.some((c: AnyResource) => c.code === '69548-6'),
    )

    for (const v of variants) {
      const geneComp = v.component?.find((c: AnyResource) =>
        c.code?.coding?.some((x: AnyResource) => x.code === '48018-6'),
      )
      const gene: string = geneComp?.valueCodeableConcept?.coding?.[0]?.display ?? ''
      if (!gene) continue

      const typeComp = v.component?.find((c: AnyResource) =>
        c.code?.coding?.some((x: AnyResource) => x.code === '48019-4'),
      )
      const typeCode: string = typeComp?.valueCodeableConcept?.coding?.[0]?.code ?? 'other'
      const typeLabel = VARIANT_TYPE_LABELS[typeCode] ?? 'Other'

      if (!geneMap.has(gene)) geneMap.set(gene, new Set())
      geneMap.get(gene)!.add(typeLabel)
    }
  }

  // Determine gene display order by frequency (descending) — used for patient sort
  const geneFreq = new Map<string, number>()
  for (const gm of patientGeneMap.values()) {
    for (const gene of gm.keys()) geneFreq.set(gene, (geneFreq.get(gene) ?? 0) + 1)
  }
  const geneOrder = Array.from(geneFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([gene]) => gene)

  // Sort patients lexicographically by gene vector:
  // for each gene (most → least frequent), mutated patients come before unmutated.
  // Ties at every gene position preserve original bundle order.
  const sortedPatients = [...patientOrder].sort((a, b) => {
    const aMap = patientGeneMap.get(a)!
    const bMap = patientGeneMap.get(b)!
    for (const gene of geneOrder) {
      const diff = (bMap.has(gene) ? 1 : 0) - (aMap.has(gene) ? 1 : 0)
      if (diff !== 0) return diff
    }
    return 0
  })

  // Collect all unique genes across all patients
  const geneSet = new Set<string>()
  for (const gm of patientGeneMap.values()) {
    for (const gene of gm.keys()) geneSet.add(gene)
  }

  const total = bundles.length

  // Build gene rows aligned to sortedPatients, top 10 by alteration frequency
  const genes: OncoPrintGene[] = Array.from(geneSet)
    .map((gene) => {
      const alterations = sortedPatients.map((pid) => {
        const types = patientGeneMap.get(pid)?.get(gene)
        if (!types || types.size === 0) return null
        return Array.from(types).map((type) => ({ type }))
      })
      const alteredCount = alterations.filter(Boolean).length
      return {
        gene,
        pct: Math.round((alteredCount / total) * 1000) / 10,
        alterations,
      }
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10)

  return { patients: sortedPatients, genes }
}

// ─── Surgery mix ──────────────────────────────────────────────────────────────

// SNOMED codes for surgical procedures
const SURGERY_SNOMED = new Set(['387713003', '22633006', '172043006', '392021009'])

function computeSurgeryMix(bundles: AnyBundle[]): TreatmentItem[] {
  const counts: Record<string, number> = {}
  const patientSurgery = new Set<string>()

  for (const bundle of bundles) {
    const patient = getPatient(bundle)
    const patientId = (patient?.id as string | undefined) ?? 'unknown'
    const procs = getResources(bundle, 'Procedure')
    for (const p of procs) {
      const isSurgery =
        p.category?.coding?.some((c: AnyResource) =>
          SURGERY_SNOMED.has(c.code ?? '') ||
          (c.display ?? '').toLowerCase().includes('surgical') ||
          (c.display ?? '').toLowerCase().includes('surgery'),
        ) ?? false
      if (!isSurgery) continue
      const raw: string =
        p.code?.text ??
        p.code?.coding?.[0]?.display ??
        'Surgical procedure'
      const label = normalizeSurgeryLabel(raw)
      counts[label] = (counts[label] ?? 0) + 1
      patientSurgery.add(patientId)
    }
  }

  const total = bundles.length
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count, pct: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count)
}

// ─── Chemo mix ────────────────────────────────────────────────────────────────

function atcClass(code: string): string {
  if (code.startsWith('L01XC') || code.startsWith('L01FA')) return 'Targeted / mAb'
  if (code.startsWith('L01F'))  return 'Immunotherapy'
  if (code.startsWith('L02'))   return 'Hormone therapy'
  if (code.startsWith('L01'))   return 'Standard chemotherapy'
  return 'Other'
}

function computeChemoMix(bundles: AnyBundle[]): TreatmentItem[] {
  const patientClass = new Map<string, Set<string>>()

  for (const bundle of bundles) {
    const patient = getPatient(bundle)
    const patientId = (patient?.id as string | undefined) ?? 'unknown'
    const meds = getResources(bundle, 'MedicationAdministration')
    for (const m of meds) {
      const coding = m.medicationCodeableConcept?.coding ?? []
      const atcCode: string = coding.find((c: AnyResource) =>
        (c.system ?? '').includes('whocc') || (c.code ?? '').match(/^L\d/),
      )?.code ?? ''
      if (!atcCode) continue
      const cls = atcClass(atcCode)
      if (!patientClass.has(patientId)) patientClass.set(patientId, new Set())
      patientClass.get(patientId)!.add(cls)
    }
  }

  const counts: Record<string, number> = {}
  for (const classes of patientClass.values()) {
    for (const cls of classes) counts[cls] = (counts[cls] ?? 0) + 1
  }

  const total = bundles.length
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count, pct: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count)
}

// ─── RT mix ───────────────────────────────────────────────────────────────────

const RT_SNOMED = new Set(['108290001', '33195004', '229070002'])

function computeRtMix(bundles: AnyBundle[]): TreatmentItem[] {
  const counts: Record<string, number> = {}

  for (const bundle of bundles) {
    const procs = getResources(bundle, 'Procedure')
    for (const p of procs) {
      const isRT =
        p.category?.coding?.some((c: AnyResource) =>
          RT_SNOMED.has(c.code ?? '') ||
          (c.display ?? '').toLowerCase().includes('radiation') ||
          (c.display ?? '').toLowerCase().includes('radiother'),
        ) ?? false
      if (!isRT) continue
      const label: string =
        p.code?.text ??
        p.code?.coding?.[0]?.display ??
        'Radiotherapy'
      // Normalise long labels
      const short =
        label.includes('Adjuvant') ? 'Adjuvant Radiotherapy'
        : label.includes('Curative') ? 'Curative Radiotherapy'
        : label.includes('Palliative') ? 'Palliative Radiotherapy'
        : label.split('—')[0].trim()
      counts[short] = (counts[short] ?? 0) + 1
    }
  }

  const total = bundles.length
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count, pct: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count)
}

// ─── Kaplan-Meier ─────────────────────────────────────────────────────────────

interface SurvivalObs {
  timeYears: number
  event: boolean
}

function kaplanMeier(obs: SurvivalObs[]): KMPoint[] {
  if (obs.length === 0) return []
  const sorted = [...obs].sort((a, b) => a.timeYears - b.timeYears)

  const points: KMPoint[] = [{ t: 0, s: 1, ciLow: 1, ciHigh: 1, nAtRisk: sorted.length }]
  let s = 1
  let greenwoodSum = 0
  let nAtRisk = sorted.length
  let i = 0

  while (i < sorted.length) {
    const t = sorted[i].timeYears
    // Count events and censored at this time point
    let d = 0
    let c = 0
    while (i < sorted.length && sorted[i].timeYears === t) {
      if (sorted[i].event) d++; else c++
      i++
    }
    if (d > 0) {
      s = s * (1 - d / nAtRisk)
      greenwoodSum += d / (nAtRisk * (nAtRisk - d))
      const se = s * Math.sqrt(greenwoodSum)
      points.push({
        t: Math.round(t * 100) / 100,
        s:       Math.round(s * 1000) / 1000,
        ciLow:   Math.max(0, Math.round((s - 1.96 * se) * 1000) / 1000),
        ciHigh:  Math.min(1, Math.round((s + 1.96 * se) * 1000) / 1000),
        nAtRisk: nAtRisk - d - c,
      })
    }
    nAtRisk -= d + c
  }
  return points
}

function computeOsCurve(bundles: AnyBundle[]): KMPoint[] {
  const TODAY = new Date()
  const obs: SurvivalObs[] = []
  for (const bundle of bundles) {
    const p = getPatient(bundle)
    if (!p) continue
    const t0 = computeT0(getResources(bundle, 'Condition'))
    if (!t0) continue
    const deceased = p.deceasedDateTime as string | undefined
    const eventDate = deceased ? new Date(deceased) : TODAY
    const timeYears = (eventDate.getTime() - t0.getTime()) / (365.25 * 24 * 3600 * 1000)
    obs.push({ timeYears, event: !!deceased })
  }
  return kaplanMeier(obs)
}

function computePfsCurve(bundles: AnyBundle[]): KMPoint[] {
  const TODAY = new Date()
  const obs: SurvivalObs[] = []
  for (const bundle of bundles) {
    const p = getPatient(bundle)
    if (!p) continue
    const t0 = computeT0(getResources(bundle, 'Condition'))
    if (!t0) continue

    // First progression event: Observation with LOINC 21976-6 (RECIST PD)
    const progObs = getResources(bundle, 'Observation')
      .filter((o) => o.code?.coding?.some((c: AnyResource) => c.code === '21976-6'))
      .map((o) => new Date((o.effectiveDateTime ?? o.effectivePeriod?.start ?? '') as string))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    const deceased = p.deceasedDateTime as string | undefined
    const deathDate = deceased ? new Date(deceased) : null

    // PFS event = first of: progression or death
    const eventDate =
      progObs[0] && deathDate
        ? progObs[0] < deathDate ? progObs[0] : deathDate
        : progObs[0] ?? deathDate

    const isEvent = !!(progObs[0] || deathDate)
    const endDate = eventDate ?? TODAY
    const timeYears = (endDate.getTime() - t0.getTime()) / (365.25 * 24 * 3600 * 1000)
    obs.push({ timeYears, event: isEvent })
  }
  return kaplanMeier(obs)
}

// ─── Sample availability ──────────────────────────────────────────────────────

function computeSampleStats(bundles: AnyBundle[]): { sampleCount: number; samplePatientCount: number } {
  let sampleCount = 0
  let samplePatientCount = 0
  for (const bundle of bundles) {
    const specimens = getResources(bundle, 'Specimen')
    if (specimens.length > 0) {
      sampleCount += specimens.length
      samplePatientCount++
    }
  }
  return { sampleCount, samplePatientCount }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export function handleCohortAnalytics(req: Request, res: Response): void {
  const filters = parseFilters(req.query as Record<string, unknown>)
  const phase = (req.query['phase'] as string | undefined) ?? 'full'
  const bundles = filterBundles(ALL_BUNDLES, filters)
  const n = bundles.length

  const demographics: Pick<CohortAnalyticsResponse, 'n' | 'gender' | 'ageBins' | 'stages'> = {
    n,
    gender:   computeGender(bundles),
    ageBins:  computeAgeBins(bundles),
    stages:   computeStages(bundles),
  }

  if (phase === 'demographics') {
    res.json(demographics)
    return
  }

  const full: CohortAnalyticsResponse = {
    ...demographics,
    oncoPrint:  computeOncoPrint(bundles),
    surgeryMix: computeSurgeryMix(bundles),
    chemoMix:   computeChemoMix(bundles),
    rtMix:      computeRtMix(bundles),
    osCurve:    computeOsCurve(bundles),
    pfsCurve:   computePfsCurve(bundles),
    ...computeSampleStats(bundles),
  }

  res.json(full)
}

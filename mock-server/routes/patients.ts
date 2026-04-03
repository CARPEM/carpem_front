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

// ─── Bundle registry ──────────────────────────────────────────────────────────

const BUNDLES = [
  mockBundle,
  mockBundle2,
  mockBundle3,
  mockBundle4,
  mockBundle5,
  mockBundle6,
  mockBundle7,
  mockBundle8,
  mockBundle9,
  mockBundle10,
]

/** Extract the Patient resource from a bundle. */
function getPatient(bundle: (typeof BUNDLES)[number]) {
  return bundle.entry?.find((e) => e.resource?.resourceType === 'Patient')?.resource ?? null
}

/** Map patient ID → bundle (built once at startup). */
const BUNDLE_BY_ID = new Map(
  BUNDLES.map((b) => {
    const patient = getPatient(b)
    return [patient?.id ?? '', b] as const
  }),
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notFound(res: Response, id: string): void {
  res.status(404).json({
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity: 'error',
        code: 'not-found',
        diagnostics: `Patient/${id} not found`,
      },
    ],
  })
}

function baseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}/fhir/R4`
}

// ─── GET /fhir/R4/Patient ─────────────────────────────────────────────────────

export function handlePatientList(req: Request, res: Response): void {
  const patients = BUNDLES.map((b) => {
    const patient = getPatient(b)
    return {
      fullUrl: `${baseUrl(req)}/Patient/${patient?.id ?? ''}`,
      resource: patient,
    }
  }).filter((e) => e.resource != null)

  res.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: patients.length,
    link: [{ relation: 'self', url: `${baseUrl(req)}/Patient` }],
    entry: patients,
  })
}

// ─── GET /fhir/R4/Patient/:id ─────────────────────────────────────────────────

export function handlePatientRead(req: Request, res: Response): void {
  const bundle = BUNDLE_BY_ID.get(req.params['id'] ?? '')
  if (!bundle) { notFound(res, req.params['id'] ?? ''); return }

  const patient = getPatient(bundle)
  if (!patient) { notFound(res, req.params['id'] ?? ''); return }

  res.json(patient)
}

// ─── GET /fhir/R4/Patient/:id/$everything ────────────────────────────────────

export function handleEverything(req: Request, res: Response): void {
  const id = req.params['id'] ?? ''
  const bundle = BUNDLE_BY_ID.get(id)
  if (!bundle) { notFound(res, id); return }

  const count = Math.max(1, parseInt(String(req.query['_count'] ?? '100'), 10) || 100)
  const page  = Math.max(1, parseInt(String(req.query['_page']  ?? '1'),   10) || 1)

  const allEntries = bundle.entry ?? []
  const totalEntries = allEntries.length
  const totalPages = Math.ceil(totalEntries / count)
  const start = (page - 1) * count
  const pageEntries = allEntries.slice(start, start + count)

  const selfUrl = `${baseUrl(req)}/Patient/${id}/$everything?_count=${count}&_page=${page}`
  const nextUrl = `${baseUrl(req)}/Patient/${id}/$everything?_count=${count}&_page=${page + 1}`

  const link: { relation: string; url: string }[] = [
    { relation: 'self', url: selfUrl },
  ]
  if (page < totalPages) {
    link.push({ relation: 'next', url: nextUrl })
  }

  res.json({
    resourceType: 'Bundle',
    type: 'collection',
    total: totalEntries,
    link,
    entry: pageEntries,
  })
}

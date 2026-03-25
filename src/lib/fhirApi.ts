import type { FhirBundle, FhirPatient } from '@/types/fhir'

const BASE_URL = (import.meta.env['VITE_FHIR_BASE_URL'] as string | undefined) ?? 'http://localhost:3001/fhir/R4'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/fhir+json' } })
  if (!res.ok) throw new Error(`FHIR request failed: ${res.status} ${res.statusText} (${url})`)
  return res.json() as Promise<T>
}

// Module-level cache — patient list is static for the session; avoids a network
// round-trip every time the user navigates to PatientView.
let _patientListCache: FhirPatient[] | null = null

/** Fetch all Patient resources from GET /Patient (searchset Bundle). */
export async function fetchPatientList(): Promise<FhirPatient[]> {
  if (_patientListCache) return _patientListCache
  const bundle = await fetchJson<FhirBundle>(`${BASE_URL}/Patient`)
  _patientListCache = (bundle.entry ?? [])
    .map((e) => e.resource)
    .filter((r): r is FhirPatient => r?.resourceType === 'Patient')
  return _patientListCache
}

/**
 * Fetch a complete $everything Bundle for one patient, following Bundle.link[next]
 * pagination until all pages are retrieved. Returns a synthetic Bundle with all
 * entries merged — ready to pass directly to patientStore.loadBundle().
 */
export async function fetchPatientEverything(patientId: string): Promise<FhirBundle> {
  const allEntries: FhirBundle['entry'] = []
  let nextUrl: string | undefined = `${BASE_URL}/Patient/${patientId}/$everything`

  while (nextUrl) {
    const page = await fetchJson<FhirBundle>(nextUrl)
    allEntries.push(...(page.entry ?? []))
    nextUrl = page.link?.find((l) => l.relation === 'next')?.url
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    total: allEntries.length,
    entry: allEntries,
  }
}

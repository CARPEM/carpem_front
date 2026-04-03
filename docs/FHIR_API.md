# CARPEM CMOT — FHIR API Reference

> Documents all FHIR endpoints consumed by the web application (`src/`).
> Does not cover the mock server implementation.

Base URL: `http://localhost:3001/fhir/R4` (dev default)
Configurable via environment variable `VITE_FHIR_BASE_URL`.

---

## Endpoints overview

| # | Method | Path | Used by | When |
|---|--------|------|---------|------|
| 1 | `GET` | `/Patient` | `PatientRedirect`, `PatientView` | App init / Patient view mount |
| 2 | `GET` | `/Patient/:id/$everything` | `PatientView` | On patient ID change (URL param) |
| 3 | `GET` | `/cohort/analytics` | `CohortView` (via Zustand store) | Cohort view mount + every filter change |

---

## 1. `GET /Patient`

**Client function:** `fetchPatientList()` — [`src/lib/fhirApi.ts`](../src/lib/fhirApi.ts)

### Request

```
GET /fhir/R4/Patient
Accept: application/fhir+json
```

No query parameters.

### Response

FHIR `Bundle` (type `searchset`).
Only `Patient` resources are extracted from `bundle.entry[*].resource`.

```ts
// Extracted type
FhirPatient[]   // fhir4.Patient
```

Fields used by the app:

| Field | Usage |
|-------|-------|
| `id` | Route param `/patient/:id`, dropdown `<option value>` |
| `identifier[use=official].value` | Patient label in the switcher dropdown |

### Call sites

| File | Trigger |
|------|---------|
| [`src/App.tsx:15`](../src/App.tsx) — `PatientRedirect` | On mount at `/patient`; redirects to `/patient/{first id}` |
| [`src/views/PatientView.tsx:28`](../src/views/PatientView.tsx) | On mount; populates the patient switcher `<select>` |

### Caching

Result is cached at module level in `fhirApi.ts` (`_patientListCache`).
A second call within the same session returns the cached list without a network round-trip.

---

## 2. `GET /Patient/:id/$everything`

**Client function:** `fetchPatientEverything(patientId)` — [`src/lib/fhirApi.ts`](../src/lib/fhirApi.ts)

### Request

```
GET /fhir/R4/Patient/{id}/$everything
Accept: application/fhir+json
```

No explicit query parameters sent by the client.
The server may support `_count` / `_page` for pagination (handled transparently).

### Pagination

The function follows `Bundle.link[relation="next"].url` in a `while` loop until no further page exists.
All entries are merged into a single synthetic `Bundle` before being passed to the store.

```ts
// Simplified implementation
let nextUrl = `${BASE_URL}/Patient/${id}/$everything`
while (nextUrl) {
  const page = await fetchJson(nextUrl)
  allEntries.push(...page.entry)
  nextUrl = page.link?.find(l => l.relation === 'next')?.url
}
```

### Response

All entries from all pages are merged. The returned synthetic bundle is passed directly to
`usePatientStore.loadBundle()` ([`src/store/patient.ts`](../src/store/patient.ts)).

Each FHIR resource type is extracted and stored in a dedicated store field:

| Resource type | Store field | Used by |
|---------------|-------------|---------|
| `Patient` | `patient` | `PatientIdentifier` widget, T0 |
| `Condition` | `conditions` | T0 computation, `KeyEventsLane`, `PatientIdentifier` |
| `Observation` | `observations` | `BiomarkerSparklines`, `KeyEventsLane` (staging/progression), `PatientIdentifier` (stage) |
| `MedicationAdministration` | `medicationAdministrations` | `SystemicTherapyLane` |
| `MedicationRequest` | `medicationRequests` | `SystemicTherapyLane` (prophylactic) |
| `Procedure` | `procedures` | `RadioSurgeryLane`, `ProcedureDrawer` |
| `ImagingStudy` | `imagingStudies` | `ImagingLane` |
| `DiagnosticReport` | `diagnosticReports` | `MolecularPanel` |
| `Specimen` | `specimens` | `BiobankingLane`, `MolecularPanel` |
| `DocumentReference` | `documents` | `ClinicalNotes` widget |
| `Encounter` | `encounters` | `HospitalizationsLane` |

T0 is computed from `conditions` immediately in `loadBundle()` via `computeT0()` ([`src/lib/t0.ts`](../src/lib/t0.ts)).

### Call site

| File | Trigger |
|------|---------|
| [`src/views/PatientView.tsx:38`](../src/views/PatientView.tsx) | `useEffect` on `:id` URL param change |

---

## 3. `GET /cohort/analytics`

**Client function:** `fetchCohortAnalytics(filters, phase)` — [`src/lib/cohortApi.ts`](../src/lib/cohortApi.ts)

### Request

```
GET /fhir/R4/cohort/analytics?phase=full[&gender=…][&stage=…][&bodySite=…][&gene=…][&code=…]
Accept: application/json
```

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `phase` | `'demographics' \| 'full'` | `demographics` returns only Row 1 data (fast). `'full'` returns everything. Default: `'full'`. |
| `gender` | `string` | Filter by `Patient.gender` (e.g. `male`, `female`) |
| `stage` | `string` | Filter by cancer stage (substring match on TNM Observation value) |
| `bodySite` | `string` | Filter by tumour location (substring match on `Condition.bodySite`) |
| `gene` | `string` | Filter to patients with a mutation in the named gene |
| `code` | `string` | Filter by `Condition.code` (cancer type) |

Parameters are omitted from the request when their filter value is `undefined`.
All active filters are combined as logical **AND** on the server.

### Response

Type: `CohortAnalyticsResponse` — [`src/types/cohortAnalytics.ts`](../src/types/cohortAnalytics.ts)

```ts
interface CohortAnalyticsResponse {
  /** Number of patients matching the current filters */
  n: number

  // ── Row 1: Demographics ───────────────────────────────────────
  gender:   GenderItem[]   // [{ label: 'Female'|'Male'|'Other'|'Unknown', count }]
  ageBins:  AgeBinItem[]   // [{ range: '≤29'|'30–39'|…|'90+', count, meanAge }]
  stages:   StageItem[]    // [{ stage: 'Stage I'|'II'|'III'|'IV'|'Unknown', count }]

  // ── Row 2: OncoPrint ─────────────────────────────────────────
  oncoPrint: {
    patients: string[]       // Display IDs, ordered most-altered first
    genes: OncoPrintGene[]   // Top 10 genes by alteration frequency
  }
  // OncoPrintGene: { gene, pct, alterations: (OncoPrintAlteration[] | null)[] }
  // OncoPrintAlteration: { type }   e.g. 'Missense', 'Frameshift', 'Nonsense', …

  // ── Row 3: Survival curves ───────────────────────────────────
  osCurve:  KMPoint[]   // Overall Survival (Kaplan-Meier)
  pfsCurve: KMPoint[]   // Progression-Free Survival
  // KMPoint: { t (years), s (0–1), ciLow, ciHigh, nAtRisk }

  // ── Row 3: Treatment mix ─────────────────────────────────────
  surgeryMix: TreatmentItem[]   // Surgical procedure categories
  chemoMix:   TreatmentItem[]   // Chemotherapy regimen classes
  rtMix:      TreatmentItem[]   // Radiotherapy type categories
  // TreatmentItem: { category, count, pct }

  // ── Biobanking summary ───────────────────────────────────────
  sampleCount:        number   // Total Specimen resources in filtered cohort
  samplePatientCount: number   // Patients with ≥1 Specimen
}
```

### Call sites

All calls go through `useCohortStore.fetchAnalytics()` ([`src/store/cohort.ts`](../src/store/cohort.ts)).
Components never call `fetchCohortAnalytics()` directly.

| Store action | Trigger | View |
|--------------|---------|------|
| `setFilters(filters)` | Mount of `CohortView` — restores URL params | [`src/views/CohortView.tsx:104`](../src/views/CohortView.tsx) |
| `setFilter(key, value)` | User selects gender/stage/bodySite/gene in left panel or title bar | `CohortLeftPanel`, `CohortView` title bar |
| `resetFilters()` | User clicks "Reset Filters" | `CohortLeftPanel` |

Every action above calls `fetchAnalytics()` which fires a new `GET /cohort/analytics` request.
The store holds the latest response in `analytics: CohortAnalyticsResponse | null`.

### Consumed by

| Component | Field(s) read |
|-----------|---------------|
| Title bar (`CohortView`) | `analytics.n` |
| `GenderDistribution` | `analytics.gender` |
| `AgeAtDiagnosis` | `analytics.ageBins` |
| `CancerStageDistribution` | `analytics.stages` |
| `KeySomaticMutations` (OncoPrint) | `analytics.oncoPrint` |
| `OverallSurvivalKM` | `analytics.osCurve` |
| `ProgressionFreeSurvivalKM` | `analytics.pfsCurve` |
| `SurgeryMix` | `analytics.surgeryMix` |
| `ChemotherapyMix` | `analytics.chemoMix` |
| `RadiotherapyMix` | `analytics.rtMix` |
| Available Samples widget | `analytics.sampleCount`, `analytics.samplePatientCount` |

### URL state

Active filters are mirrored to URL query params (`?gender=&stage=&bodySite=&gene=`) via `useSearchParams` with `{ replace: true }`, enabling shareable links without adding browser history entries.
No patient identifiers (PHI) appear in the URL — only aggregate filter values.

---

## Filter state (`CohortFilters`)

```ts
interface CohortFilters {
  gender?:   string   // Patient.gender value
  stage?:    string   // Cancer stage substring
  bodySite?: string   // Condition.bodySite substring / Cohort Type selector
  gene?:     string   // Gene name substring
  code?:     string   // Condition.code substring (cancer type)
}
```

`bodySite` is shared between the **Cohort Type selector** (title bar dropdown) and the **Tumour Location** text input in the left panel — both write the same filter key.

---

## Error handling

Both client functions (`fetchPatientList`, `fetchPatientEverything`, `fetchCohortAnalytics`) throw a descriptive `Error` on non-2xx HTTP status.

- `PatientView` catches errors into a local `error` state → renders a red banner.
- `useCohortStore.fetchAnalytics()` catches errors into `store.error` → `ChartPanel` renders an error state.

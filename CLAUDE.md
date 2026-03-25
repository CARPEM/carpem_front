# CARPEM CMOT — Clinical Dashboard

## Project purpose
FHIR R4-based read-only clinical dashboard for oncologists and data managers at CARPEM.
Two views share the same app:
- **Cohort Analytics Dashboard** (`/cohort`) — aggregate statistics and OncoPrint for the full trial or a tumour-site sub-cohort.
- **Patient 360° Profile** (`/patient/:id`) — full longitudinal oncology trajectory for a single patient.

Data source: CARPEM EDS RESTful API (`GET /fhir/R4/Patient/{id}/$everything`, `GET /fhir/R4/cohort/analytics`).
During development: mock FHIR R4 server (`mock-server/`) running on port 3001, serving 10 named patients + 90 synthetic cohort patients.

## Tech stack
- **Framework**: React 19 + TypeScript 5 (Vite 6)
- **Routing**: React Router v6 — `/cohort` → CohortView, `/patient/:id` → PatientView, `/` → `/cohort`
- **Timeline visualisation**: D3 v7 (zoom, pan, SVG swim-lanes, Kaplan-Meier curves)
- **Charts**: Recharts (bar, donut, treatment mix), custom SVG (OncoPrint)
- **Global state**: Zustand v5 — see store files below
- **Styling**: Tailwind CSS v3
- **FHIR types**: `@types/fhir` — use `fhir4.*` namespace
- **HTTP**: native `fetch`

---

## Cohort Analytics Dashboard

### Layout (1920×1080 target, no page scroll)
```
┌─ Left Panel (~20%) ──┬─ Main Grid (~80%) ──────────────────────────────────────┐
│ Reset Filters        │ Row 1 (28%): [Gender] [Age at DX] [Stage]               │
│ Cohort Summary N=X   ├─────────────────────────────────────────────────────────┤
│ Filter by Mutations  │ Row 2 (32%): [OncoPrint — full width]                   │
│  └ Tumour Location   ├─────────────────────────────────────────────────────────┤
│  └ Gene              │ Row 3 (flex): [OS] [PFS] [Surgery] [Chemo] [RT]         │
│ Gender filter        │                                                          │
│ Stage filter         │                                                          │
└──────────────────────┴─────────────────────────────────────────────────────────┘
```

Shell: `src/views/CohortView.tsx`. Left panel: `src/components/cohort/CohortLeftPanel.tsx`.

### Per-site configuration (`src/config/cohortConfig.ts`)
Defines `genesOfInterest`, `surgeryTypes`, `chemoTypes` per body site (Full Trial / Breast / Ovarian / Colorectal / Lung). Read by `getActiveCohortConfig(bodySite)`.
- `genesOfInterest` → pinned at top of OncoPrint with amber dot marker, bold label
- `surgeryTypes` / `chemoTypes` → define sort order of mix bar charts
- `normalizeSurgeryLabel()` → maps verbose FHIR procedure texts to canonical names (used server-side)

### OncoPrint (`src/components/cohort/charts/KeySomaticMutations.tsx`)
Gene × patient SVG matrix.
- **Rows**: top 10 genes by alteration frequency; GOI pinned first (config order); rest sorted by pct desc.
- **Columns**: one per patient, sorted lexicographically by mutation vector (most-frequent gene → most altered patients first, recursively). Sort happens server-side in `computeOncoPrint`.
- **Cells**: coloured by variant type (`VARIANT_COLORS`); multi-alteration cells split vertically; unaltered = `#F3F4F6`.
- **Summary bar** (top): per-patient total alteration count across all genes.
- **Interactions**: hover → tooltip (gene, patient#, type); click gene row → `setFilter('gene')`.
- **Search**: `MutationSearch` component exported for use in `ChartPanel.headerRight`.

### Filters & URL state
All filters apply as logical AND. State lives in `useCohortStore` (`src/store/cohort.ts`).
URL params (`?gender=&stage=&bodySite=&gene=`) restored on mount via `setFilters()`, synced on change via `{ replace: true }`.

Cohort Type selector in title bar writes `filters.bodySite` (same field as Tumour Location input).

### Server-side analytics (`mock-server/routes/cohortAnalytics.ts`)
- `filterBundles()` — applies gender/stage/bodySite/gene filters; variant detection uses `genomic-variant` category OR LOINC `69548-6`
- `computeOncoPrint()` — patient × gene matrix, lexicographic patient sort
- `kaplanMeier()` — product-limit estimator with Greenwood's 95% CI
- `normalizeSurgeryLabel()` — imported from `src/config/cohortConfig.ts`
- Stage normalised to 4 buckets (I/II/III/IV)
- `?phase=demographics` returns only Row 1 data; `?phase=full` returns everything

---

## Patient 360° Profile

### Layout (1920×1080 target, min 1440×900)
Three-column layout, all panels full height, no page scroll.

| Panel  | Width | File | Content |
|--------|-------|------|---------|
| Left   | ~18%  | `src/components/panels/LeftPanel.tsx` | PatientIdentifierWidget + ClinicalNotesWidget |
| Centre | ~57%  | `src/components/panels/CentrePanel.tsx` | LongitudinalTimeline (D3) |
| Right  | ~25%  | `src/components/panels/RightPanel.tsx` | MolecularPanel + BiomarkerSparklines |

### T0 computation (`src/lib/t0.ts`)
- Override: Condition with extension `http://carpem.fr/fhir/StructureDefinition/t0-anchor` (valueBoolean: true).
- Default: earliest Condition.onsetDateTime where category=encounter-diagnosis, clinicalStatus=active, verificationStatus=confirmed.
- All X-axis positions = (event.date − T0) in days ÷ 30.44 → months.

### Timeline time axis
- Unit: months from T0. Default view: T0 to current date + 6 months.
- Labels at: DX (Year 0), Month 1, Year 1, Month 18, Year 2, Month 30, Year 3, Current Date, Year 4+.
- Zoom: +/− buttons or scroll wheel. Min: 1 month/100px. Max: full range.
- Pan: click-drag. Clamps: T0−3 months to T_current+6 months.
- Zoom/pan state: `useTimelineStore` (Zustand). URL params: `?zoom=N&offset=M`.

### Timeline swim-lane rows (Centre panel)
1. **Key Events & Diagnosis** — Condition + Procedure(diagnostic). DX flag = teal (`#0D9488`). Progression = red (`#DC2626`).
2. **Systemic Therapy** — MedicationAdministration / MedicationRequest. Horizontal bars, colour by ATC drug class:
   - Chemo (L01): `#4A7FB5` | Targeted/mAb (L01XC): `#2E7D4F` | Hormone (L02): `#D97706` | Immunotherapy (L01F): `#7B4FBC`
   - Dashed bar = prophylactic intent.
3. **Radiotherapy & Surgery** — Procedure. Surgery: scalpel SVG icon. RT: filled rectangle over duration period.
4. **Imaging & Procedures** — ImagingStudy. Downward triangle at acquisition date.
5. **Biobanking Samples** — Specimen. Icon shape = sample type (tube/vial/funnel). Colour = context (baseline=teal, on-treatment=blue, at-progression=red).
6. **Hospitalisations** — Encounter (class IMP). Yellow bars (`#FFBB00`).

### Interactions
- Hover any marker → tooltip (resource type, absolute date, T-relative label, primary label).
- Click imaging marker → floating card (DICOM thumbnails — not yet implemented).
- Click specimen → loads Molecular Panel.
- Click procedure → side-drawer with full Procedure details.
- Temporal label format: Δ<30d → "[Day N]"; Δ<365d → "[Month N]"; else → "[Year Y.M]".

### Right panel
- **Molecular Panel**: context-sensitive (updates on specimen click). Default = most recent biopsy.
  - Mutation table: Gene (coloured bg) | p. | c. | VAF, sorted by VAF desc, max 8 rows.
- **Biomarker Sparklines**: Observation (category=laboratory), ordered by effectiveDateTime.
  - Each biomarker = one line chart, full panel width. Shares X-axis zoom/pan with main timeline (`useTimelineStore`).
  - Reference line = Observation.referenceRange.high. Values > range → red; normal → blue.

---

## FHIR resource types used
Patient, Condition, Encounter, MedicationAdministration, MedicationRequest, Procedure,
ImagingStudy, DiagnosticReport, Observation, Specimen, DocumentReference.

---

## Folder structure
```
mock-server/              Standalone Express FHIR R4 server (port 3001)
  server.ts               Entry point — Express app, CORS, routes
  routes/
    metadata.ts           GET /fhir/R4/metadata → CapabilityStatement
    patients.ts           GET /Patient, /Patient/:id, /Patient/:id/$everything
    cohortAnalytics.ts    GET /cohort/analytics — all aggregation server-side
  data/
    syntheticPatients.ts  90 lightweight bundles (cohort only, never sent to client)
  package.json            express, cors, tsx
  tsconfig.json           NodeNext, paths @/* → ../src/*

src/
  views/
    CohortView.tsx        Cohort Analytics Dashboard page + MainGrid
    PatientView.tsx       Patient 360° page
  config/
    cohortConfig.ts       COHORT_CONFIG, SURGERY_ALIASES, normalizeSurgeryLabel(), getActiveCohortConfig()
  components/
    layout/               AppShell (nav tabs + patient dropdown)
    panels/               LeftPanel, CentrePanel, RightPanel
    cohort/
      ChartPanel.tsx      Reusable panel frame (title, subtitle, headerRight, loading, error)
      CohortLeftPanel.tsx Filter sidebar
      charts/
        GenderDistribution.tsx
        AgeAtDiagnosis.tsx
        CancerStageDistribution.tsx
        KeySomaticMutations.tsx   OncoPrint SVG + MutationSearch export
        KMChart.tsx               Shared D3 KM component (step function + CI band)
        OverallSurvivalKM.tsx
        ProgressionFreeSurvivalKM.tsx
        SurgeryMix.tsx
        ChemotherapyMix.tsx
        RadiotherapyMix.tsx
        TreatmentBarChart.tsx     Shared Recharts bar for mix panels
    timeline/             TimelineCanvas, TimeAxis, SwimLaneRow, lanes/*, TooltipOverlay, CursorLine, ZoomControls
    widgets/              PatientIdentifier, ClinicalNotes, MolecularPanel, BiomarkerSparklines
    ui/                   SideDrawer, ProcedureDrawer
  store/
    timeline.ts           useTimelineStore — zoom/pan shared between timeline and sparklines
    patient.ts            usePatientStore — FHIR resources + T0
    selection.ts          useSelectionStore — selectedSpecimenId, selectedProcedureId
    cohort.ts             useCohortStore — filters, analytics, fetchAnalytics, setFilter, setFilters, resetFilters
  lib/
    t0.ts                 computeT0(), toMonthsFromT0()
    fhirApi.ts            fetchPatientList(), fetchPatientEverything()
    cohortApi.ts          fetchCohortAnalytics(filters, phase)
    formatters.ts         formatDate(), formatTemporalLabel()
    bundleUtils.ts        getResources<K>(), getPatient()
  types/
    fhir.ts               Re-exports fhir4.* + MonthsFromT0
    cohortAnalytics.ts    CohortAnalyticsResponse, OncoPrintData, OncoPrintGene, CohortFilters, KMPoint, …
  data/
    mockBundle.ts         Patient 1
    mockBundle2.ts        Patient 2
    mockBundlesExtra.ts   Patients 3–10
```

## Kanban boards
- `TASKS.md` — Patient 360° feature board.
- `COHORT_TASKS.md` — Cohort Analytics Dashboard board.
- `FHIR_TASKS.md` — mock FHIR server board.

## Commands
```bash
# Web app (Vite dev server — port 5173)
npm run dev
npm run typecheck          # run after every non-trivial change
npm run build

# Mock FHIR server (port 3001) — must be running for the app to load data
cd mock-server && npm start

# Environment
cp .env.example .env       # set VITE_FHIR_BASE_URL if the server runs elsewhere
```

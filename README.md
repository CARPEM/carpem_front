# CARPEM CMOT — Clinical Dashboard

FHIR R4 read-only clinical dashboard for oncologists and data managers at CARPEM (Cancer Research for Personalized Medicine). Two complementary views share the same application:

| View | Route | Purpose |
|------|-------|---------|
| **Cohort Analytics** | `/cohort` | Aggregate statistics and OncoPrint for the full trial or a tumour-site sub-cohort |
| **Patient 360°** | `/patient/:id` | Full longitudinal oncology trajectory for a single patient |

---

## Getting started

Two processes must run simultaneously: the mock FHIR server and the Vite dev server.

```bash
# 1 — Mock FHIR server (port 3001)
cd mock-server
npm install
npm start

# 2 — Web app (port 5173), in a separate terminal
npm install
npm run dev
```

Open http://localhost:5173. The app defaults to the Cohort view. Switch to a patient via the top nav.

```bash
npm run typecheck   # TypeScript check — run after every non-trivial change
npm run build       # production build
npm run preview     # preview production build locally
```

Minimum display resolution: 1440 × 900. Optimised for 1920 × 1080.

---

## Environment

Copy `.env.example` to `.env` to override the FHIR server base URL:

```bash
cp .env.example .env
# VITE_FHIR_BASE_URL=http://localhost:3001/fhir/R4
```

---

## Cohort Analytics Dashboard

Three-row grid layout displaying aggregate statistics across the cohort.

### Layout

```
┌─ Left Panel (~20%) ──┬─ Main Grid (~80%) ──────────────────────────────────────┐
│ Reset Filters        │ Row 1: [Gender Distribution] [Age at DX] [Stage]         │
│ Cohort Summary N=X   ├─────────────────────────────────────────────────────────┤
│ Filter by Mutations  │ Row 2: [Key Somatic Mutations — OncoPrint, full width   ]│
│  └ Tumour Location   ├─────────────────────────────────────────────────────────┤
│  └ Gene              │ Row 3: [OS] [PFS] [Surgery Mix] [Chemo Mix] [RT Mix]    │
│ Gender filter        │                                                          │
│ Stage filter         └─────────────────────────────────────────────────────────┘
└──────────────────────┘
```

### Charts

| Panel | Type | Data source |
|-------|------|-------------|
| Gender Distribution | Donut (Recharts) | `analytics.gender` |
| Age at Diagnosis | Bar chart (Recharts) | `analytics.ageBins` |
| Cancer Stage Distribution | Bar chart (Recharts) | `analytics.stages` |
| Key Somatic Mutations | OncoPrint (SVG) | `analytics.oncoPrint` |
| Overall Survival | Step curve (D3) | `analytics.osCurve` |
| Progression-Free Survival | Step curve (D3) | `analytics.pfsCurve` |
| Surgery Mix | Bar chart (Recharts) | `analytics.surgeryMix` |
| Chemotherapy Mix | Bar chart (Recharts) | `analytics.chemoMix` |
| Radiotherapy Mix | Bar chart (Recharts) | `analytics.rtMix` |

### OncoPrint

The Key Somatic Mutations panel renders a gene × patient matrix:

- **Rows** — top 10 genes by alteration frequency; genes of interest (per tumour site) pinned to the top with an amber dot marker
- **Columns** — one column per patient, sorted lexicographically by mutation status (most-frequent gene first, mutated before unaltered, recursively)
- **Cells** — coloured by variant type; multi-alteration cells split vertically; unaltered = light grey
- **Summary bar** — per-patient alteration burden shown above the matrix
- **Interactions** — hover for gene/patient tooltip; click gene row to filter cohort by gene

### Filters

All filters apply as logical AND and trigger an immediate server re-query. Filter state is persisted in the URL (`?gender=&stage=&bodySite=&gene=`).

| Filter | Values |
|--------|--------|
| Cohort Type (top bar) | Full Trial / Breast / Ovarian / Colorectal / Lung |
| Tumour Location | Free-text body site |
| Gene | Free-text gene symbol |
| Gender | Female / Male / Other |
| Stage | I / II / III / IV |

### Per-site clinical configuration (`src/config/cohortConfig.ts`)

Defines genes of interest, surgery categories, and chemotherapy classes for each tumour site. Surgery labels are normalised server-side via `normalizeSurgeryLabel()` using an alias map.

---

## Patient 360° View

### Architecture overview

```
App.tsx
└── AppShell             top nav — Cohort / Patient 360° tabs + patient dropdown
    ├── LeftPanel (~18%)
    │   ├── PatientIdentifier
    │   └── ClinicalNotes
    ├── CentrePanel (~57%)
    │   └── TimelineCanvas  (D3 SVG, zoom/pan)
    │       ├── TimeAxis
    │       ├── ProgressionLines
    │       ├── DeathLine
    │       ├── CurrentDateLine
    │       └── SwimLaneRow × 6
    │           ├── KeyEventsLane
    │           ├── HospitalizationsLane
    │           ├── SystemicTherapyLane
    │           ├── RadioSurgeryLane
    │           ├── ImagingLane
    │           └── BiobankingLane
    └── RightPanel (~25%)
        ├── MolecularPanel
        └── BiomarkerSparklines
```

### State management (Zustand)

| Store | File | Owns |
|-------|------|------|
| `usePatientStore` | `src/store/patient.ts` | All FHIR resources + computed T0 |
| `useTimelineStore` | `src/store/timeline.ts` | zoom, offset, centralPlotWidth, hoverMonths |
| `useSelectionStore` | `src/store/selection.ts` | selectedSpecimenId, selectedProcedureId |
| `useCohortStore` | `src/store/cohort.ts` | filters, analytics response, loading state |

`useTimelineStore` is shared between `TimelineCanvas` and `BiomarkerSparklines` so sparklines always mirror the timeline's time window.

### T0 — date of diagnosis

Defined in `src/lib/t0.ts`.

1. **Override**: any `Condition` with the `t0-anchor` extension (`valueBoolean: true`) → its `onsetDateTime` is T0.
2. **Default**: earliest `onsetDateTime` among `Condition` resources where `clinicalStatus = active`, `verificationStatus = confirmed`, `category = encounter-diagnosis`.

All timeline positions: `(event.date − T0) / 30.44` months.

Temporal label format (`src/lib/formatters.ts`):

| Delta | Label |
|-------|-------|
| < 30 days | `[Day N]` |
| < 12 months | `[Month N]` |
| ≥ 12 months | `[Year Y.M]` |

### Timeline swim lanes

| Lane | Content | Visual |
|------|---------|--------|
| Key Events & Diagnosis | Conditions, death marker | DX (teal), Progression (red), Death (dark blue) |
| Hospitalisations | Encounters (class `IMP`) | Yellow bars (`#FFBB00`) |
| Systemic Therapy | MedicationAdministration | Horizontal bars + dose circles, ATC colour-coded |
| Radiotherapy & Surgery | Procedure | Surgery: scalpel icon; RT: filled rectangle |
| Imaging & Procedures | ImagingStudy | Downward triangle + modality label |
| Biobanking Samples | Specimen | Icon by type (tube/vial/funnel), colour by context |

### Drug classification (ATC)

| ATC prefix | Class | Colour |
|-----------|-------|--------|
| `L01F` | Immunotherapy | `#7B4FBC` |
| `L01XC` / `L01FA` | Targeted / mAb | `#2E7D4F` |
| `L02` | Hormone therapy | `#D97706` |
| `L01` (other) | Chemotherapy | `#4A7FB5` |

### Timeline interactions

| Interaction | Result |
|-------------|--------|
| Hover any marker | Tooltip (type, date, T-relative label, description) |
| Scroll wheel | Zoom in/out around cursor |
| Click-drag | Pan left/right |
| `+` / `−` keys | Zoom in/out around centre |
| Click surgery/RT marker | Side drawer with full Procedure details |
| Click biobanking marker | Updates Molecular Panel to that specimen |

---

## Mock FHIR server (`mock-server/`)

Standalone Express server implementing a minimal subset of the FHIR R4 HTTP API.

| Method | Endpoint | Returns |
|--------|----------|---------|
| `GET` | `/fhir/R4/metadata` | `CapabilityStatement` |
| `GET` | `/fhir/R4/Patient` | `Bundle` (searchset) — 10 named patients |
| `GET` | `/fhir/R4/Patient/:id` | `Patient` resource or 404 `OperationOutcome` |
| `GET` | `/fhir/R4/Patient/:id/$everything` | `Bundle` (collection, paginated via `?_count=N&_page=N`) |
| `GET` | `/fhir/R4/cohort/analytics` | Pre-aggregated chart data (`?phase=demographics\|full&gender=&stage=&bodySite=&gene=`) |

### Analytics endpoint

All aggregation is server-side. The client receives only pre-computed chart-ready data — never raw bundles.

- **`?phase=demographics`** — returns `n`, `gender`, `ageBins`, `stages` (Row 1 data, fast)
- **`?phase=full`** — returns all of the above plus `oncoPrint`, `surgeryMix`, `chemoMix`, `rtMix`, `osCurve`, `pfsCurve`

Survival curves are computed using the product-limit (Kaplan-Meier) estimator with Greenwood's 95% CI formula.

### Mock patient population

100 patients total:

- **10 named patients** (`src/data/`) — full FHIR bundles with genomic panels (c./p. HGVS), hospitalisations, lab observations, clinical notes
- **90 synthetic patients** (`mock-server/data/syntheticPatients.ts`) — lightweight bundles for realistic cohort distributions; server-side only, never sent to the client

| # | Research ID | Tumour |
|---|-------------|--------|
| 1 | CARPEM-2021-00123 | Breast cancer HR+/HER2+ (PIK3CA, TP53, BRCA1) |
| 2 | CARPEM-2022-00456 | Sigmoid colon adenocarcinoma (KRAS G12D, APC, TP53) |
| 3 | CARPEM-2021-00789 | Cervical SCC HPV16+ (PIK3CA, TP53, FBXW7) |
| 4 | CARPEM-2020-01012 | NSCLC EGFR del19 (EGFR, TP53, STK11) |
| 5 | CARPEM-2019-01345 | Ovarian HGSOC BRCA2 (BRCA2, TP53, CCNE1) |
| 6 | CARPEM-2022-01678 | Melanoma BRAF V600E (BRAF, NF1, PTEN) |
| 7 | CARPEM-2023-01901 | AML FLT3-ITD (FLT3, NPM1, DNMT3A) |
| 8 | CARPEM-2018-02234 | Prostate mCRPC (TP53, PTEN, CDK12) |
| 9 | CARPEM-2023-02567 | TNBC BRCA1 (BRCA1, TP53, RB1) |
| 10 | CARPEM-2024-02890 | Pancreatic PDAC (KRAS, TP53, CDKN2A, SMAD4) |

Synthetic cohort (sp01–sp90): ~48F/42M; Stage I×19, II×28, III×29, IV×19; body sites Breast/Colon/Lung/Ovary; ~50 patients carry genomic variants for OncoPrint.

---

## Tech stack

| Concern | Library |
|---------|---------|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 6 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| Timeline | D3 v7 (SVG, zoom/pan, KM curves) |
| Charts | Recharts (bar, donut, OncoPrint legend) |
| State | Zustand v5 |
| FHIR types | `@types/fhir` (`fhir4.*` namespace) |
| HTTP | native `fetch` |

---

## FHIR data model

### Resource types used

| Resource | Purpose |
|----------|---------|
| `Patient` | Demographics, vital status |
| `Condition` | Diagnoses, progression events; T0-anchor extension |
| `Encounter` | Inpatient hospitalisations (class `IMP`) |
| `MedicationAdministration` | Systemic therapy doses |
| `MedicationRequest` | Prophylactic intent flag |
| `Procedure` | Surgery (SNOMED 387713003), Radiotherapy (108290001) |
| `ImagingStudy` | Imaging events with modality |
| `DiagnosticReport` | Molecular panel linked to specimens |
| `Observation` | Biomarkers, staging (TNM LOINC 21908-9), progression (21976-6), somatic variants (69548-6) |
| `Specimen` | Biobanked samples; collection-context extension |
| `DocumentReference` | Clinical notes (base64 text attachments) |

### CARPEM-specific FHIR extensions

| Extension URL | Resource | Meaning |
|---------------|----------|---------|
| `http://carpem.fr/fhir/StructureDefinition/t0-anchor` | `Condition` | `valueBoolean: true` — this condition defines T0 |
| `http://carpem.fr/fhir/StructureDefinition/collection-context` | `Specimen` | `valueCode`: `baseline` \| `on-treatment` \| `at-progression` |

### Somatic variant LOINC components

| LOINC | Component |
|-------|-----------|
| 48018-6 | Gene studied |
| 48019-4 | DNA change type (variant type code) |
| 81258-6 | Allelic frequency (VAF) |
| 48006-1 | Molecular consequence |
| 48004-6 | DNA change (c.HGVS) |
| 48005-3 | Amino acid change (p.HGVS) |

Variant detection in the cohort analytics uses dual matching: `genomic-variant` category **or** LOINC code `69548-6`, to accommodate P1/P2 bundles that use the `laboratory` category.

---

## File structure

```
mock-server/
  server.ts                    Express entry point (port 3001)
  routes/
    metadata.ts                GET /fhir/R4/metadata
    patients.ts                GET /Patient, /Patient/:id, /Patient/:id/$everything
    cohortAnalytics.ts         GET /cohort/analytics — server-side aggregation
  data/
    syntheticPatients.ts       90 lightweight patient bundles (cohort only)
  package.json
  tsconfig.json

src/
  main.tsx
  App.tsx                      Root router (BrowserRouter)
  views/
    CohortView.tsx             Cohort Analytics Dashboard page
    PatientView.tsx            Patient 360° page
  config/
    cohortConfig.ts            Per-site genes, surgery types, chemo classes; normalizeSurgeryLabel()
  types/
    fhir.ts                    Re-exports of fhir4.* types + MonthsFromT0
    cohortAnalytics.ts         CohortAnalyticsResponse, OncoPrintData, CohortFilters
  lib/
    t0.ts                      computeT0(), toMonthsFromT0()
    formatters.ts              formatDate(), formatTemporalLabel(), …
    bundleUtils.ts             getResources<K>(), getPatient()
    fhirApi.ts                 fetchPatientList(), fetchPatientEverything()
    cohortApi.ts               fetchCohortAnalytics(filters, phase)
  store/
    patient.ts                 usePatientStore
    timeline.ts                useTimelineStore (zoom/pan, shared with sparklines)
    selection.ts               useSelectionStore
    cohort.ts                  useCohortStore (filters, analytics, fetch actions)
  data/
    mockBundle.ts              Patient 1
    mockBundle2.ts             Patient 2
    mockBundlesExtra.ts        Patients 3–10
  components/
    layout/
      AppShell.tsx
    panels/
      LeftPanel.tsx
      CentrePanel.tsx
      RightPanel.tsx
    cohort/
      ChartPanel.tsx           Reusable panel frame (title, loading, error)
      CohortLeftPanel.tsx      Filter sidebar (reset, N counter, gender, stage, gene, site)
      charts/
        GenderDistribution.tsx
        AgeAtDiagnosis.tsx
        CancerStageDistribution.tsx
        KeySomaticMutations.tsx  OncoPrint SVG matrix + MutationSearch export
        KMChart.tsx              Shared D3 Kaplan-Meier component
        OverallSurvivalKM.tsx
        ProgressionFreeSurvivalKM.tsx
        SurgeryMix.tsx
        ChemotherapyMix.tsx
        RadiotherapyMix.tsx
        TreatmentBarChart.tsx    Shared Recharts bar chart for mix panels
    timeline/
      constants.ts
      TimelineCanvas.tsx
      TimeAxis.tsx
      SwimLaneRow.tsx
      ProgressionLines.tsx
      DeathLine.tsx
      CurrentDateLine.tsx
      TooltipOverlay.tsx
      ZoomControls.tsx
      CursorLine.tsx
      lanes/
        KeyEventsLane.tsx
        HospitalizationsLane.tsx
        SystemicTherapyLane.tsx
        RadioSurgeryLane.tsx
        ImagingLane.tsx
        BiobankingLane.tsx
    widgets/
      PatientIdentifier.tsx
      ClinicalNotes.tsx
      MolecularPanel.tsx
      BiomarkerSparklines.tsx
    ui/
      SideDrawer.tsx
      ProcedureDrawer.tsx
```

---

## Known limitations / future work

- **Read-only**: no data entry or annotation.
- **Single patient session**: switching patients resets all selections and zoom.
- **DICOM thumbnails**: imaging marker click-card not yet implemented.
- **Two-phase loading**: cohort analytics fetches everything in one round-trip; progressive `phase=demographics` rendering is planned.
- **Real API**: replace `VITE_FHIR_BASE_URL` with the production CARPEM EDS endpoint to connect to live data.
- **Localisation**: dates formatted in `fr-FR` locale; UI labels in English.
- **Accessibility**: WCAG 2.1 AA compliance not yet audited.

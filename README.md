# CARPEM CMOT — Single Patient 360° Profile

FHIR R4 read-only clinical dashboard for oncologists and data managers at CARPEM (Cancer Research for Personalized Medicine). Displays a single patient's full longitudinal oncology trajectory in a three-panel layout.

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

Open http://localhost:5173. The app fetches the patient list from the FHIR server on startup and loads each patient's bundle on demand.

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

## Architecture overview

```
App.tsx
└── AppShell             header + patient dropdown
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

`useTimelineStore` is shared between `TimelineCanvas` and `BiomarkerSparklines` so that sparklines always mirror the timeline's time window.

---

## Mock FHIR server (`mock-server/`)

Standalone Express server implementing a minimal subset of the FHIR R4 HTTP API. It is the development replacement for the real CARPEM EDS.

| Method | Endpoint | Returns |
|--------|----------|---------|
| `GET` | `/fhir/R4/metadata` | `CapabilityStatement` |
| `GET` | `/fhir/R4/Patient` | `Bundle` (searchset) — 10 patients |
| `GET` | `/fhir/R4/Patient/:id` | `Patient` resource or 404 `OperationOutcome` |
| `GET` | `/fhir/R4/Patient/:id/$everything` | `Bundle` (collection, paginated via `?_count=N&_page=N`) |

Data is served directly from the TypeScript mock bundles in `src/data/` — no duplication. See `FHIR_TASKS.md` for the server's development Kanban.

---

## Tech stack

| Concern | Library |
|---------|---------|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 6 |
| Styling | Tailwind CSS v3 |
| Timeline | D3 v7 (SVG, zoom/pan) |
| Sparklines | Recharts |
| State | Zustand v5 |
| FHIR types | `@types/fhir` (`fhir4.*` namespace) |
| HTTP | native `fetch` (`src/lib/fhirApi.ts`) |

---

## FHIR data model

The app consumes a single FHIR R4 `Bundle` returned by `GET /fhir/R4/Patient/{id}/$everything`.

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
| `Observation` | Biomarkers, staging (TNM), progression (LOINC 21976-6), somatic variants (LOINC 69548-6) |
| `Specimen` | Biobanked samples; collection-context extension |
| `DocumentReference` | Clinical notes (base64 text attachments) |

### CARPEM-specific FHIR extensions

| Extension URL | Resource | Meaning |
|---------------|----------|---------|
| `http://carpem.fr/fhir/StructureDefinition/t0-anchor` | `Condition` | `valueBoolean: true` — this condition defines T0 |
| `http://carpem.fr/fhir/StructureDefinition/collection-context` | `Specimen` | `valueCode`: `baseline` \| `on-treatment` \| `at-progression` |

---

## T0 — date of diagnosis

Defined in `src/lib/t0.ts`.

1. **Override**: any `Condition` with the `t0-anchor` extension (`valueBoolean: true`) → its `onsetDateTime` is T0.
2. **Default**: earliest `onsetDateTime` among `Condition` resources where `clinicalStatus = active`, `verificationStatus = confirmed`, `category = encounter-diagnosis`.

All timeline positions are expressed as **months from T0**: `(event.date − T0) / 30.44`.

Temporal label format (`src/lib/formatters.ts`):

| Delta | Label |
|-------|-------|
| < 30 days | `[Day N]` |
| < 12 months | `[Month N]` |
| ≥ 12 months | `[Year Y.M]` |

---

## Timeline swim lanes

| Lane | ID | Content | Visual |
|------|----|---------|--------|
| Key Events & Diagnosis | `key-events` | Conditions, death marker | Coloured squares: DX (teal), Progression (red), Death (dark blue) |
| Hospitalisations | `hospitalizations` | Encounters (class `IMP`) | Yellow bars (`#FFBB00`) with truncated label |
| Systemic Therapy | `systemic` | MedicationAdministration | Horizontal bars + numbered dose circles |
| Radiotherapy & Surgery | `rt-surgery` | Procedure | Surgery: scalpel icon; RT: filled rectangle over duration |
| Imaging & Procedures | `imaging` | ImagingStudy | Downward triangle with modality label |
| Biobanking Samples | `biobanking` | Specimen | Icon by type: tube / biopsy / funnel |

Full-height decorative lines (`ProgressionLines.tsx`, `DeathLine.tsx`) are rendered **outside** the per-lane `<clipPath>` so they span the entire timeline height.

### Drug classification (ATC) — SystemicTherapyLane

| ATC prefix | Class | Colour |
|-----------|-------|--------|
| `L01F` | Immunotherapy | `#7B4FBC` |
| `L01X` | Targeted / mAb | `#2E7D4F` |
| `L02` | Hormone therapy | `#D97706` |
| `L01` (other) | Chemotherapy | `#4A7FB5` |

---

## Molecular Panel

Displays somatic variants for the selected specimen (default: most recent biopsy). Variants are shown in a table — Gene (coloured by variant type) | p. | c. | VAF — sorted by descending VAF, max 8 rows.

### Variant LOINC components

| LOINC | Component |
|-------|-----------|
| 48018-6 | Gene studied |
| 81258-6 | Allelic frequency (VAF) |
| 48006-1 | Molecular consequence (variant type) |
| 48004-6 | DNA change (c.HGVS) |
| 48005-3 | Amino acid change (p.HGVS) |

---

## Biomarker Sparklines

One Recharts line chart per biomarker for all `Observation` resources in category `laboratory`. The X-axis domain mirrors the timeline's zoom/pan state in real time.

| LOINC | Label | Unit |
|-------|-------|------|
| 6690-2 | WBC | 10⁹/L |
| 718-7 | Hb | g/dL |
| 10334-1 | CA 15-3 | U/mL |
| 24108-3 | CA 19-9 | U/mL |
| 2857-1 | CEA | ng/mL |
| 19197-8 | PSA | ng/mL |
| 14804-9 | LDH | U/L |
| 12994-6 | S100B | µg/L |
| 83050-6 | CA-125 | U/mL |
| 6768-6 | Alk Phos | U/L |
| 1975-2 | Bilirubin | mg/dL |

Reference ranges are read from `Observation.referenceRange[0].high`. Values above the upper limit are highlighted red.

---

## Timeline interactions

| Interaction | Result |
|-------------|--------|
| Hover any marker | Tooltip (resource type, absolute date, T-relative label, description) |
| Scroll wheel | Zoom in/out around cursor |
| Click-drag | Pan left/right |
| `+` / `=` / `-` keys | Zoom in/out around centre |
| Click surgery/RT marker | Side drawer with full `Procedure` details |
| Click biobanking marker | Updates Molecular Panel to that specimen |

Zoom/pan state is synced to URL parameters (`?zoom=N&offset=M`) for bookmarking.

---

## Mock patients

10 fictional patients are served by the mock FHIR server. Each has a full genomic panel (c./p. HGVS), hospitalisations, lab observations, and clinical notes. The switcher in the top nav shows each patient's research ID (`CARPEM-YYYY-NNNNN`).

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

---

## File structure

```
mock-server/
  server.ts                    Express entry point (port 3001)
  routes/
    metadata.ts                GET /fhir/R4/metadata
    patients.ts                GET /Patient, /Patient/:id, /Patient/:id/$everything
  package.json
  tsconfig.json

src/
  App.tsx                      Root: patient dropdown, FHIR fetch, error banner
  main.tsx
  types/
    fhir.ts                    Re-exports of fhir4.* types + MonthsFromT0
  lib/
    t0.ts                      computeT0(), toMonthsFromT0()
    formatters.ts              formatDate(), formatTemporalLabel(), …
    bundleUtils.ts             getResources<K>(), getPatient()
    fhirApi.ts                 fetchPatientList(), fetchPatientEverything()
  store/
    patient.ts                 usePatientStore
    timeline.ts                useTimelineStore
    selection.ts               useSelectionStore
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
- **DICOM thumbnails**: imaging marker click-card is not yet implemented (planned).
- **URL routing**: no `/patient/:id` deep-link support yet; the dropdown always resets to patient 1 on page reload.
- **Real API**: replace `VITE_FHIR_BASE_URL` with the production CARPEM EDS endpoint to connect to live data.
- **Localisation**: dates are formatted in `fr-FR` locale; UI labels are in English.

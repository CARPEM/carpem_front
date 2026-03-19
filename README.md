# CARPEM CMOT — Single Patient 360° Profile

FHIR R4 read-only clinical dashboard for oncologists and data managers at CARPEM (Cancer Research for Personalized Medicine). Displays a single patient's full longitudinal oncology trajectory in a three-panel layout.

---

## Getting started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run typecheck  # TypeScript check (run after every non-trivial change)
npm run build      # production build
npm run preview    # preview production build locally
```

Minimum display resolution: 1440 × 900. Optimised for 1920 × 1080.

---

## Architecture overview

```
App.tsx
└── AppShell             header + patient switcher
    ├── LeftPanel (~18%)
    │   ├── PatientIdentifier
    │   └── ClinicalNotes
    ├── CentrePanel (~57%)
    │   └── TimelineCanvas  (D3 SVG, zoom/pan)
    │       ├── TimeAxis
    │       ├── ProgressionLines
    │       ├── CurrentDateLine
    │       └── SwimLaneRow × 5
    │           ├── KeyEventsLane
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
| `useTimelineStore` | `src/store/timeline.ts` | zoom, offset, centralPlotWidth |
| `useSelectionStore` | `src/store/selection.ts` | selectedSpecimenId, selectedProcedureId |

`useTimelineStore` is shared between `TimelineCanvas` and `BiomarkerSparklines` so that the sparklines always mirror the timeline's time window.

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
| HTTP | axios (wired but unused in mock mode) |

---

## FHIR data model

The app consumes a single FHIR R4 `Bundle` (result of `GET /fhir/R4/Patient/{id}/$everything`). During development, mock bundles are used from `src/data/`.

### Resource types used

| Resource | Purpose |
|----------|---------|
| `Patient` | Demographics, vital status |
| `Condition` | Diagnoses, progression events; T0-anchor extension |
| `MedicationAdministration` | Systemic therapy doses |
| `MedicationRequest` | Prophylactic intent flag |
| `Procedure` | Surgery (SNOMED 387713003), Radiotherapy (108290001) |
| `ImagingStudy` | Imaging events with modality |
| `DiagnosticReport` | Molecular panel linked to specimens |
| `Observation` | Biomarkers, staging (TNM), progression (LOINC 21976-6), somatic variants |
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

Temporal label format (see `src/lib/formatters.ts`):

| Delta | Label |
|-------|-------|
| < 30 days | `[Day N]` |
| < 12 months | `[Month N]` |
| ≥ 12 months | `[Year Y.M]` |

---

## Timeline swim lanes

| Lane | ID | Content | Visual |
|------|----|---------|--------|
| Key Events & Diagnosis | `key-events` | Conditions, T0 anchor | Coloured squares: DX (teal), Progression (red) |
| Systemic Therapy | `systemic` | MedicationAdministration | Horizontal bars + numbered dose circles |
| Radiotherapy & Surgery | `rt-surgery` | Procedure | Surgery: scalpel icon; RT: filled rectangle over duration |
| Imaging & Procedures | `imaging` | ImagingStudy | Downward triangle (outline) with modality label |
| Biobanking Samples | `biobanking` | Specimen | Icon by type: tube (blood/serum/plasma), biopsy (tissue), tube (FFPE/block) |

Lane heights are set in `TimelineCanvas.tsx` (`laneHeights` map). The Systemic Therapy lane is 2× the default `LANE_HEIGHT`.

### Progression lines

Full-height red vertical lines (`ProgressionLines.tsx`) are rendered **outside** the per-lane `<clipPath>` so they span the entire timeline height. They are driven by:
- Non-T0-anchor `Condition` resources with `onsetDateTime`
- `Observation` resources with LOINC code `21976-6` (Disease progression panel)

---

## Coding schemes

### Drug classification (ATC) — SystemicTherapyLane

| ATC prefix | Class | Colour |
|-----------|-------|--------|
| `L01F` | Immunotherapy | `#7B4FBC` |
| `L01X` | Targeted / mAb | `#2E7D4F` |
| `L02` | Hormone therapy | `#D97706` |
| `L01` (other) | Chemotherapy | `#4A7FB5` |

### Biomarker LOINC codes — BiomarkerSparklines

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

Only markers that have matching observations in the loaded bundle are shown. Reference ranges are read from `Observation.referenceRange[0].high`. Values above the upper limit are highlighted red.

### Somatic variant LOINC components — MolecularPanel

| LOINC | Component |
|-------|-----------|
| 48018-6 | Gene studied |
| 81258-6 | Allelic frequency (VAF) |
| 48006-1 | Molecular consequence (variant type) |

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

## Mock patient data

Development data lives in `src/data/`:

| File | Patients |
|------|---------|
| `mockBundle.ts` | P1 — Marie Dupont, 52F, Breast cancer (HR+/HER2−, BRCA1) |
| `mockBundle2.ts` | P2 — Jean Martin, 77M, Sigmoid colon adenocarcinoma (KRAS G12D) |
| `mockBundlesExtra.ts` | P3–P10 — diverse oncology profiles (see below) |

### Patients P3–P10

| # | Name | Age/Sex | Tumour |
|---|------|---------|--------|
| 3 | Sophie Laurent | 38F | Cervical SCC HPV16 |
| 4 | Robert Lefevre | 65M | NSCLC EGFR del19 |
| 5 | Isabelle Moreau | 58F | Ovarian HGSOC BRCA2 |
| 6 | Alexandre Petit | 47M | Melanoma BRAF V600E |
| 7 | Marguerite Blanc | 72F | AML FLT3-ITD |
| 8 | Henri Rousseau | 55M | mCRPC |
| 9 | Camille Fontaine | 44F | TNBC BRCA1 |
| 10 | Pierre Garnier | 69M | Pancreatic PDAC |

To add a new patient, create a `fhir4.Bundle` following the existing pattern and add it to the `BUNDLES` array in `App.tsx`.

---

## File structure

```
src/
  App.tsx                      Root: patient switcher, bundle loading
  main.tsx
  types/
    fhir.ts                    Re-exports of fhir4.* types + MonthsFromT0
  lib/
    t0.ts                      computeT0(), toMonthsFromT0(), T0_ANCHOR_URL
    formatters.ts              formatDate(), formatTemporalLabel(), ageInYears(), …
    bundleUtils.ts             getResources<K>(), getPatient()
    fhirApi.ts                 (unused in mock mode) axios FHIR client
  store/
    patient.ts                 usePatientStore — FHIR resources + T0
    timeline.ts                useTimelineStore — zoom, offset, centralPlotWidth
    selection.ts               useSelectionStore — selected specimen / procedure
  data/
    mockBundle.ts              Patient 1
    mockBundle2.ts             Patient 2
    mockBundlesExtra.ts        Patients 3–10
  components/
    layout/
      AppShell.tsx             Top nav + three-column shell
    panels/
      LeftPanel.tsx
      CentrePanel.tsx          Zoom controls + TimelineCanvas wrapper
      RightPanel.tsx
    timeline/
      constants.ts             LABEL_WIDTH, LANE_HEIGHT, SWIM_LANES, SEMANTIC_TICKS, …
      types.ts                 MarkerInfo, TooltipState
      TimelineCanvas.tsx       SVG canvas, zoom/pan, ResizeObserver, tooltip portal
      TimeAxis.tsx             Semantic ticks + minor gridlines
      SwimLaneRow.tsx          Label column + clipPath wrapper
      ProgressionLines.tsx     Full-height red progression lines (outside clipPath)
      CurrentDateLine.tsx      Vertical "today" line
      TooltipOverlay.tsx       Fixed-position tooltip (portalled to document.body)
      ZoomControls.tsx         +/− buttons
      lanes/
        KeyEventsLane.tsx      DX + progression squares
        SystemicTherapyLane.tsx  Drug bars + dose circles
        RadioSurgeryLane.tsx   Scalpel icon / RT rectangle
        ImagingLane.tsx        Triangle markers
        BiobankingLane.tsx     Tube / biopsy / funnel icons
    widgets/
      PatientIdentifier.tsx    Demographics, primary tumour, stage
      ClinicalNotes.tsx        Document snippets + modal
      MolecularPanel.tsx       Somatic variant waterfall, actionable findings
      BiomarkerSparklines.tsx  Recharts line charts, shared time domain
    ui/
      SideDrawer.tsx           Slide-in drawer shell
      ProcedureDrawer.tsx      Procedure detail view inside SideDrawer
  icons/                       Source SVG files for inline paths
    scalpel.svg
    tube.svg
    biopsy.svg
```

---

## Known limitations / future work

- **Read-only**: no data entry or annotation.
- **Single patient session**: switching patients resets all selections and zoom.
- **DICOM thumbnails**: imaging marker click-card is not yet implemented (planned).
- **Real API**: `src/lib/fhirApi.ts` is scaffolded but unused; replace mock bundles with live `$everything` calls to connect to the CARPEM EDS.
- **Localisation**: dates are formatted in `fr-FR` locale; labels are in English.

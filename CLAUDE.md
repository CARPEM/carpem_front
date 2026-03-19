# CARPEM CMOT — Single Patient 360-Degree Profile UI

## Project purpose
FHIR R4-based read-only clinical dashboard for oncologists and data managers.
Displays a single patient's full longitudinal oncology trajectory.
Data source: CARPEM EDS RESTful API (`GET /fhir/R4/Patient/{id}/$everything`).
During development: mock FHIR bundle from `src/data/mockBundle.ts`.

## Tech stack
- **Framework**: React 19 + TypeScript 5 (Vite 6)
- **Timeline visualisation**: D3 v7 (zoom, pan, SVG swim-lanes)
- **Charts / sparklines**: Recharts
- **Global state**: Zustand — `src/store/timeline.ts` owns zoom/pan shared between timeline and biomarker sparklines
- **Styling**: Tailwind CSS v3
- **FHIR types**: `@types/fhir` — use `fhir4.*` namespace
- **HTTP**: axios

## Layout (1920×1080 target, min 1440×900)
Three-column layout, all panels full height, no page scroll.

| Panel  | Width | File | Content |
|--------|-------|------|---------|
| Left   | ~18%  | `src/components/panels/LeftPanel.tsx` | PatientIdentifierWidget + ClinicalNotesWidget |
| Centre | ~57%  | `src/components/panels/CentrePanel.tsx` | LongitudinalTimeline (D3) |
| Right  | ~25%  | `src/components/panels/RightPanel.tsx` | MolecularPanel + BiomarkerSparklines |

Shell: `src/components/layout/AppShell.tsx`

## Key business rules

### T0 computation (`src/lib/t0.ts`)
- Primary: earliest Condition.onsetDateTime where category=encounter-diagnosis, clinicalStatus=active, verificationStatus=confirmed.
- Override: Condition with extension `http://carpem.fr/fhir/StructureDefinition/t0-anchor` (valueBoolean: true).
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
   - Chemo (L01): `#4A7FB5`
   - Targeted/mAb (L01X): `#2E7D4F`
   - Hormone (L02): `#D97706`
   - Immunotherapy (L01F): `#7B4FBC`
   - Dashed bar = prophylactic intent.
3. **Radiotherapy & Surgery** — Procedure. Surgery: scalpel SVG icon. RT: filled rectangle over duration period.
4. **Imaging & Procedures** — ImagingStudy + DiagnosticReport. Downward triangle at acquisition date. Tooltip: modality + series count.
5. **Biobanking Samples** — Specimen. Icon shape = sample type (tube=blood/serum, vial=tissue biopsy, funnel=FFPE). Colour = context (baseline=teal, on-treatment=blue, at-progression=red).

### Interactions
- Hover any marker → tooltip (resource type, absolute date, T-relative label, primary label).
- Click imaging marker → floating card (DICOM thumbnails). Click specimen → loads Molecular Panel.
- Click procedure → side-drawer with full Procedure details.
- Temporal label format: Δ<30d → "[Day N]"; Δ<365d → "[Month N]"; else → "[Year Y.M]".

### Right panel
- **Molecular Panel**: context-sensitive (updates on specimen click). Default = most recent biopsy.
  - Fields: sample type, lesion type, date collected, key somatic mutations (VAF sparkbar), actionable findings.
  - Mutation waterfall sparkbars: bar length = VAF. Colours: missense=dark blue, frameshift=green, splice=orange, CNV=grey. Max 8 genes shown (top by VAF) + "+ N more" link.
- **Biomarker Sparklines**: Observation (category=laboratory), ordered by effectiveDateTime.
  - Each biomarker = 120px-high line chart, full panel width.
  - Shares X-axis zoom/pan with main timeline (same `useTimelineStore`).
  - Reference line = Observation.referenceRange.high. Values > range → red; normal → blue.
  - Configurable per study protocol (config JSON injected at app init).

## FHIR resource types used
Patient, Condition, MedicationAdministration, MedicationRequest, Procedure,
ImagingStudy, DiagnosticReport, Observation, Specimen, DocumentReference.

## Folder structure
```
src/
  components/
    layout/       AppShell
    panels/       LeftPanel, CentrePanel, RightPanel
    timeline/     (swim-lane sub-components, D3 hooks)
    widgets/      PatientIdentifier, ClinicalNotes, MolecularPanel, BiomarkerSparkline
    ui/           shared primitives (Tooltip, Drawer, Modal, Badge)
  store/          Zustand stores (timeline.ts, patient.ts)
  lib/            t0.ts, fhirApi.ts, formatters.ts
  types/          fhir.ts (re-exports fhir4.*)
  data/           mockBundle.ts
```

## Kanban board
`TASKS.md` at project root is the persistent task board (Backlog / In Progress / Done).
Read it at the start of every session to know what to work on next.
Update it when a feature is completed or started.

## Commands
- `npm run dev` — start dev server (Vite, port 5173)
- `npm run typecheck` — TypeScript check (run after every non-trivial change)
- `npm run build` — production build

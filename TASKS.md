# CARPEM CMOT — Development Kanban

> Update this file as work progresses. Claude reads it at the start of each session.
> Columns: **Backlog** | **In Progress** | **Done**

---

## Done

- [x] **Side-drawer component** — slides in from right, Escape/backdrop dismiss (`src/components/ui/SideDrawer.tsx`)
- [x] **Procedure Drawer** — Surgery/RT fields: category badge, code, date/period, T-relative, body site, performer, notes; click RT bar or surgery icon on timeline (`src/components/ui/ProcedureDrawer.tsx`)
- [x] **Contextual Molecular Panel** — specimen fields, mutation waterfall sparkbars (VAF bars, variant-type colours), actionable findings badge, context-sensitive on biobanking click
- [x] **Biomarker Sparklines** — WBC / CA 15-3 / CEA Recharts sparklines, shared time domain with timeline (zoom/pan reactive), reference line, red/blue dot colouring
- [x] **Swim lane: Key Events** — teal DX flag + red progression flags, click popover (code/date/temporal)
- [x] **Swim lane: Systemic Therapy** — bars grouped by medication, ATC colour coding, numbered dose circles, prophylactic dashed
- [x] **Swim lane: RT & Surgery** — scalpel icon (surgery) + purple filled rect over duration (RT)
- [x] **Swim lane: Imaging** — downward cyan triangles + modality label, hover tooltip
- [x] **Swim lane: Biobanking** — tube/vial/funnel icons, context colour (teal/blue/red), hover tooltip
- [x] **Hover tooltip** — all markers: label, absolute date, T-relative label, resource type
- [x] **D3 time axis** — semantic labels (DX/Yr1…Yr6/Mo18/Mo30), minor gridlines, zoom/pan (wheel + drag + +/−), URL state, "Current Date" indicator
- [x] **Swim lane containers** — 5 labelled rows with clip paths, ready for markers
- [x] **Patient Identifier Widget** — Patient ID, Age at DX, Gender, Primary Tumor, Stage, Vital Status from FHIR
- [x] **Clinical Notes Snippets Widget** — 3 most recent notes, temporal labels, truncated excerpts, "View all" modal
- [x] **Mock FHIR bundle** — 53 resources: Patient, 2 Conditions, 2 Observations (TNM + progression), 2 Procedures, 18 MedicationAdministrations (FEC/Docetaxel/Trastuzumab/Pertuzumab), 1 MedicationRequest (prophylactic), 3 ImagingStudy (CT×2, PET), 2 Specimen, 1 DiagnosticReport, 3 genomic variant Observations, 15 lab Observations (WBC/CA15-3/CEA), 3 DocumentReference

- [x] Project scaffolding (Vite + React + TypeScript + Tailwind + D3 + Recharts + Zustand)
- [x] App shell — top nav bar, page title bar, 3-column layout skeleton
- [x] Panel stubs — LeftPanel, CentrePanel, RightPanel placeholder components
- [x] Zustand timeline store — zoom & pan shared state (`src/store/timeline.ts`)
- [x] T0 computation logic (`src/lib/t0.ts`)
- [x] FHIR R4 type re-exports (`src/types/fhir.ts`)
- [x] Mock bundle placeholder (`src/data/mockBundle.ts`)
- [x] CLAUDE.md — full spec encoded as session context
- [x] Claude Code settings — npm permissions + PostToolUse typecheck hook

---

## In Progress

*(move cards here when work begins)*



---

## Backlog

### Foundation

### Left Panel (§3)
- [ ] **Patient Identifier Widget** — Patient ID, Age at DX, Gender, Primary Tumor, Stage at DX (TNM LOINC), Vital Status from mock bundle
- [ ] **Clinical Notes Snippets Widget** — 3 most recent DocumentReference notes, temporal labels (Day N / Month N / Year Y.M), truncated at ~300 chars, "View all notes" modal

### Centre Panel — Timeline (§4)
- [ ] **D3 time axis** — horizontal axis in months from T0, labels at DX/Month 1/Year 1/Month 18/Year 2/Month 30/Year 3/Current/Year 4+, "Current Date" vertical indicator
- [ ] **Zoom & pan** — scroll wheel + +/− buttons, click-drag pan, clamp to T0−3 → T_current+6, URL params `?zoom=N&offset=M`
- [ ] **Swim lane: Key Events & Diagnosis** — Condition flags (teal DX, red Progression), click → inline tooltip with code + stage + FHIR link
- [ ] **Swim lane: Systemic Therapy** — MedicationAdministration horizontal bars, ATC drug class colour coding, dose markers as numbered segments, dashed = prophylactic
- [ ] **Swim lane: Radiotherapy & Surgery** — Procedure scalpel icon (surgery) / filled rectangle over duration (RT), click → side-drawer with full Procedure details
- [ ] **Swim lane: Imaging & Procedures** — ImagingStudy downward triangles, tooltip modality + series count, click → floating DICOM card overlay
- [ ] **Swim lane: Biobanking Samples** — Specimen icons (tube/vial/funnel by type), colour by context (baseline=teal, on-treatment=blue, at-progression=red), click → loads Molecular Panel
- [ ] **Hover tooltip** — all markers: resource type, absolute date, T-relative label, primary label

### Right Panel (§5)
- [ ] **Contextual Molecular Panel** — context-sensitive on specimen click; fields: sample type, lesion type, date collected, key somatic mutations, actionable findings; default = most recent biopsy
- [ ] **Mutation Waterfall Sparkbars** — compact horizontal bar chart, bar length = VAF, colour by variant type (missense/frameshift/splice/CNV), max 8 genes + "+ N more" expand
- [ ] **Biomarker Sparklines** — one 120px-high line chart per biomarker (WBC, CA 15-3, CEA, etc.), shared X-axis zoom/pan with timeline, reference line = upper normal, red > normal / blue = normal

### Interactions & UX (§7)
- [x] **Side-drawer component** — slides in from right for Procedure details, dismissible
- [ ] **DICOM thumbnails overlay** — floating card on imaging marker click, dismiss via × *(deferred)*
- [x] **"View all notes" modal** — opens from Clinical Notes widget
- [x] **Keyboard shortcuts** — + / − for zoom on timeline canvas

### Integration
- [ ] **FHIR API client** (`src/lib/fhirApi.ts`) — paginated `$everything` fetch with Bundle.link (rel=next) handling
- [ ] **Patient selector / URL routing** — `/patient/:id` route, patient ID in page title bar
- [ ] **Error & loading states** — skeleton loaders for each panel while FHIR bundle loads

---

## Notes

- Centre panel D3 timeline is the critical path — build it before Right panel sparklines (shared zoom state dependency).
- Mock bundle must be filled before any widget can be meaningfully developed.
- Biomarker sparklines share the same T0-relative X axis as the D3 timeline — implement after zoom/pan is stable.

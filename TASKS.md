# CARPEM CMOT — Patient 360° Development Kanban

> Update this file as work progresses. Claude reads it at the start of each session.
> Columns: **Backlog** | **In Progress** | **Done**

---

## Done

### Foundation
- [x] Project scaffolding (Vite + React + TypeScript + Tailwind + D3 + Recharts + Zustand)
- [x] App shell — top nav bar, page title bar, 3-column layout skeleton
- [x] Panel stubs — LeftPanel, CentrePanel, RightPanel placeholder components
- [x] Zustand timeline store — zoom & pan shared state (`src/store/timeline.ts`)
- [x] T0 computation logic (`src/lib/t0.ts`)
- [x] FHIR R4 type re-exports (`src/types/fhir.ts`)
- [x] CLAUDE.md — full spec encoded as session context
- [x] Claude Code settings — npm permissions + PostToolUse typecheck hook
- [x] **React Router v6** — `/cohort` → `CohortView`, `/patient/:id` → `PatientView`, `/` → `/cohort`
- [x] **AppShell nav toggle** — "COHORT" / "PATIENT 360°" NavLink tabs with active highlight

### Mock data
- [x] **10 mock patients** — P1–P10 FHIR bundles with full genomic panels (c./p. HGVS), hospitalisations, encounters, lab observations, clinical notes (`src/data/`)
- [x] **Mock FHIR R4 server** — standalone Express server on port 3001; `/metadata`, `/Patient`, `/Patient/:id`, `/Patient/:id/$everything`
- [x] **FHIR API client** (`src/lib/fhirApi.ts`) — `fetchPatientList()` + `fetchPatientEverything()` with Bundle.link[next] pagination
- [x] **App wired to FHIR server** — `App.tsx` fetches patients on mount, loads bundles on demand; static bundle imports removed

### Left Panel
- [x] **Patient Identifier Widget** — Patient ID, Age at DX, Gender, Primary Tumor, Stage, Vital Status
- [x] **Clinical Notes Snippets Widget** — 3 most recent notes, temporal labels, truncated excerpts, "View all" modal

### Centre Panel — Timeline
- [x] **D3 time axis** — semantic labels (DX/Yr1…Yr6/Mo18/Mo30), minor gridlines, "Current Date" indicator
- [x] **Zoom & pan** — scroll wheel + +/− buttons, click-drag pan, clamp to T0−3 → T_current+6, URL params `?zoom=N&offset=M`
- [x] **Swim lane containers** — 6 labelled rows with clip paths
- [x] **Swim lane: Key Events & Diagnosis** — Condition flags (teal DX, red Progression), click popover
- [x] **Swim lane: Hospitalisations** — inpatient encounter bars (#FFBB00), hover tooltip
- [x] **Swim lane: Systemic Therapy** — MedicationAdministration bars, ATC colour coding, dose circles, prophylactic dashed
- [x] **Swim lane: Radiotherapy & Surgery** — scalpel icon (surgery) / filled rectangle (RT), click → side-drawer
- [x] **Swim lane: Imaging & Procedures** — downward triangles, modality label, hover tooltip
- [x] **Swim lane: Biobanking Samples** — tube/vial/funnel icons, context colour, hover tooltip, click → Molecular Panel
- [x] **Hover tooltip** — all markers: resource type, absolute date, T-relative label, description
- [x] **Death marker** — deep-blue 'D' flag + full-height vertical line spanning all lanes
- [x] **Progression lines** — full-height vertical lines at each progression event
- [x] **CursorLine** — hover cross-hair shared across timeline and biomarker sparklines

### Right Panel
- [x] **Contextual Molecular Panel** — specimen fields, mutation table (Gene | p. | c. | VAF), actionable findings badge, context-sensitive on biobanking click
- [x] **Biomarker Sparklines** — WBC / CA 15-3 / CEA Recharts sparklines, shared time domain with timeline, reference line, red/blue colouring

### Interactions & UX
- [x] **Side-drawer component** — slides in from right, Escape/backdrop dismiss
- [x] **Procedure Drawer** — Surgery/RT fields: category badge, code, date, T-relative, body site, performer, notes
- [x] **"View all notes" modal** — opens from Clinical Notes widget
- [x] **Keyboard shortcuts** — + / − for zoom on timeline canvas

---

## Backlog

### Non-functional requirements (spec §8, §10)
- [ ] **DICOM thumbnails overlay** — floating card on imaging marker click *(deferred)*
- [ ] **Accessibility — WCAG 2.1 AA** — keyboard navigation, ARIA labels, colour not sole encoding
- [ ] **Read-only enforcement** — audit: no write operations to FHIR resources anywhere
- [ ] **No PHI in URL** — audit all `navigate()` calls in patient view

---

## Notes

- Centre panel D3 timeline is the critical path — build before right panel sparklines (shared zoom state).
- Biomarker sparklines share the same T0-relative X axis as the D3 timeline — implement after zoom/pan is stable.
- For the Cohort Analytics Dashboard Kanban see `COHORT_TASKS.md`.
- For the mock FHIR server Kanban see `FHIR_TASKS.md`.

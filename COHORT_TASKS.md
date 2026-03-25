# CARPEM CMOT — Cohort Analytics Dashboard — Development Kanban

> Source spec: `specifications/cohort_view/CARPEM_CMOT_Cohort_Dashboard_Specification.pdf`
> Mockup: `specifications/cohort_view/cohort_view.jpg`
> Update this file as work progresses. Claude reads it at the start of each session.
> Columns: **Backlog** | **In Progress** | **Done**

---

## Done

### Phase 0 — Foundation
- [x] **React Router v6** — `react-router-dom` installed; `<BrowserRouter>` in `main.tsx`; routes `/cohort` → `CohortView`, `/patient/:id` → `PatientView`, `/patient` → `PatientRedirect`; `/` → `/cohort`
- [x] **AppShell nav toggle** — "COHORT" / "PATIENT 360°" `NavLink` tabs with active highlight; switcher + title bar moved into `PatientView`
- [x] **`CohortAnalyticsResponse` type** — `src/types/cohortAnalytics.ts`
- [x] **Mock server analytics endpoint** — `mock-server/routes/cohortAnalytics.ts`: server-side aggregation; gender / age bins / stages / mutations / surgery / chemo / RT / KM (OS + PFS); filter params
- [x] **Register cohort route** — `mock-server/server.ts`
- [x] **`src/lib/cohortApi.ts`** — `fetchCohortAnalytics(filters, phase)`
- [x] **Zustand cohort store** — `src/store/cohort.ts`
- [x] **Cohort view layout shell** — `src/views/CohortView.tsx`: two-zone layout, N counter, Cohort Type selector, left filter panel, 3-row grid
- [x] **`ChartPanel` frame component** — `src/components/cohort/ChartPanel.tsx`

### Phase 1 — Left Panel: Filter Controls
- [x] **Reset filters button** — wired to `resetFilters()`
- [x] **Cohort Summary Widget** — "N=X" wired to `analytics.n`
- [x] **Data Elements Filter** — type / metric dropdowns in place
- [x] **Filter by Mutations** — bodySite + gene inputs wired to `setFilter()`
- [x] **Gender / Stage filters** — dropdowns wired to `setFilter()`

### Phase 2 — Main Grid Row 1: Demographics (spec §4.1–4.3)
- [x] **Gender Distribution donut** — `GenderDistribution.tsx`; Female/Male/Other/Unknown segments with CARPEM colours; custom legend + tooltip; click-to-filter on gender
- [x] **Age at Diagnosis bar chart** — `AgeAtDiagnosis.tsx`; decade bins; mean annotation; CARPEM teal bars
- [x] **Cancer Stage Distribution bar chart** — `CancerStageDistribution.tsx`; value labels above bars; CARPEM green; click-to-filter on stage

### Phase 3 — Main Grid Row 2: Key Somatic Mutations (spec §4.4)
- [x] **Key Somatic Mutations waterfall** — `KeySomaticMutations.tsx`; SVG OncoPrint horizontal stacked bars; Y-axis genes ordered by descending frequency; X-axis 0–100% with gridlines at 0/50/100; segments coloured by variant type; grey track background; right-hand % label; dimming of non-selected genes on filter; hover tooltip; click-to-filter on gene row; search input + funnel icon in ChartPanel header (`MutationSearch` exported); mutation legend below chart
- [x] **Variant dual-detection fix** — `computeMutations` + `filterBundles` gene filter match by `genomic-variant` category **OR** LOINC `69548-6`; covers P1/P2 mock bundles that use `'laboratory'` category

### Phase 3b — OncoPrint Matrix (replaces waterfall bar chart)
- [x] **OncoPrint data type** — `OncoPrintAlteration`, `OncoPrintGene`, `OncoPrintData` in `cohortAnalytics.ts`; `oncoPrint` field replaces `mutations` in `CohortAnalyticsResponse`
- [x] **`computeOncoPrint()` server function** — builds patient × gene matrix; patients sorted most-altered first; genes sorted by pct desc, top 10; each cell = `OncoPrintAlteration[] | null`
- [x] **OncoPrint SVG component** — `KeySomaticMutations.tsx` rewritten as gene × patient matrix; per-patient summary alteration bar at top; cells coloured by variant type, multi-mutation cells split vertically; unaltered cells in light grey; GOI amber dot; click-to-filter on gene rows; hover tooltip (gene, patient #, type(s)); search still works (filters gene rows); mutation legend unchanged

### Phase 4 — Main Grid Row 3: Survival & Treatment Mix (spec §4.5–4.9)
- [x] **`KMChart.tsx`** — shared D3 v7 Kaplan-Meier component: step function (`curveStepAfter`); 95% CI shaded band; dashed extension at last observed value; X-axis in years; Y-axis in % surviving; gridlines; hover overlay with bisect → tooltip (t, S(t), 95% CI, N at risk); `ResizeObserver` for responsive sizing
- [x] **Overall Survival KM** — `OverallSurvivalKM.tsx`; CARPEM teal `#1A7F8E`; source `analytics.osCurve`
- [x] **Progression-Free Survival KM** — `ProgressionFreeSurvivalKM.tsx`; CARPEM blue `#4A7FB5`; source `analytics.pfsCurve`
- [x] **Surgery Mix bar chart** — `SurgeryMix.tsx`; Recharts vertical bars; alternating CARPEM palette; truncated procedure names on X-axis; full name in tooltip; N + % labels
- [x] **Chemotherapy Mix bar chart** — `ChemotherapyMix.tsx`; Recharts vertical bars; colour-coded by class (Standard=blue, Immuno=purple, Targeted=green, Hormone=orange); N + % tooltip
- [x] **Radiotherapy Mix bar chart** — `RadiotherapyMix.tsx`; Recharts vertical bars; purple `#7B4FBC`; truncated RT type names; N + % tooltip

---

### Phase 0b — Expand Mock Patient Population
- [x] **30 synthetic patients in `mock-server/data/syntheticPatients.ts`** — 16F/14M; Stage I×6, II×9, III×9, IV×6; 9 deceased (→ 10 OS events with real bundles); 23 PFS events; body sites: Breast/Colon/Lung/Ovary; treatments: Standard chemo × 17, Immuno × 6, Targeted × 5, Hormone × 2; Surgery: Resection × 7, Mastectomy × 6, Lumpectomy × 2; RT: Adjuvant × 7, Palliative × 4; server-side only, never sent to client
- [x] **Stage normaliser consolidated** to four buckets (I/II/III/IV) for cleaner bar chart display

Result: N=40 | OS: 11-point curve S(∞)=71.8% | PFS: 24-point curve S(∞)=19.4%

---

## Backlog



### Phase 5 — Cohort Type Selector & Cross-Chart Interactions (spec §5, §7) ✓

- [x] **Cohort Type selector dropdown** — wired in `CohortView` title bar; options Full Trial / Breast / Ovarian / Colorectal / Lung mapped to `bodySite` filter values; controlled select reads `filters.bodySite`; selection calls `setFilter('bodySite', …)` → immediate re-fetch; synced with the left-panel Tumour Location text input (both write `filters.bodySite`)
- [x] **Click-to-filter wiring confirmed** — `GenderDistribution` (click segment → `setFilter('gender')`), `CancerStageDistribution` (click bar → `setFilter('stage')`), `KeySomaticMutations` (click row → `setFilter('gene')`); all toggle on second click; additive AND across axes; treatment mix charts (no additional filter keys in spec)
- [x] **URL state persistence** — `useSearchParams` in `CohortView`; on mount restores `gender`, `stage`, `bodySite`, `gene` from URL query string via `setFilters()` (single fetch); on every filter change syncs URL with `{ replace: true }` (no PHI — only aggregate values); `setFilters` batch action added to cohort store

---

### Phase 6 — Layout, Shared Components & Polish

- [ ] **Responsive grid layout** — 3-row grid at exact proportions from spec; no page scroll at 1920×1080; min supported 1440×900
- [ ] **Cohort hover tooltip component** — `src/components/cohort/CohortTooltip.tsx`: consistent tooltip across all chart panels
- [ ] **Two-phase progressive rendering** — fetch `?phase=demographics` first → render Row 1; then `?phase=full` → render Rows 2 & 3; skeleton loaders in pending panels

---

### Phase 7 — Non-Functional Requirements (spec §8, §10)

- [ ] **KM statistical validity guard** — do not render KM curves when N < 5 per stratum; display "Insufficient data" text placeholder instead
- [ ] **Internationalisation** — primary language French (spec §10); date labels YYYY-MM-DD
- [ ] **Accessibility — WCAG 2.1 AA** (spec §8.4) — keyboard navigation, ARIA labels, colour not used as sole encoding
- [ ] **Read-only enforcement** — no write operations to FHIR resources
- [ ] **No PHI in URL** — audit all `navigate()` calls in cohort view

---

## Architecture

### Data flow

```
Client (CohortView)                     Mock FHIR Server (port 3001)
────────────────────                    ────────────────────────────
CohortView mounts
  │
  ├─► GET /fhir/R4/cohort/analytics ──► Server iterates over in-memory
  │   ?phase=demographics               patient bundles, applies filters,
  │                                     computes aggregations server-side
  │   ◄── gender + ageBins + stages ───┘
  │   → Row 1 panels render
  │
  ├─► GET /fhir/R4/cohort/analytics ──► Server computes heavier aggregations
  │   ?phase=full                       (KM curves, mutation frequencies,
  │                                      treatment mix)
  │   ◄── mutations + surgery +
  │       chemo + rt + KM curves
  │   → Rows 2 & 3 panels render
  │
  └─► Filter applied (e.g. gender=female)
      GET /fhir/R4/cohort/analytics
      ?gender=female&phase=full
      ◄── re-aggregated response
      Only aggregated numbers returned —
      no raw bundles sent to client
```

### Key principles

- **All aggregation is server-side.** The mock server iterates its in-memory patient bundles, applies filters, and returns only pre-computed chart data — never raw bundles. Mirrors production FHIR analytics architecture.
- **Phase 0b expands the population.** The 10 development patients are sufficient for wiring but produce poor distributions. Adding 20–40 lightweight patients server-side gives meaningful KM curves, age spreads, and stage distributions.
- **Additive filters (logical AND).** Every filter selection re-queries the API. Filter state lives in the Zustand cohort store and is persisted in the URL (no PHI).
- **Variant dual-detection.** Genomic variant observations matched by `genomic-variant` category OR LOINC `69548-6` to cover P1/P2 mock data inconsistency.

### Grid layout reference

```
┌─ Left Panel (~20%) ──┬─ Main Grid (~80%) ──────────────────────────────────────┐
│ Reset Filters        │ Row 1: [Cohort Summary] [Gender] [Age at DX] [Stage]     │
│ Cohort Summary N=X   ├─────────────────────────────────────────────────────────┤
│ DATA ELEMENTS        │ Row 2: [Key Somatic Mutations — full width              ] │
│  └ Type dropdown     ├─────────────────────────────────────────────────────────┤
│  └ Metric dropdown   │ Row 3: [OS KM] [PFS KM] [Surgery] [Chemo Mix] [RT Mix]  │
│ Filter by Mutations  │                                                          │
│  └ Tumour Location   │                                                          │
│  └ Gene              │                                                          │
│ Gender filter        │                                                          │
│ Stage filter         │                                                          │
└──────────────────────┴──────────────────────────────────────────────────────────┘
```

### New files

```
mock-server/
  routes/
    cohortAnalytics.ts              GET /fhir/R4/cohort/analytics

src/
  views/
    CohortView.tsx                  Top-level cohort page layout
  components/
    cohort/
      ChartPanel.tsx                Reusable panel frame (title, border, skeleton)
      charts/
        GenderDistribution.tsx      Recharts donut
        AgeAtDiagnosis.tsx          Recharts bar
        CancerStageDistribution.tsx Recharts bar
        KeySomaticMutations.tsx     SVG OncoPrint waterfall
        KMChart.tsx                 D3 step-function + CI band (shared)
        OverallSurvivalKM.tsx       OS KM (uses KMChart)
        ProgressionFreeSurvivalKM.tsx PFS KM (uses KMChart)
        SurgeryMix.tsx              Recharts bar
        ChemotherapyMix.tsx         Recharts bar
        RadiotherapyMix.tsx         Recharts bar
  store/
    cohort.ts                       Zustand cohort store (filters + analytics)
  lib/
    cohortApi.ts                    fetchCohortAnalytics()
  types/
    cohortAnalytics.ts              CohortAnalyticsResponse interface
```

---

## Notes

- **Phase ordering**: 0 (foundation) → 1 (left panel) → 2, 3, 4 (chart rows) → 0b (population) → 5 (interactions) → 6 (layout/polish) → 7 (non-functional).
- **KM curves use D3** (step function + CI band). All simpler charts (bar, donut) use Recharts.
- **Shared design tokens** (colours, panel frame, typography) must be consistent with the Patient 360° view.
- **Filter round-trips target < 3 seconds** (spec §8.3). Static JSON responses will easily meet this in dev.
- **Phase 0b** should be done before Phase 5 — 10 patients produce flat/meaningless KM distributions.

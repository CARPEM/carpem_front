# CARPEM CMOT — Cohort Analytics Dashboard — Development Kanban

> Source spec: `specifications/cohort_view/CARPEM_CMOT_Cohort_Dashboard_Specification.pdf`
> Mockup: `specifications/cohort_view/cohort_view.jpg`
> Update this file as work progresses. Claude reads it at the start of each session.
> Columns: **Backlog** | **In Progress** | **Done**

---

## Done

*(move cards here when work is complete)*

---

## In Progress

*(move cards here when work begins)*

---

## Backlog

### Phase 0 — Foundation & Routing

- [ ] **View routing** — add React Router (or simple state router) to switch between Patient 360° view and Cohort view; shared AppShell nav bar with view toggle; URL: `/cohort`
- [ ] **Cohort AppShell / layout** — two-zone layout: Left Panel (~20%) + Main Grid (~80%); page title bar "FULL COHORT ANALYTICS DASHBOARD (N=X)" with dynamic N counter; fits 1920×1080 without scroll
- [ ] **Cohort Zustand store** — `src/store/cohort.ts`: active filters (data elements, mutations, cohort type), aggregated chart data (received from server), N count; filter changes trigger a new API call
- [ ] **Cohort analytics API endpoint** — `mock-server/routes/cohortAnalytics.ts`: `GET /fhir/R4/cohort/analytics?{filterParams}`; the mock server iterates over its in-memory patient bundles, computes aggregations server-side, and returns a lightweight JSON response with only the pre-computed chart data (gender counts, age bins, stage distribution, mutation frequencies, treatment mix, KM curve points); **no raw bundles are sent to the client**
- [ ] **Cohort API client** — `src/lib/cohortApi.ts`: `fetchCohortAnalytics(filters)` → GET `/fhir/R4/cohort/analytics?{filterParams}`; returns typed `CohortAnalyticsResponse`; filter params: `subject:Patient.gender`, `code`, `Condition.bodySite`, gene filter, stage filter
- [ ] **CohortAnalyticsResponse type** — `src/types/cohortAnalytics.ts`: typed interface for the aggregated response: `{ n: number, gender: {label,count}[], ageBins: {range,count}[], stages: {stage,count}[], mutations: {gene,variants:{type,count}[],pct}[], surgeryMix: {category,count,pct}[], chemoMix: {regimen,count,pct}[], rtMix: {type,count,pct}[], osCurve: KMPoint[], pfsCurve: KMPoint[] }`

### Phase 0b — Expand Mock Patient Population (optional)

- [ ] **Add simple patients to mock FHIR server** — add 20–40 minimal patients (Patient + Condition + a few Observations + a Procedure or MedicationAdministration each) directly in the mock server data; focus on: varied genders, age spread, different cancer stages, more deceased patients for meaningful KM curves; these are server-side only and never sent as full bundles to the client

### Phase 1 — Left Panel: Filter Controls (§3)

- [ ] **Cohort Summary Widget** — large "N=X" typographic counter with "COHORT SUMMARY" label; updates in real time as filters are applied; reads N from the `CohortAnalyticsResponse`
- [ ] **Data Elements Filter** — collapsible "DATA ELEMENTS" section with expand/collapse chevron; three cascading dropdowns: (1) Filter by Data Element type (All Data Elements, Demographics, Genomics, Treatment, Survival), (2) Filter by Category (dependent on first), (3) Data Elements metric (Percent of Patients / Absolute Count); each selection triggers a new API call with updated filter params
- [ ] **Filter by Mutations** — two-level mutation filter below Data Elements: (1) Tumor Location dropdown → Condition.bodySite, (2) Tumor Location laterality → bodySite laterality extension, (3) Free-text/coded value selector (e.g. "Unknown"); sent as filter params to the analytics endpoint
- [ ] **Reset filters button** — clears all active filters, re-fetches unfiltered analytics; restores N to total enrolled; positioned at top of left panel

### Phase 2 — Main Grid Row 1: Demographics (§4.1–4.3)

- [ ] **Gender Distribution** — Recharts donut chart; segments: Female (red), Male (blue), Other (orange), Unknown (grey); external legend with category + percentage; hover → absolute N + %; click segment → filters cohort by gender; source: `response.gender`
- [ ] **Age at Diagnosis** — Recharts vertical bar chart; X-axis bins: ≤39, 30–39, 40–49, 50–59, 60–69, 70–79, 80–89, 90+; Y-axis: patient count; bar colour: CARPEM teal (#1A7F8E); "Mean: X.X" annotation above chart; hover → bin range + N; click → applies age-range filter; source: `response.ageBins`
- [ ] **Cancer Stage Distribution** — Recharts vertical bar chart; X-axis: Stage I, II, III, IV, Unknown; Y-axis: patient count (absolute); bar value labels above each bar; bar colour: green (#2E7D4F); hover → stage + N; click → applies stage filter; source: `response.stages`

### Phase 3 — Main Grid Row 2: Genomics & Surgery (§4.4–4.5)

- [ ] **Key Somatic Mutations waterfall** — D3 horizontal stacked bar chart (OncoPrint-style); ~55% main grid width; Y-axis: top 8–10 genes by descending mutation frequency; X-axis: 0–100% with ticks at 0/50/100; bars segmented by variant type: Missense (blue), Nonsense (orange), Splice Site (teal/green), Disruptive nonsense (purple), Other (grey); colour legend below chart ("MUTATION LEGEND:"); right-hand % label per gene row; metric toggle driven by Data Elements dropdown (Percent of Patients / Absolute Count); search/filter input + magnifying glass icon in panel header; hover → gene name + variant type + N/%; click gene row → filters cohort; source: `response.mutations`
- [ ] **Surgery Mix** — Recharts vertical bar chart; positioned right of mutations panel (~45% row width); X-axis: Lumpectomy, Standard, Target, Combination (+ additional coded types); Y-axis: patient count; % labels above bars; alternating CARPEM palette (teal, orange, blue, green); hover → category + N/%; click → filters cohort; source: `response.surgeryMix`

### Phase 4 — Main Grid Row 3: Survival & Treatment Mix (§4.6–4.9)

- [ ] **Overall Survival (Kaplan-Meier)** — D3 step function chart; X-axis: years (0–5+); Y-axis: % Surviving (0–100%); 95% CI shaded band; up to 4 stratification curves colour-coded; inline legend; hover → time point + survival probability + N at risk + 95% CI; source: `response.osCurve` (KM computed server-side); N < 5 per stratum → "Insufficient data" placeholder
- [ ] **Progression-Free Survival (KM)** — identical to OS panel structure; event = first progression (Observation RECIST/LOINC 21976-6) or death; title: "PROGRESSION-FREE SURVIVAL (Kaplan-Meier)"; source: `response.pfsCurve`
- [ ] **Chemotherapy Mix** — Recharts vertical bar chart; X-axis: Standard, Target, Combination (+ additional regimen types); Y-axis: patient count; % labels above bars; bar colours: Blue (#4A7FB5) Standard, Orange (#D97706) Target, Purple (#7B4FBC) Combination — consistent with Patient 360° ATC scheme; hover tooltip; click → filters cohort; source: `response.chemoMix`
- [ ] **Radiotherapy Mix** — Recharts vertical bar chart; X-axis: Adjuvant Radiotherapy (+ additional coded types: Curative, Palliative); Y-axis: patient count; % labels above bars; bar colour: Purple (#7B4FBC); hover tooltip; click → filters; source: `response.rtMix`

### Phase 5 — Cohort Type Selector & Interactions (§5, §7)

- [ ] **Cohort Type selector dropdown** — top-right of page title bar; breadcrumb-style label (e.g. "Full Trial / Breast (Left) / Other"); options dynamically populated from config: Full Trial, by cancer type (Breast, Ovarian, Liver…), by laterality/histology sub-group; selection triggers new API call with Condition.code + bodySite filter; N counter + all panels re-render; selected state persisted in URL query params
- [ ] **Click-to-filter on all charts** — clicking any bar/donut segment/KM stratum/gene row applies that value as an additional cohort filter; triggers new API call; all panels re-render; N counter updates; filters are additive (logical AND)
- [ ] **URL state persistence** — encode active cohort type + all filter params in URL query string for shareability; no PHI in URL (no patient IDs, only aggregate filter values like stage=II)

### Phase 6 — Shared Components & Polish

- [ ] **Chart panel frame component** — reusable panel wrapper: title (small uppercase), optional subtitle, 1px border, white background, independent scroll if content overflows; shared across all 9 chart panels
- [ ] **Hover tooltip component (cohort)** — consistent tooltip across all chart panels: label + N + %; KM curves: time point + survival probability + N at risk + 95% CI
- [ ] **Responsive grid layout** — 3-row grid with correct proportions: Row 1 (summary + 3 charts), Row 2 (mutations ~55% + surgery ~45%), Row 3 (4 charts equal width); all panels equal height per row; no page scroll at 1920×1080

### Phase 7 — Accessibility & Non-Functional

- [ ] **Keyboard navigation** — Tab/Enter/Escape on all chart elements and filters; ARIA labels on chart regions
- [ ] **Statistical validity guard** — KM curves: do not render when N < 5 per stratum; show "Insufficient data" placeholder
- [ ] **Loading states** — skeleton loaders while analytics API responds; error state if server unreachable

---

## Architecture

### Data flow
```
Client (cohort view)                    Mock FHIR Server (port 3001)
─────────────────────                   ────────────────────────────
CohortView mounts
  │
  ├─► GET /fhir/R4/cohort/analytics ──► Server iterates over in-memory
  │   ?gender=female&stage=III          patient bundles, applies filters,
  │                                     computes aggregations
  │                                       │
  │   ◄── CohortAnalyticsResponse ──────┘
  │   (lightweight JSON: counts,        Only aggregated numbers are
  │    percentages, KM points)          returned — no raw bundles
  │
  ├─► Zustand store updated
  ├─► All chart panels re-render
  └─► N counter updates
```

### Key principle
**All aggregation happens server-side** (in the mock server during dev, in the production FHIR analytics API later). The client receives only pre-computed chart data — never raw patient bundles. This keeps the browser memory footprint minimal and mirrors the production architecture.

---

## Notes

- The cohort view is a **separate page** from the Patient 360° view, sharing the same AppShell nav bar.
- The **mock server already holds all 10 patient bundles in memory** (loaded at startup from `src/data/`). The new `/cohort/analytics` endpoint aggregates over them server-side and returns only computed chart data.
- Phase 0b optionally adds 20–40 lightweight patients **server-side only** for better distributions (more deceased patients for KM, wider age/stage spread). These never leave the server as raw bundles.
- The **mutation waterfall** is the most complex panel (D3, stacked bars, search, metric toggle). Plan extra time.
- **Click-to-filter** triggers a new API call each time. The server re-aggregates with the updated filter set. Keep filter round-trips fast (target < 200ms for 50 patients).
- KM curves require **D3** (step function + CI band). The simpler charts (bar, donut) use **Recharts**.
- Shared design tokens (colours, typography, panel frames) should be consistent with the Patient 360° view.
- Phase ordering: 0 (foundation + server endpoint) → 1 (filters) → 2–4 (charts, parallelisable) → 5 (interactions) → 6–7 (polish).

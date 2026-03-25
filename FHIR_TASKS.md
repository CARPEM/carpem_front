# Mock FHIR R4 Server — Development Kanban

Standalone Express server exposing the 10 mock patients and cohort analytics
through a minimal FHIR R4 HTTP API. Runs on port **3001**.

Reference spec: https://www.hl7.org/fhir/http.html

---

## Done

### Server scaffold
- [x] **`mock-server/package.json`** — dependencies: express, cors; dev: tsx, @types/express, @types/cors, @types/node
- [x] **`mock-server/tsconfig.json`** — NodeNext modules, paths `@/*` → `../src/*`
- [x] **`mock-server/server.ts`** — Express app with CORS, JSON, mounted routes, listen on PORT (default 3001)

### Patient endpoints
- [x] **`routes/metadata.ts`** — `GET /fhir/R4/metadata` → minimal CapabilityStatement (FHIR 4.0.1)
- [x] **`routes/patients.ts`** — three handlers:
  - `GET /fhir/R4/Patient` → searchset Bundle, 10 entries, Bundle.total
  - `GET /fhir/R4/Patient/:id` → single Patient or 404 OperationOutcome
  - `GET /fhir/R4/Patient/:id/$everything` → paginated collection Bundle (`_count`, `_page`)
- [x] **`src/lib/fhirApi.ts`** — `fetchPatientList()` and `fetchPatientEverything()` with Bundle.link[next] pagination
- [x] **App wired to FHIR server** — static bundle imports removed; patient list and bundles fetched on demand
- [x] **`VITE_FHIR_BASE_URL` env var** — configurable base URL, default `http://localhost:3001/fhir/R4`

### Cohort analytics endpoint
- [x] **`routes/cohortAnalytics.ts`** — `GET /fhir/R4/cohort/analytics`
  - Filter params: `gender`, `stage`, `bodySite`, `gene`, `code`
  - Phase param: `demographics` (n + gender + ageBins + stages) or `full` (+ oncoPrint + surgeryMix + chemoMix + rtMix + osCurve + pfsCurve)
  - All aggregation server-side; raw bundles never sent to client
- [x] **OncoPrint matrix** — `computeOncoPrint()` builds patient × gene matrix; patients sorted lexicographically by mutation status (most-frequent gene first); top 10 genes by alteration frequency
- [x] **Kaplan-Meier** — `kaplanMeier()` product-limit estimator with Greenwood's 95% CI; OS + PFS curves
- [x] **Surgery normalisation** — `normalizeSurgeryLabel()` (imported from `src/config/cohortConfig.ts`) collapses verbose procedure texts to canonical category names
- [x] **Variant dual-detection** — genomic-variant category OR LOINC 69548-6 to cover P1/P2 bundle inconsistency
- [x] **Stage normalisation** — four top-level buckets (I/II/III/IV); sub-stages (IIA, IIIB…) collapsed
- [x] **`src/lib/cohortApi.ts`** — `fetchCohortAnalytics(filters, phase)`

### Mock patient population
- [x] **10 named patients** (`src/data/`) — full FHIR bundles for the Patient 360° view
- [x] **90 synthetic patients** (`mock-server/data/syntheticPatients.ts`) — lightweight bundles for cohort analytics; server-side only; ~48F/42M; Stage I×19/II×28/III×29/IV×19; body sites Breast/Colon/Lung/Ovary; ~50 patients carry genomic variants

---

## Backlog

- [ ] **`/patient/:id` deep-link** — URL routing so reloading `/patient/p1` loads the correct patient without going via the dropdown

---

## Endpoint Reference

| Method | Path | FHIR type | Notes |
|--------|------|-----------|-------|
| `GET` | `/fhir/R4/metadata` | CapabilityStatement | Always 200 |
| `GET` | `/fhir/R4/Patient` | Bundle (searchset) | 10 named patients |
| `GET` | `/fhir/R4/Patient/:id` | Patient | 404 OperationOutcome if unknown |
| `GET` | `/fhir/R4/Patient/:id/$everything` | Bundle (collection) | `?_count=N&_page=N` |
| `GET` | `/fhir/R4/cohort/analytics` | JSON (custom) | `?phase=demographics\|full&gender=&stage=&bodySite=&gene=` |

## Running

```bash
cd mock-server
npm install
npm start           # http://localhost:3001

# Custom port
PORT=8080 npm start
```

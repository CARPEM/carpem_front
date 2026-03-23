# Mock FHIR R4 Server — Development Kanban

Standalone Express server exposing the 10 mock patients through a minimal
FHIR R4 HTTP API. Runs on port **3001**, separate from the Vite dev server.

Reference spec: https://www.hl7.org/fhir/http.html

---

## Done

- [x] **Kanban file** — `FHIR_TASKS.md` created
- [x] **`mock-server/package.json`** — dependencies: express, cors; dev: tsx, @types/express, @types/cors, @types/node
- [x] **`mock-server/tsconfig.json`** — NodeNext modules, paths `@/*` → `../src/*` for type checking
- [x] **`mock-server/routes/metadata.ts`** — `GET /fhir/R4/metadata` → minimal CapabilityStatement (FHIR 4.0.1, REST server, Patient resource)
- [x] **`mock-server/routes/patients.ts`** — three handlers:
  - `GET /fhir/R4/Patient` → searchset Bundle, 10 entries, Bundle.total
  - `GET /fhir/R4/Patient/:id` → single Patient or 404 OperationOutcome
  - `GET /fhir/R4/Patient/:id/$everything` → paginated collection Bundle (`_count`, `_page`), Bundle.link self + next
- [x] **`mock-server/server.ts`** — Express app with CORS, JSON, mounted routes, listen on PORT (default 3001)
- [x] **Dependencies installed** — `npm install` run in `mock-server/`
- [x] **Smoke tests** — all endpoints verified with curl

---

- [x] **`src/lib/fhirApi.ts`** — `fetchPatientList()` and `fetchPatientEverything()` with Bundle.link[next] pagination following
- [x] **Update `App.tsx`** — static `BUNDLES[]` imports removed; patient list fetched on mount; bundle fetched on demand per patient switch; loading state disables switcher; error banner on fetch failure; fixes 1.3 GB memory issue
- [x] **`VITE_FHIR_BASE_URL` env var** — configurable base URL, default `http://localhost:3001/fhir/R4`; documented in `.env.example`

---

## In Progress

*(move cards here when work begins)*

---

## Backlog

- [ ] **Patient selector / URL routing** — `/patient/:id` route so deep-linking to a patient works across page reloads

---

## Endpoint Reference

| Method | Path | FHIR type | Notes |
|--------|------|-----------|-------|
| `GET` | `/fhir/R4/metadata` | CapabilityStatement | Always 200 |
| `GET` | `/fhir/R4/Patient` | Bundle (searchset) | 10 patients |
| `GET` | `/fhir/R4/Patient/:id` | Patient | 404 OperationOutcome if unknown |
| `GET` | `/fhir/R4/Patient/:id/$everything` | Bundle (collection) | `?_count=N&_page=N` |

## Running

```bash
cd mock-server
npm install
npm start           # http://localhost:3001

# Custom port
PORT=8080 npm start
```

import express from 'express'
import cors from 'cors'
import { handleMetadata } from './routes/metadata.ts'
import { handlePatientList, handlePatientRead, handleEverything } from './routes/patients.ts'
import { handleCohortAnalytics } from './routes/cohortAnalytics.ts'

const app = express()
const PORT = parseInt(process.env['PORT'] ?? '3001', 10)
const BASE = '/fhir/R4'

app.use(cors())
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.redirect(`${BASE}/metadata`))
app.get(BASE, (_req, res) => res.redirect(`${BASE}/metadata`))
app.get(`${BASE}/metadata`,                         handleMetadata)
app.get(`${BASE}/Patient`,                          handlePatientList)
app.get(`${BASE}/Patient/:id`,                      handlePatientRead)
app.get(`${BASE}/Patient/:id/\\$everything`,        handleEverything)
app.get(`${BASE}/cohort/analytics`,                handleCohortAnalytics)

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    resourceType: 'OperationOutcome',
    issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Route not found' }],
  })
})

app.listen(PORT, () => {
  console.log(`CARPEM mock FHIR R4 server running on http://localhost:${PORT}${BASE}`)
  console.log(`  GET ${BASE}/metadata`)
  console.log(`  GET ${BASE}/Patient`)
  console.log(`  GET ${BASE}/Patient/:id`)
  console.log(`  GET ${BASE}/Patient/:id/$everything`)
  console.log(`  GET ${BASE}/cohort/analytics`)
})

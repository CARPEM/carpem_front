import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import CohortView from '@/views/CohortView'
import PatientView from '@/views/PatientView'
import { fetchPatientList } from '@/lib/fhirApi'

/** Fetches the patient list and redirects to the first patient's URL. */
function PatientRedirect() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPatientList()
      .then((list) => {
        if (list[0]?.id) navigate(`/patient/${list[0].id}`, { replace: true })
        else setError('No patients found')
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [navigate])

  if (error) return (
    <div className="flex items-center justify-center flex-1 text-red-600 text-sm">{error}</div>
  )
  return (
    <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
      Loading patients…
    </div>
  )
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/"            element={<Navigate to="/cohort" replace />} />
        <Route path="/cohort"      element={<CohortView />} />
        <Route path="/patient"     element={<PatientRedirect />} />
        <Route path="/patient/:id" element={<PatientView />} />
      </Routes>
    </AppShell>
  )
}

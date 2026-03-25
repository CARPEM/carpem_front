import { useEffect, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LeftPanel from '@/components/panels/LeftPanel'
import CentrePanel from '@/components/panels/CentrePanel'
import RightPanel from '@/components/panels/RightPanel'
import ProcedureDrawer from '@/components/ui/ProcedureDrawer'
import { usePatientStore } from '@/store/patient'
import { fetchPatientList, fetchPatientEverything } from '@/lib/fhirApi'
import type { FhirPatient } from '@/types/fhir'

function patientLabel(p: FhirPatient): string {
  return (
    p.identifier?.find((i) => i.use === 'official')?.value ?? p.id ?? '?'
  )
}

export default function PatientView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loadBundle, patient } = usePatientStore()

  const [patients, setPatients] = useState<FhirPatient[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Fetch patient list for the switcher
  useEffect(() => {
    fetchPatientList()
      .then(setPatients)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  // Load the bundle whenever the URL id changes
  const loadPatient = useCallback(
    (patientId: string) => {
      setLoading(true)
      setError(null)
      fetchPatientEverything(patientId)
        .then((bundle) => loadBundle(bundle))
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setLoading(false))
    },
    [loadBundle],
  )

  useEffect(() => {
    if (id) loadPatient(id)
  }, [id, loadPatient])

  const patientId =
    patient?.identifier?.find((i) => i.use === 'official')?.value ??
    patient?.id ??
    '—'

  const switcher = (
    <select
      value={id ?? ''}
      disabled={loading || patients.length === 0}
      onChange={(e) => navigate(`/patient/${e.target.value}`)}
      className="bg-[#1B2A4A] border border-blue-300/50 text-blue-100 text-xs font-semibold rounded px-2 py-0.5 disabled:opacity-50 cursor-pointer hover:border-blue-300 focus:outline-none"
    >
      {patients.map((p) => (
        <option key={p.id} value={p.id ?? ''}>
          {patientLabel(p)}
        </option>
      ))}
    </select>
  )

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Page title bar */}
      <div className="px-5 py-2 bg-[#dce8f0] shrink-0 border-b border-[#b8d0e0] flex items-center justify-between">
        <h1 className="text-xl font-black tracking-widest text-[#1B2A4A] uppercase">
          Single Patient 360-Degree Profile:{' '}
          <span className="font-black">{patientId}</span>
        </h1>
        {switcher}
      </div>

      {error && (
        <div className="flex items-center justify-center bg-red-50 text-red-700 text-sm px-4 py-2 border-b border-red-200 shrink-0">
          FHIR server error: {error}
        </div>
      )}

      {/* Three-column layout */}
      <div className="flex flex-1 min-h-0 bg-[#dce8f0]">
        <LeftPanel />
        <CentrePanel />
        <RightPanel />
      </div>

      <ProcedureDrawer />
    </div>
  )
}

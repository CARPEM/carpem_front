import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import LeftPanel from '@/components/panels/LeftPanel'
import CentrePanel from '@/components/panels/CentrePanel'
import RightPanel from '@/components/panels/RightPanel'
import ProcedureDrawer from '@/components/ui/ProcedureDrawer'
import { usePatientStore } from '@/store/patient'
import { fetchPatientList, fetchPatientEverything } from '@/lib/fhirApi'
import type { FhirPatient } from '@/types/fhir'

function patientLabel(p: FhirPatient): string {
  return (
    p.identifier?.find((i) => i.use === 'official')?.value ??
    p.id ??
    '?'
  )
}

export default function App() {
  const { loadBundle, patient } = usePatientStore()

  const [patients, setPatients]       = useState<FhirPatient[]>([])
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // On mount — fetch the patient list and auto-select the first one
  useEffect(() => {
    fetchPatientList()
      .then((list) => {
        setPatients(list)
        if (list[0]?.id) setSelectedId(list[0].id)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  // Whenever the selected patient changes — fetch their full bundle
  const loadPatient = useCallback(
    (id: string) => {
      setLoading(true)
      setError(null)
      fetchPatientEverything(id)
        .then((bundle) => loadBundle(bundle))
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setLoading(false))
    },
    [loadBundle],
  )

  useEffect(() => {
    if (selectedId) loadPatient(selectedId)
  }, [selectedId, loadPatient])

  const patientId =
    patient?.identifier?.find((i) => i.use === 'official')?.value ??
    patient?.id ??
    '—'

  const switcher = (
    <select
      value={selectedId ?? ''}
      disabled={loading || patients.length === 0}
      onChange={(e) => setSelectedId(e.target.value)}
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
    <>
      <AppShell patientId={patientId} patientSwitcher={switcher}>
        {error && (
          <div className="col-span-3 flex items-center justify-center bg-red-50 text-red-700 text-sm px-4 py-2 border-b border-red-200">
            FHIR server error: {error}
          </div>
        )}
        <LeftPanel />
        <CentrePanel />
        <RightPanel />
      </AppShell>
      <ProcedureDrawer />
    </>
  )
}

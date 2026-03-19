import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import LeftPanel from '@/components/panels/LeftPanel'
import CentrePanel from '@/components/panels/CentrePanel'
import RightPanel from '@/components/panels/RightPanel'
import ProcedureDrawer from '@/components/ui/ProcedureDrawer'
import { usePatientStore } from '@/store/patient'
import { mockBundle } from '@/data/mockBundle'
import { mockBundle2 } from '@/data/mockBundle2'
import {
  mockBundle3,
  mockBundle4,
  mockBundle5,
  mockBundle6,
  mockBundle7,
  mockBundle8,
  mockBundle9,
  mockBundle10,
} from '@/data/mockBundlesExtra'

const BUNDLES = [
  mockBundle,
  mockBundle2,
  mockBundle3,
  mockBundle4,
  mockBundle5,
  mockBundle6,
  mockBundle7,
  mockBundle8,
  mockBundle9,
  mockBundle10,
]

export default function App() {
  const { loadBundle, patient } = usePatientStore()
  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => {
    loadBundle(BUNDLES[selectedIdx])
  }, [loadBundle, selectedIdx])

  const patientId =
    patient?.identifier?.find((i) => i.use === 'official')?.value ??
    patient?.id ??
    '—'

  const switcher = (
    <div className="flex items-center gap-1">
      {BUNDLES.map((_, i) => (
        <button
          key={i}
          onClick={() => setSelectedIdx(i)}
          className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
            selectedIdx === i
              ? 'bg-white text-[#1B2A4A]'
              : 'text-blue-200 hover:text-white border border-blue-300/40 hover:border-blue-300/80'
          }`}
        >
          Patient {i + 1}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <AppShell patientId={patientId} patientSwitcher={switcher}>
        <LeftPanel />
        <CentrePanel />
        <RightPanel />
      </AppShell>
      <ProcedureDrawer />
    </>
  )
}

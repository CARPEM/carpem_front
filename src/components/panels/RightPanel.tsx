import MolecularPanel from '@/components/widgets/MolecularPanel'
import BiomarkerSparklines from '@/components/widgets/BiomarkerSparklines'

export default function RightPanel() {
  return (
    <div className="w-[25%] flex flex-col overflow-y-auto p-2.5 gap-2.5 shrink-0">
      <MolecularPanel />
      <BiomarkerSparklines />
    </div>
  )
}

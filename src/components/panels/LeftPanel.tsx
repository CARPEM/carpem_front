import PatientIdentifier from '@/components/widgets/PatientIdentifier'
import ClinicalNotes from '@/components/widgets/ClinicalNotes'

export default function LeftPanel() {
  return (
    <div className="w-[18%] flex flex-col overflow-hidden p-2.5 gap-2.5 shrink-0">
      <PatientIdentifier />
      <ClinicalNotes />
    </div>
  )
}

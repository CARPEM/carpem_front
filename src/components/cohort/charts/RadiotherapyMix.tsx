import { useCohortStore } from '@/store/cohort'
import TreatmentBarChart from './TreatmentBarChart'

export default function RadiotherapyMix() {
  const data = useCohortStore((s) => s.analytics?.rtMix ?? [])
  return (
    <TreatmentBarChart
      data={data}
      getColor={() => '#7B4FBC'}
      maxLabelChars={14}
    />
  )
}

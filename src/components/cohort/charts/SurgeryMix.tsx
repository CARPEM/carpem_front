import { useCohortStore } from '@/store/cohort'
import { getActiveCohortConfig } from '@/config/cohortConfig'
import TreatmentBarChart from './TreatmentBarChart'

const PALETTE = ['#1A7F8E', '#D97706', '#4A7FB5', '#2E7D4F', '#7B4FBC', '#DC2626']

export default function SurgeryMix() {
  const raw    = useCohortStore((s) => s.analytics?.surgeryMix ?? [])
  const bodySite = useCohortStore((s) => s.filters.bodySite)
  const config = getActiveCohortConfig(bodySite)

  const order  = config.surgeryTypes
  const data   = [
    ...order.map((cat) => raw.find((d) => d.category === cat)).filter(Boolean),
    ...raw.filter((d) => !order.includes(d.category)).sort((a, b) => b.count - a.count),
  ] as typeof raw

  return (
    <TreatmentBarChart
      data={data}
      getColor={(_, i) => PALETTE[i % PALETTE.length]}
      maxLabelChars={14}
    />
  )
}

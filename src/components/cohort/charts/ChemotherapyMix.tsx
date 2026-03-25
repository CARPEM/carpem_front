import { useCohortStore } from '@/store/cohort'
import { getActiveCohortConfig } from '@/config/cohortConfig'
import TreatmentBarChart from './TreatmentBarChart'
import type { TreatmentItem } from '@/types/cohortAnalytics'

const CATEGORY_COLOR: Record<string, string> = {
  'Standard chemotherapy': '#4A7FB5',
  'Immunotherapy':         '#7B4FBC',
  'Targeted / mAb':        '#2E7D4F',
  'Hormone therapy':       '#D97706',
}

const getColor = (entry: TreatmentItem) =>
  CATEGORY_COLOR[entry.category] ?? '#6B7280'

export default function ChemotherapyMix() {
  const raw    = useCohortStore((s) => s.analytics?.chemoMix ?? [])
  const bodySite = useCohortStore((s) => s.filters.bodySite)
  const config = getActiveCohortConfig(bodySite)

  const order = config.chemoTypes
  const data  = [
    ...order.map((cat) => raw.find((d) => d.category === cat)).filter(Boolean),
    ...raw.filter((d) => !order.includes(d.category)).sort((a, b) => b.count - a.count),
  ] as typeof raw

  return <TreatmentBarChart data={data} getColor={getColor} />
}

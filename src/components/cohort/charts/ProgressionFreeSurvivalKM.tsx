import { useCohortStore } from '@/store/cohort'
import KMChart from './KMChart'

export default function ProgressionFreeSurvivalKM() {
  const { analytics } = useCohortStore()
  const data = analytics?.pfsCurve ?? []

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-gray-400 italic">
        No data
      </div>
    )
  }

  return <KMChart data={data} color="#4A7FB5" />
}

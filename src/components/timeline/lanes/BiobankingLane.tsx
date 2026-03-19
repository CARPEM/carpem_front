import { usePatientStore } from '@/store/patient'
import { useTimelineStore } from '@/store/timeline'
import { toMonthsFromT0 } from '@/lib/t0'
import { formatDate, formatTemporalLabel } from '@/lib/formatters'
import { LABEL_WIDTH } from '../constants'
import type { MarkerInfo } from '../types'

const CONTEXT_COLORS: Record<string, string> = {
  'baseline': '#0D9488',      // teal
  'on-treatment': '#3B82F6',  // blue
  'at-progression': '#DC2626', // red
}
const CONTEXT_URL = 'http://carpem.fr/fhir/StructureDefinition/collection-context'

function getContext(specimen: fhir4.Specimen): string {
  return specimen.extension?.find((e) => e.url === CONTEXT_URL)?.valueCode ?? 'baseline'
}

function getSampleType(specimen: fhir4.Specimen): 'tube' | 'biopsy' | 'funnel' {
  const text = (specimen.type?.text ?? specimen.type?.coding?.[0]?.display ?? '').toLowerCase()
  if (text.includes('blood') || text.includes('serum') || text.includes('plasma')) return 'tube'
  if (text.includes('ffpe') || text.includes('block')) return 'funnel'
  return 'biopsy'  // tissue biopsy default
}

// Tube icon from icons/tube.svg — viewBox "-5 -10 110 135", content spans x≈[28,72] y≈[4,96]
// scale(0.40) translate(-50,-50) maps the content to ~37px tall centred at origin
function TubeIcon({ color }: { color: string }) {
  return (
    <g transform="scale(0.40) translate(-50,-50)" fill={color} opacity={0.9}>
      <path d="m65.699 4h-31.398c-3.3008 0-6 2.6992-6 6v6.3984c0 2.8008 1.8984 5.1016 4.3984 5.8008v56.5c0 9.5 7.8008 17.301 17.301 17.301s17.301-7.8008 17.301-17.301v-56.5c2.5-0.69922 4.3984-3 4.3984-5.8008v-6.3984c0-3.3008-2.6992-6-6-6zm-2.3984 36.5h-5.3008c-1.1016 0-2 0.89844-2 2s0.89844 2 2 2h5.3008v5h-7.3008c-1.1016 0-2 0.89844-2 2s0.89844 2 2 2h7.3008v5h-5.3008c-1.1016 0-2 0.89844-2 2s0.89844 2 2 2h5.3008v5h-7.3008c-1.1016 0-2 0.89844-2 2s0.89844 2 2 2h7.3008v5h-5.3008c-1.1016 0-2 0.89844-2 2s0.89844 2 2 2h5.1016c-0.90234 6.6016-6.4023 11.5-13.102 11.5-7.3008 0-13.301-6-13.301-13.301v-43.199h26.602zm0-9h-26.602v-9.1016h26.602zm4.3984-15.102c0 1.1016-0.89844 2-2 2h-31.398c-1.1016 0-2-0.89844-2-2v-6.3984c0-1.1016 0.89844-2 2-2h31.398c1.1016 0 2 0.89844 2 2z" />
    </g>
  )
}


function FunnelIcon({ color }: { color: string }) {
  return <TubeIcon color={color} />
}

// Biopsy icon from icons/biopsy.svg — viewBox "-5 -10 110 135", content centred at (50,50)
function BiopsyIcon({ color }: { color: string }) {
  return (
    <g transform="scale(0.40) translate(-50,-50)" fill={color} opacity={0.9}>
      <path d="m43.668 79.738c-0.37109 0-0.74609-0.14062-1.0273-0.42578l-20.57-20.57c-0.27344-0.27344-0.42578-0.64453-0.42578-1.0273 0-0.38672 0.15234-0.75391 0.42578-1.0273l41.141-41.145c0.27344-0.27344 0.64453-0.42578 1.0273-0.42578 0.38672 0 0.75391 0.15234 1.0273 0.42578l20.574 20.57c0.56641 0.56641 0.56641 1.4883 0 2.0586l-41.141 41.141c-0.28516 0.28516-0.65625 0.42578-1.0312 0.42578zm-18.512-22.023 18.512 18.512 39.082-39.082-18.512-18.516z" />
      <path d="m32.355 76.652c-0.37109 0-0.74609-0.14062-1.0273-0.42578l-6.1719-6.1719c-0.27344-0.27344-0.42578-0.64453-0.42578-1.0273 0-0.38672 0.15234-0.75391 0.42578-1.0273l4.1133-4.1133c0.56641-0.56641 1.4883-0.56641 2.0586 0l6.1719 6.1719c0.27344 0.27344 0.42578 0.64453 0.42578 1.0273 0 0.38672-0.15234 0.75391-0.42578 1.0273l-4.1172 4.1133c-0.28125 0.28516-0.65625 0.42578-1.0273 0.42578zm-4.1133-7.625 4.1133 4.1133 2.0586-2.0586-4.1133-4.1133z" />
      <path d="m47.785 30.867c-2.7188 0-5.2773-1.0586-7.1992-2.9805-1.9219-1.9219-2.9805-4.4805-2.9805-7.1992s1.0586-5.2773 2.9805-7.1992c1.9219-1.9219 4.4805-2.9805 7.1992-2.9805s5.2773 1.0586 7.1992 2.9805 2.9805 4.4805 2.9805 7.1992-1.0586 5.2773-2.9805 7.1992-4.4766 2.9805-7.1992 2.9805zm0-17.453c-1.9414 0-3.7695 0.75781-5.1406 2.1289-1.375 1.375-2.1289 3.1992-2.1289 5.1406s0.75781 3.7695 2.1289 5.1445c1.375 1.375 3.1992 2.1289 5.1406 2.1289s3.7695-0.75781 5.1406-2.1289c1.375-1.375 2.1289-3.1992 2.1289-5.1445 0-1.9414-0.75781-3.7695-2.1289-5.1406-1.3711-1.3711-3.1953-2.1289-5.1406-2.1289z" />
      <path d="m80.699 63.777c-2.6094 0-5.2148-0.99219-7.1992-2.9766-3.9688-3.9688-3.9688-10.43 0-14.398 1.9219-1.9219 4.4805-2.9805 7.1992-2.9805s5.2773 1.0586 7.1992 2.9805c3.9688 3.9688 3.9688 10.43 0 14.398-1.9844 1.9844-4.5898 2.9766-7.1992 2.9766zm0-17.449c-1.9414 0-3.7695 0.75781-5.1406 2.1289-2.8359 2.8359-2.8359 7.4492 0 10.285 1.375 1.375 3.1992 2.1289 5.1406 2.1289 1.9414 0 3.7695-0.75781 5.1406-2.1289 2.8359-2.8359 2.8359-7.4492 0-10.285-1.3711-1.375-3.1992-2.1289-5.1406-2.1289z" />
      <path d="m79.668 33.457c-0.37109 0-0.74609-0.14062-1.0273-0.42578l-10.285-10.285c-0.56641-0.56641-0.56641-1.4883 0-2.0586l8.2266-8.2266c0.56641-0.56641 1.4883-0.56641 2.0586 0l10.285 10.285c0.56641 0.56641 0.56641 1.4883 0 2.0586l-8.2266 8.2266c-0.28906 0.28125-0.66016 0.42578-1.0312 0.42578zm-8.2305-11.742 8.2266 8.2266 6.1719-6.1719-8.2266-8.2266z" />
      <path d="m90.98 28.312c-0.38672 0-0.75391-0.15234-1.0273-0.42578l-16.457-16.457c-0.56641-0.56641-0.56641-1.4883 0-2.0586l4.1133-4.1133c0.27344-0.27344 0.64453-0.42578 1.0273-0.42578 0.38672 0 0.75391 0.15234 1.0273 0.42578l16.457 16.457c0.56641 0.56641 0.56641 1.4883 0 2.0586l-4.1133 4.1133c-0.26953 0.27344-0.64062 0.42578-1.0273 0.42578zm-14.398-17.91 14.398 14.398 2.0586-2.0586-14.398-14.398z" />
      <path d="m7.6758 95.168c-0.37109 0-0.74609-0.14062-1.0273-0.42578-0.56641-0.56641-0.56641-1.4883 0-2.0586l21.598-21.598c0.56641-0.56641 1.4883-0.56641 2.0586 0 0.56641 0.56641 0.56641 1.4883 0 2.0586l-21.602 21.598c-0.28516 0.28125-0.65625 0.42578-1.0273 0.42578z" />
      <path d="m50.871 72.539c-0.37109 0-0.74609-0.14062-1.0273-0.42578l-20.57-20.57c-0.56641-0.56641-0.56641-1.4883 0-2.0586 0.56641-0.56641 1.4883-0.56641 2.0586 0l20.57 20.57c0.56641 0.56641 0.56641 1.4883 0 2.0586-0.28516 0.28516-0.65625 0.42578-1.0312 0.42578z" />
      <path d="m67.328 35.512c-0.37109 0-0.74609-0.14062-1.0273-0.42578l-6.1719-6.1719c-0.56641-0.56641-0.56641-1.4883 0-2.0586 0.56641-0.56641 1.4883-0.56641 2.0586 0l6.1719 6.1719c0.56641 0.56641 0.56641 1.4883 0 2.0586-0.28516 0.28516-0.66016 0.42578-1.0312 0.42578z" />
      <path d="m61.156 41.684c-0.37109 0-0.74609-0.14062-1.0273-0.42578l-6.1719-6.1719c-0.56641-0.56641-0.56641-1.4883 0-2.0586 0.57031-0.56641 1.4883-0.56641 2.0586 0l6.1719 6.1719c0.56641 0.56641 0.56641 1.4883 0 2.0586-0.28516 0.28516-0.65625 0.42578-1.0312 0.42578z" />
      <path d="m54.988 47.855c-0.37109 0-0.74609-0.14062-1.0273-0.42578l-6.1719-6.1719c-0.56641-0.56641-0.56641-1.4883 0-2.0586 0.56641-0.56641 1.4883-0.56641 2.0586 0l6.1719 6.1719c0.56641 0.56641 0.56641 1.4883 0 2.0586-0.28906 0.28125-0.66016 0.42578-1.0312 0.42578z" />
      <path d="m48.816 54.027c-0.37109 0-0.74609-0.14062-1.0273-0.42578l-6.1719-6.1719c-0.56641-0.56641-0.56641-1.4883 0-2.0586 0.56641-0.56641 1.4883-0.56641 2.0586 0l6.1719 6.1719c0.56641 0.56641 0.56641 1.4883 0 2.0586-0.28906 0.28125-0.66016 0.42578-1.0312 0.42578z" />
    </g>
  )
}

interface Props {
  laneY: number
  laneHeight: number
  plotWidth: number
  onHover: (info: MarkerInfo | null, e?: React.MouseEvent) => void
  onClickSpecimen?: (id: string) => void
}

export default function BiobankingLane({ laneY, laneHeight, plotWidth, onHover, onClickSpecimen }: Props) {
  const { specimens, t0 } = usePatientStore()
  const { zoom, offset } = useTimelineStore()

  if (!t0) return null

  const toX = (months: number) => LABEL_WIDTH + (months - offset) * zoom
  const cy = laneY + laneHeight / 2

  return (
    <g>
      {specimens.map((specimen) => {
        const dateStr = specimen.collection?.collectedDateTime
        if (!dateStr) return null
        const date = new Date(dateStr)
        const x = toX(toMonthsFromT0(date, t0))
        if (x < LABEL_WIDTH - 20 || x > LABEL_WIDTH + plotWidth + 20) return null

        const context = getContext(specimen)
        const sampleType = getSampleType(specimen)
        const color = CONTEXT_COLORS[context] ?? '#6B7280'
        const label = specimen.type?.text ?? specimen.type?.coding?.[0]?.display ?? 'Specimen'

        return (
          <g
            key={specimen.id}
            transform={`translate(${x}, ${cy})`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) =>
              onHover(
                {
                  resourceType: `Specimen (${context})`,
                  label,
                  date: formatDate(dateStr),
                  temporal: formatTemporalLabel(date, t0),
                },
                e,
              )
            }
            onMouseLeave={() => onHover(null)}
            onClick={() => specimen.id && onClickSpecimen?.(specimen.id)}
          >
            {/* Invisible hit area */}
            <rect x={-22} y={-22} width={44} height={44} fill="transparent" />
            {sampleType === 'tube' && <TubeIcon color={color} />}
            {sampleType === 'biopsy' && <BiopsyIcon color={color} />}
            {sampleType === 'funnel' && <FunnelIcon color={color} />}
          </g>
        )
      })}
    </g>
  )
}

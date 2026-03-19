import { usePatientStore } from '@/store/patient'
import { useSelectionStore } from '@/store/selection'
import { formatDate, formatTemporalLabel } from '@/lib/formatters'
import SideDrawer from './SideDrawer'

const SURGERY_CODE = '387713003'
const RT_CODE = '108290001'

function categoryLabel(proc: fhir4.Procedure): string {
  const code = proc.category?.coding?.[0]?.code
  if (code === SURGERY_CODE) return 'Surgery'
  if (code === RT_CODE) return 'Radiotherapy'
  return proc.category?.text ?? proc.category?.coding?.[0]?.display ?? 'Procedure'
}

function categoryColor(proc: fhir4.Procedure): string {
  const code = proc.category?.coding?.[0]?.code
  if (code === SURGERY_CODE) return 'bg-blue-100 text-blue-800'
  if (code === RT_CODE) return 'bg-purple-100 text-purple-800'
  return 'bg-gray-100 text-gray-700'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <dt className="text-[13px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-base text-gray-800 font-medium">{value}</dd>
    </div>
  )
}

export default function ProcedureDrawer() {
  const { procedures, t0 } = usePatientStore()
  const { selectedProcedureId, setSelectedProcedure } = useSelectionStore()

  const proc = procedures.find((p) => p.id === selectedProcedureId)

  const title = proc
    ? proc.code?.text ?? proc.code?.coding?.[0]?.display ?? 'Procedure'
    : 'Procedure Details'

  return (
    <SideDrawer open={!!selectedProcedureId} onClose={() => setSelectedProcedure(null)} title={title}>
      {proc ? (
        <dl>
          {/* Category badge */}
          <div className="mb-3">
            <span className={`inline-block text-base font-semibold px-2 py-0.5 rounded-full ${categoryColor(proc)}`}>
              {categoryLabel(proc)}
            </span>
          </div>

          <Row label="Status" value={proc.status ?? '—'} />

          {/* Code */}
          {proc.code?.coding?.[0] && (
            <Row
              label="Code"
              value={`${proc.code.coding[0].display ?? proc.code.coding[0].code ?? '—'} (${proc.code.coding[0].system?.split('/').pop() ?? proc.code.coding[0].system ?? '—'})`}
            />
          )}

          {/* Date / Period */}
          {proc.performedDateTime && (
            <Row label="Date" value={formatDate(proc.performedDateTime)} />
          )}
          {proc.performedPeriod && (
            <>
              <Row label="Start" value={formatDate((proc.performedPeriod as fhir4.Period).start)} />
              <Row label="End" value={formatDate((proc.performedPeriod as fhir4.Period).end)} />
            </>
          )}

          {/* T-relative */}
          {t0 && (proc.performedDateTime || (proc.performedPeriod as fhir4.Period | undefined)?.start) && (
            <Row
              label="T-Relative"
              value={formatTemporalLabel(
                new Date(proc.performedDateTime ?? (proc.performedPeriod as fhir4.Period).start!),
                t0,
              )}
            />
          )}

          {/* Body site */}
          {proc.bodySite?.[0] && (
            <Row
              label="Body Site"
              value={
                proc.bodySite[0].text ??
                proc.bodySite[0].coding?.[0]?.display ??
                proc.bodySite[0].coding?.[0]?.code ??
                '—'
              }
            />
          )}

          {/* Performer */}
          {proc.performer?.[0]?.actor?.display && (
            <Row label="Performer" value={proc.performer[0].actor.display} />
          )}

          {/* Note */}
          {proc.note?.[0]?.text && (
            <div className="pt-2">
              <dt className="text-[13px] text-gray-400 uppercase tracking-wide mb-1">Notes</dt>
              <dd className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {proc.note[0].text}
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-base text-gray-400 italic">No procedure selected.</p>
      )}
    </SideDrawer>
  )
}

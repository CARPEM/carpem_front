import { usePatientStore } from '@/store/patient'
import { ageInYears, formatGender, formatDate } from '@/lib/formatters'
import { T0_ANCHOR_URL } from '@/lib/t0'

const LOINC_STAGE = new Set(['21908-9', '21902-2'])

export default function PatientIdentifier() {
  const { patient, conditions, observations, t0 } = usePatientStore()

  if (!patient) {
    return <div className="text-base text-gray-400 italic">Loading patient…</div>
  }

  // Patient ID — prefer official, fall back to MRN
  const id =
    patient.identifier?.find((i) => i.use === 'official')?.value ??
    patient.identifier?.find((i) =>
      i.type?.coding?.some((c) => c.code === 'MR'),
    )?.value ??
    patient.id ??
    '—'

  // Age at DX
  const ageAtDx =
    patient.birthDate && t0
      ? `${ageInYears(new Date(patient.birthDate), t0)} years`
      : '—'

  // Gender
  const gender = formatGender(patient.gender)

  // Primary tumor — from primary (T0-anchor) condition
  const primaryCondition =
    conditions.find((c) =>
      c.extension?.some(
        (e) =>
          e.url === T0_ANCHOR_URL &&
          e.valueBoolean === true,
      ),
    ) ?? conditions[0]

  const primaryTumor =
    primaryCondition?.code?.text ??
    primaryCondition?.code?.coding?.[0]?.display ??
    '—'

  const bodySite =
    primaryCondition?.bodySite?.[0]?.coding?.[0]?.display ?? null

  // Stage at DX — TNM observation
  const stageObs = observations.find((o) =>
    o.code?.coding?.some((c) => LOINC_STAGE.has(c.code ?? '')),
  )
  const stage =
    stageObs?.valueCodeableConcept?.text ??
    stageObs?.valueCodeableConcept?.coding?.[0]?.display ??
    '—'

  // Vital status
  const vitalStatus = patient.deceasedBoolean
    ? `Deceased${patient.deceasedDateTime ? ' — ' + formatDate(patient.deceasedDateTime) : ''}`
    : 'Alive'

  return (
    <section className="rounded border border-gray-200 bg-white p-3">
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-900 mb-2 pb-1.5 border-b border-gray-100">
        Patient Identifier
      </h2>
      <dl className="space-y-1">
        <Row label="Patient ID:" value={id} mono />
        <Row label="Age at DX:" value={ageAtDx} />
        <Row label="Gender:" value={gender} />
        <Row
          label="Primary Tumor:"
          value={bodySite ? `${primaryTumor} (${bodySite})` : primaryTumor}
        />
        <Row label="Stage at DX:" value={stage} highlight />
        <Row
          label="Vital Status:"
          value={vitalStatus}
          highlight={patient.deceasedBoolean === true}
          highlightColor="text-red-600"
        />
      </dl>
    </section>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
  highlightColor?: string
}

function Row({ label, value, mono, highlight, highlightColor = 'text-[#0D9488]' }: RowProps) {
  return (
    <div className="flex items-baseline gap-1.5 leading-snug">
      <dt className="text-base font-semibold text-gray-600 shrink-0 min-w-[80px]">{label}</dt>
      <dd
        className={[
          'text-base break-words',
          mono ? 'font-mono text-gray-800' : 'text-gray-800',
          highlight ? highlightColor + ' font-semibold' : '',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  )
}

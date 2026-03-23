import { usePatientStore } from '@/store/patient'
import { useSelectionStore } from '@/store/selection'
import { formatDate, formatTemporalLabel } from '@/lib/formatters'

const CONTEXT_URL = 'http://carpem.fr/fhir/StructureDefinition/collection-context'
const GENE_CODE        = '48018-6'
const VAF_CODE         = '81258-6'
const CONSEQUENCE_CODE = '48006-1'
const HGVS_C_CODE      = '48004-6'
const HGVS_P_CODE      = '48005-3'

const VARIANT_COLORS: Record<string, string> = {
  missense_variant:        '#1E3A5F',
  frameshift_variant:      '#166534',
  splice_region_variant:   '#C2410C',
  splice_site_variant:     '#C2410C',
  inframe_deletion:        '#7C3AED',
  inframe_insertion:       '#4F46E5',
  copy_number_amplification: '#6B7280',
}

const VARIANT_LABELS: Record<string, string> = {
  missense_variant:          'Missense',
  frameshift_variant:        'Frameshift',
  splice_region_variant:     'Splice site',
  inframe_deletion:          'In-frame del',
  inframe_insertion:         'In-frame ins',
  copy_number_amplification: 'CNV',
}

// splice_site_variant is an alias — map to same color/label, excluded from legend
VARIANT_COLORS['splice_site_variant'] = VARIANT_COLORS['splice_region_variant']

/** White on dark backgrounds, dark on light backgrounds. */
function textOnBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1E293B' : '#FFFFFF'
}

interface VariantRow {
  gene: string
  vaf: number
  variantType: string
  color: string
  label: string
  cHGVS?: string
  pHGVS?: string
}

export default function MolecularPanel() {
  const { specimens, observations, diagnosticReports, t0 } = usePatientStore()
  const { selectedSpecimenId } = useSelectionStore()

  // Resolve specimen — selected or most recent biopsy
  const specimen = selectedSpecimenId
    ? specimens.find((s) => s.id === selectedSpecimenId)
    : [...specimens].sort(
        (a, b) =>
          new Date(b.collection?.collectedDateTime ?? 0).getTime() -
          new Date(a.collection?.collectedDateTime ?? 0).getTime(),
      )[0]

  if (!specimen) {
    return (
      <section className="rounded border border-gray-200 bg-white p-3">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-900 mb-2">
          Contextual Molecular Panel
        </h2>
        <p className="text-base text-gray-400 italic">No specimen available.</p>
      </section>
    )
  }

  const dateStr = specimen.collection?.collectedDateTime
  const date = dateStr ? new Date(dateStr) : null
  const temporal = date && t0 ? formatTemporalLabel(date, t0) : null
  const bodySite =
    specimen.collection?.bodySite?.coding?.[0]?.display ??
    specimen.collection?.bodySite?.text ??
    'Unknown site'
  const context =
    specimen.extension?.find((e) => e.url === CONTEXT_URL)?.valueCode ?? 'baseline'

  const panelTitle = `${bodySite} Biopsy${temporal ? ' ' + temporal : ''}`
  const sampleType = specimen.type?.text ?? specimen.type?.coding?.[0]?.display ?? '—'
  const lesionType = specimen.collection?.method?.coding?.[0]?.display ?? '—'

  // Find linked DiagnosticReport
  const report = diagnosticReports.find((r) =>
    r.specimen?.some((s) => s.reference?.endsWith(specimen.id ?? '')),
  )

  // Collect variant observations from report results
  const resultIds = new Set(
    report?.result?.map((r) => r.reference?.split('/').pop()) ?? [],
  )
  const variantObs = observations.filter(
    (o) => o.id && resultIds.has(o.id),
  )

  // Build variant rows
  const variants: VariantRow[] = variantObs
    .map((o) => {
      const gene =
        o.component
          ?.find((c) => c.code?.coding?.some((cd) => cd.code === GENE_CODE))
          ?.valueCodeableConcept?.coding?.[0]?.display ?? '?'
      const vaf =
        o.component
          ?.find((c) => c.code?.coding?.some((cd) => cd.code === VAF_CODE))
          ?.valueQuantity?.value ?? 0
      const variantType =
        o.component
          ?.find((c) => c.code?.coding?.some((cd) => cd.code === CONSEQUENCE_CODE))
          ?.valueCodeableConcept?.coding?.[0]?.code ?? 'unknown'
      const cHGVS = o.component
        ?.find((c) => c.code?.coding?.some((cd) => cd.code === HGVS_C_CODE))
        ?.valueString
      const pHGVS = o.component
        ?.find((c) => c.code?.coding?.some((cd) => cd.code === HGVS_P_CODE))
        ?.valueString
      return {
        gene,
        vaf,
        variantType,
        color: VARIANT_COLORS[variantType] ?? '#6B7280',
        label: VARIANT_LABELS[variantType] ?? variantType,
        cHGVS,
        pHGVS,
      }
    })
    .sort((a, b) => b.vaf - a.vaf)

  const shown = variants.slice(0, 8)
  const extra = variants.length - shown.length

  const actionableObs = observations.filter(
    (o) =>
      o.id &&
      resultIds.has(o.id) &&
      o.interpretation?.some((i) =>
        i.coding?.some((c) => c.code === 'A' || c.display?.toLowerCase().includes('actionable')),
      ),
  )

  const contextColor =
    context === 'at-progression' ? '#DC2626' :
    context === 'on-treatment'   ? '#3B82F6' : '#0D9488'

  return (
    <section className="rounded border border-gray-200 bg-white flex flex-col">
      {/* Panel header */}
      <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-900">
          Contextual Molecular Panel
        </h2>
      </div>

      {/* Specimen selector row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
        {/* Tube icon in context colour */}
        <svg width={18} height={24} viewBox="0 0 18 24">
          <rect x={5} y={2} width={8} height={18} rx={4} fill={contextColor} opacity={0.85}/>
          <rect x={4} y={0} width={10} height={4} rx={1} fill={contextColor}/>
        </svg>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-gray-800 leading-snug truncate">{panelTitle}</div>
          <div className="text-base font-medium mt-0.5" style={{ color: contextColor }}>
            {context}
          </div>
        </div>
        {/* Chevron placeholder */}
        <svg width={14} height={14} viewBox="0 0 14 14" fill="none" className="text-gray-400 shrink-0">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="p-3 flex flex-col gap-3">

      {/* Fields */}
      <dl className="flex flex-col gap-1">
        <Field label="Sample Type" value={sampleType} />
        <Field label="Date Collected" value={formatDate(dateStr)} />
        {temporal && <Field label="T-Relative" value={temporal} mono />}
      </dl>

      {/* Mutation table */}
      {shown.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-widest text-gray-900 mb-2">
            Key Somatic Mutations
          </h3>
          <table className="w-full table-fixed border-collapse text-[11px]">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-200">
                <th className="font-semibold py-0.5 w-14">Gene</th>
                <th className="font-semibold py-0.5 font-mono">p.</th>
                <th className="font-semibold py-0.5 font-mono">c.</th>
                <th className="font-semibold py-0.5 w-10 text-right">VAF</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => (
                <tr key={v.gene} className="border-b border-gray-100 last:border-0">
                  <td
                    className="py-0.5 px-1 font-mono font-bold rounded-sm"
                    style={{ background: v.color, color: textOnBg(v.color) }}
                  >
                    {v.gene}
                  </td>
                  <td className="py-0.5 px-1 font-mono text-gray-700 truncate">
                    {v.pHGVS ?? '—'}
                  </td>
                  <td className="py-0.5 px-1 font-mono text-gray-500 truncate">
                    {v.cHGVS ?? '—'}
                  </td>
                  <td className="py-0.5 text-right text-gray-600">
                    {(v.vaf * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-2">
            {Object.entries(VARIANT_LABELS).map(([code, label]) => (
              <span key={code} className="flex items-center gap-0.5">
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ background: VARIANT_COLORS[code] }}
                />
                <span className="text-base text-gray-500">{label}</span>
              </span>
            ))}
          </div>

          {extra > 0 && (
            <button className="text-[13px] text-[#0D9488] hover:underline mt-1">
              + {extra} more mutations
            </button>
          )}
        </div>
      )}

      {/* Actionable findings */}
      {actionableObs.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-widest text-gray-900 mb-1.5">
            Actionable Findings:
          </h3>
          {actionableObs.map((o) => (
            <div key={o.id} className="text-[13px] text-amber-700 bg-amber-50 rounded px-2 py-1 mb-1">
              {o.code?.text ?? o.code?.coding?.[0]?.display ?? 'Actionable finding'}
            </div>
          ))}
        </div>
      )}
      </div>
    </section>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-1.5 items-baseline">
      <dt className="text-[13px] font-semibold text-gray-500 shrink-0">{label}:</dt>
      <dd className={`text-[13px] text-gray-800 leading-snug ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

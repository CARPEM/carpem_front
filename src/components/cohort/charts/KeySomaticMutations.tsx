import { useState, useRef, useEffect, useCallback } from 'react'
import { useCohortStore } from '@/store/cohort'
import { getActiveCohortConfig } from '@/config/cohortConfig'
import type { OncoPrintGene } from '@/types/cohortAnalytics'

// ─── Constants ────────────────────────────────────────────────────────────────

const VARIANT_COLORS: Record<string, string> = {
  'Missense':           '#1E3A8A',
  'Frameshift':         '#166534',
  'Nonsense':           '#F97316',
  'Splice site':        '#C2410C',
  'In-frame deletion':  '#7C3AED',
  'In-frame insertion': '#4F46E5',
  'CNV':                '#6B7280',
  'Other':              '#D1D5DB',
}

const UNALTERED  = '#F3F4F6'
const LABEL_W    = 80   // gene name column (px)
const PCT_W      = 36   // right % label column (px)
const ROW_H      = 24   // height per gene row (px)
const BAR_H      = 14   // filled cell height within row
const SUMMARY_H  = 20   // per-patient alteration burden bar at top
const GAP        = 4    // gap between summary bar and first gene row
const PAD_TOP    = 4

// ─── Types ────────────────────────────────────────────────────────────────────

interface TooltipState {
  x: number; y: number
  gene: string
  patientIdx: number
  types: string[]
}

// ─── Search input — exported so CohortView can pass it to ChartPanel.headerRight ─

interface SearchProps { value: string; onChange: (v: string) => void }
export function MutationSearch({ value, onChange }: SearchProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        placeholder="Search gene…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[10px] border border-gray-300 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:border-[#1A7F8E]"
      />
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2}>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    </div>
  )
}

// ─── OncoPrint ────────────────────────────────────────────────────────────────

interface Props { search: string }

export default function KeySomaticMutations({ search }: Props) {
  const { analytics, setFilter, filters } = useCohortStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [plotW, setPlotW] = useState(0)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setPlotW(Math.max(0, el.clientWidth - LABEL_W - PCT_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const hideTooltip = useCallback(() => setTooltip(null), [])

  const config  = getActiveCohortConfig(filters.bodySite)
  const goi     = new Set(config.genesOfInterest)
  const data    = analytics?.oncoPrint

  if (!data?.genes.length) return (
    <div className="flex items-center justify-center h-full text-[11px] text-gray-400 italic">No data</div>
  )

  // Filter by search, then sort: GOI in config order first, then rest by pct desc
  const filtered = data.genes.filter(
    (g) => !search || g.gene.toLowerCase().includes(search.toLowerCase()),
  )
  const displayed: OncoPrintGene[] = [
    ...config.genesOfInterest.map((g) => filtered.find((m) => m.gene === g)).filter(Boolean),
    ...filtered.filter((m) => !goi.has(m.gene)).sort((a, b) => b.pct - a.pct),
  ] as OncoPrintGene[]

  const nPatients  = data.patients.length
  const cellW      = nPatients > 0 ? Math.max(2, Math.floor(plotW / nPatients)) : 0
  const actualW    = cellW * nPatients

  // Per-patient alteration count across ALL genes (for summary bar)
  const altCounts  = data.patients.map((_, pIdx) =>
    data.genes.filter((g) => g.alterations[pIdx] != null).length,
  )
  const maxAlt     = Math.max(1, ...altCounts)

  const svgH = PAD_TOP + SUMMARY_H + GAP + displayed.length * ROW_H

  return (
    <div className="flex flex-col h-full gap-1 overflow-hidden">

      {/* SVG matrix */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto relative select-none">
        {plotW > 0 && cellW > 0 && (
          <svg width={LABEL_W + actualW + PCT_W} height={svgH} onMouseLeave={hideTooltip}>

            {/* ── Summary bar — per-patient alteration burden ── */}
            <text x={LABEL_W - 5} y={PAD_TOP + SUMMARY_H - 2}
              textAnchor="end" fontSize={8} fill="#9CA3AF">
              Altered
            </text>
            {data.patients.map((_, pIdx) => {
              const h = Math.round((altCounts[pIdx] / maxAlt) * SUMMARY_H)
              return (
                <rect
                  key={pIdx}
                  x={LABEL_W + pIdx * cellW}
                  y={PAD_TOP + SUMMARY_H - h}
                  width={Math.max(1, cellW - 1)}
                  height={h}
                  fill="#94A3B8"
                />
              )
            })}

            {/* ── Gene rows ── */}
            {displayed.map((gene, rowIdx) => {
              const rowY   = PAD_TOP + SUMMARY_H + GAP + rowIdx * ROW_H
              const barY   = rowY + (ROW_H - BAR_H) / 2
              const active = filters.gene === gene.gene
              const dimmed = !!filters.gene && !active
              const isGOI  = goi.has(gene.gene)

              return (
                <g key={gene.gene} style={{ cursor: 'pointer' }}
                  onClick={() => setFilter('gene', active ? undefined : gene.gene)}
                >
                  {/* Row background */}
                  <rect
                    x={0} y={rowY}
                    width={LABEL_W + actualW + PCT_W} height={ROW_H}
                    fill={active ? '#EFF6FF' : rowIdx % 2 === 0 ? '#FAFAFA' : 'white'}
                  />

                  {/* Gene label */}
                  <text
                    x={LABEL_W - (isGOI ? 13 : 5)} y={barY + BAR_H / 2 + 4}
                    textAnchor="end" fontSize={10}
                    fontWeight={isGOI || active ? 700 : 400}
                    fill={dimmed ? '#C4C8D0' : '#374151'}
                  >
                    {gene.gene}
                  </text>

                  {/* Amber dot for genes of interest */}
                  {isGOI && (
                    <circle
                      cx={LABEL_W - 5} cy={barY + BAR_H / 2}
                      r={3}
                      fill={dimmed ? '#D1D5DB' : '#D97706'}
                    />
                  )}

                  {/* Patient cells */}
                  {data.patients.map((_, pIdx) => {
                    const x   = LABEL_W + pIdx * cellW
                    const w   = Math.max(1, cellW - 1)
                    const alt = gene.alterations[pIdx]

                    if (!alt || alt.length === 0) {
                      return (
                        <rect key={pIdx} x={x} y={barY} width={w} height={BAR_H}
                          fill={UNALTERED} opacity={dimmed ? 0.3 : 1}
                        />
                      )
                    }

                    // Multiple types → split cell height equally
                    const sliceH = BAR_H / alt.length
                    return (
                      <g key={pIdx}
                        onMouseEnter={(e) => {
                          const r = containerRef.current?.getBoundingClientRect()
                          if (!r) return
                          setTooltip({
                            x: e.clientX - r.left + 10,
                            y: e.clientY - r.top - 10,
                            gene: gene.gene,
                            patientIdx: pIdx + 1,
                            types: alt.map((a) => a.type),
                          })
                        }}
                      >
                        {alt.map((a, si) => (
                          <rect key={si}
                            x={x} y={barY + si * sliceH}
                            width={w} height={sliceH}
                            fill={VARIANT_COLORS[a.type] ?? VARIANT_COLORS['Other']}
                            opacity={dimmed ? 0.2 : 1}
                          />
                        ))}
                      </g>
                    )
                  })}

                  {/* % label */}
                  <text
                    x={LABEL_W + actualW + 4} y={barY + BAR_H / 2 + 4}
                    fontSize={9} fill={dimmed ? '#C4C8D0' : '#6B7280'}
                  >
                    {gene.pct}%
                  </text>
                </g>
              )
            })}
          </svg>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none bg-gray-900 text-white text-[11px] rounded px-2 py-1.5 shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="font-semibold">{tooltip.gene}</div>
            <div className="text-gray-400 text-[10px] mb-0.5">Patient #{tooltip.patientIdx}</div>
            {tooltip.types.map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-sm shrink-0"
                  style={{ background: VARIANT_COLORS[type] ?? VARIANT_COLORS['Other'] }}
                />
                <span className="text-gray-300">{type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="shrink-0 border-t border-gray-100 pt-1">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1">
          Mutation Legend
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {Object.entries(VARIANT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
              <span className="text-[9px] text-gray-600">{type}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <svg width={8} height={8} viewBox="0 0 8 8">
              <circle cx={4} cy={4} r={3} fill="#D97706" />
            </svg>
            <span className="text-[9px] text-gray-600">Gene of interest</span>
          </div>
        </div>
      </div>

    </div>
  )
}

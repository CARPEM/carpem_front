import { useState } from 'react'
import { usePatientStore } from '@/store/patient'
import { formatTemporalLabel, truncateAtWord, decodeAttachmentText, formatDate } from '@/lib/formatters'

const SNIPPET_CHARS = 300
const PREVIEW_COUNT = 3

export default function ClinicalNotes() {
  const { documents, t0 } = usePatientStore()
  const [modalOpen, setModalOpen] = useState(false)

  // Sort descending by date
  const sorted = [...documents].sort(
    (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
  )

  if (sorted.length === 0) {
    return (
      <section className="rounded border border-gray-200 bg-white p-3 flex-1">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-900 mb-2">
          Clinical Notes
        </h2>
        <p className="text-base text-gray-400 italic">No notes available.</p>
      </section>
    )
  }

  const preview = sorted.slice(0, PREVIEW_COUNT)

  return (
    <>
      <section className="rounded border border-gray-200 bg-white p-3 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100 shrink-0">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-900">
            Clinical Notes Snippets
          </h2>
          {sorted.length > PREVIEW_COUNT && (
            <button
              onClick={() => setModalOpen(true)}
              className="text-[13px] text-[#0D9488] hover:underline font-medium"
            >
              View all ({sorted.length})
            </button>
          )}
        </div>

        <div className="overflow-y-auto space-y-3 flex-1">
          {preview.map((doc) => (
            <NoteSnippet key={doc.id} doc={doc} t0={t0} />
          ))}
          {sorted.length > PREVIEW_COUNT && (
            <button
              onClick={() => setModalOpen(true)}
              className="w-full text-[13px] text-[#0D9488] hover:underline font-medium text-center py-1"
            >
              + {sorted.length - PREVIEW_COUNT} more notes…
            </button>
          )}
        </div>
      </section>

      {modalOpen && (
        <NotesModal notes={sorted} t0={t0} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}

// ─── NoteSnippet ─────────────────────────────────────────────────────────────

interface NoteSnippetProps {
  doc: fhir4.DocumentReference
  t0: Date | null
}

function NoteSnippet({ doc, t0 }: NoteSnippetProps) {
  const attachment = doc.content?.[0]?.attachment
  const raw = decodeAttachmentText(attachment?.data, attachment?.url)
  const snippet = truncateAtWord(raw, SNIPPET_CHARS)

  const date = doc.date ? new Date(doc.date) : null
  const temporal = date && t0 ? formatTemporalLabel(date, t0) : null
  const absDate = doc.date ? formatDate(doc.date) : '—'

  const title =
    doc.type?.text ??
    doc.type?.coding?.[0]?.display ??
    'Clinical note'

  return (
    <div className="border-l-2 border-[#0D9488] pl-2">
      <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
        <span className="text-[13px] font-semibold text-gray-700 truncate">{title}</span>
        {temporal && (
          <span className="text-[13px] font-mono text-[#0D9488] shrink-0">{temporal}</span>
        )}
        <span className="text-[13px] text-gray-400 ml-auto shrink-0">{absDate}</span>
      </div>
      <p className="text-base text-gray-600 leading-relaxed line-clamp-4">{snippet}</p>
    </div>
  )
}

// ─── NotesModal ──────────────────────────────────────────────────────────────

interface NotesModalProps {
  notes: fhir4.DocumentReference[]
  t0: Date | null
  onClose: () => void
}

function NotesModal({ notes, t0, onClose }: NotesModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[560px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-semibold text-gray-800">
            All Clinical Notes ({notes.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Notes list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {notes.map((doc) => {
            const attachment = doc.content?.[0]?.attachment
            const raw = decodeAttachmentText(attachment?.data, attachment?.url)
            const date = doc.date ? new Date(doc.date) : null
            const temporal = date && t0 ? formatTemporalLabel(date, t0) : null
            const absDate = doc.date ? formatDate(doc.date) : '—'
            const title =
              doc.type?.text ?? doc.type?.coding?.[0]?.display ?? 'Clinical note'

            return (
              <div key={doc.id} className="border-l-2 border-[#0D9488] pl-3">
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="text-base font-semibold text-gray-800">{title}</span>
                  {temporal && (
                    <span className="text-base font-mono text-[#0D9488]">{temporal}</span>
                  )}
                  <span className="text-base text-gray-400 ml-auto">{absDate}</span>
                </div>
                <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">{raw}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

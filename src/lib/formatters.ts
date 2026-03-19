/** Temporal label relative to T0, as per spec §3.2:
 *  Δ < 30 days  → "[Day N]"
 *  Δ < 365 days → "[Month N]"
 *  else         → "[Year Y.M]"
 */
export function formatTemporalLabel(date: Date, t0: Date): string {
  const deltaDays = (date.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24)
  if (deltaDays < 30) return `[Day ${Math.round(deltaDays)}]`
  const deltaMonths = deltaDays / 30.44
  if (deltaMonths < 12) return `[Month ${Math.round(deltaMonths)}]`
  const years = Math.floor(deltaMonths / 12)
  const months = Math.round(deltaMonths % 12)
  return `[Year ${years}${months > 0 ? `.${months}` : ''}]`
}

/** Age in full years between two dates. */
export function ageInYears(from: Date, to: Date): number {
  let age = to.getFullYear() - from.getFullYear()
  const m = to.getMonth() - from.getMonth()
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) age--
  return age
}

/** Capitalise FHIR gender codes. */
export function formatGender(gender: string | undefined): string {
  if (!gender) return '—'
  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

/** Truncate text at the last complete word before maxChars. */
export function truncateAtWord(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const cut = text.lastIndexOf(' ', maxChars)
  return cut > 0 ? text.slice(0, cut) + '…' : text.slice(0, maxChars) + '…'
}

/** Decode a FHIR attachment: base64 data or returns a placeholder if url-only. */
export function decodeAttachmentText(data?: string, url?: string): string {
  if (data) {
    try {
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    } catch { return '[encoding error]' }
  }
  if (url) return `[external: ${url}]`
  return '[no content]'
}

/** Format an absolute date as a locale date string. */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

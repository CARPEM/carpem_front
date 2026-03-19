import type { FhirCondition } from '@/types/fhir'

export const T0_ANCHOR_URL = 'http://carpem.fr/fhir/StructureDefinition/t0-anchor'

/**
 * Compute T0 (date of diagnosis) from a list of Condition resources.
 * Rules (from spec §6.1):
 * 1. Primary: earliest onsetDateTime where category = encounter-diagnosis,
 *    clinicalStatus = active, verificationStatus = confirmed.
 * 2. If a Condition has the t0-anchor extension (valueBoolean: true), that one wins.
 * Returns a Date or null if no valid condition found.
 */
export function computeT0(conditions: FhirCondition[]): Date | null {
  const anchored = conditions.find((c) =>
    c.extension?.some((e) => e.url === T0_ANCHOR_URL && e.valueBoolean === true)
  )
  if (anchored?.onsetDateTime) return new Date(anchored.onsetDateTime)

  const eligible = conditions.filter(
    (c) =>
      c.clinicalStatus?.coding?.some((code) => code.code === 'active') &&
      c.verificationStatus?.coding?.some((code) => code.code === 'confirmed') &&
      c.category?.some((cat) =>
        cat.coding?.some((code) => code.code === 'encounter-diagnosis')
      ) &&
      c.onsetDateTime != null
  )

  if (eligible.length === 0) return null

  const dates = eligible.map((c) => new Date(c.onsetDateTime!).getTime())
  return new Date(Math.min(...dates))
}

/** Convert an absolute date to months from T0 (÷ 30.44) */
export function toMonthsFromT0(date: Date, t0: Date): number {
  return (date.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
}

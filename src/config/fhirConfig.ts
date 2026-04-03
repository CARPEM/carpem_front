/**
 * FHIR server connection configuration.
 *
 * Edit this file to update the application globally.
 * The base URL can also be overridden at build/deploy time via the
 * VITE_FHIR_BASE_URL environment variable (takes precedence over the
 * default below).
 */

const config = {
  /**
   * Base URL of the FHIR R4 server — no trailing slash.
   * Development: 'http://localhost:3001/fhir/R4'
   */
  baseUrl: (import.meta.env['VITE_FHIR_BASE_URL'] as string | undefined) ?? 'http://localhost:3001/fhir/R4',

  /**
   * Default request timeout in milliseconds.
   * Applied to patient $everything fetches and cohort analytics calls.
   */
  timeoutMs: 30_000,

  /**
   * HTTP headers sent with every FHIR request.
   */
  headers: {
    Accept: 'application/fhir+json',
  } satisfies Record<string, string>,

  /**
   * HTTP headers sent with cohort analytics requests.
   * The analytics endpoint returns plain JSON, not FHIR bundles.
   */
  analyticsHeaders: {
    Accept: 'application/json',
  } satisfies Record<string, string>,

  /**
   * Page size for paginated $everything requests.
   * Increase to reduce round-trips; decrease to lower per-request memory.
   */
  everythingPageSize: 100,
} as const

export default config

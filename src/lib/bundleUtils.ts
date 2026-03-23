import type {
  FhirBundle,
  FhirPatient,
  FhirCondition,
  FhirObservation,
  FhirMedicationAdministration,
  FhirMedicationRequest,
  FhirProcedure,
  FhirImagingStudy,
  FhirDiagnosticReport,
  FhirSpecimen,
  FhirDocumentReference,
  FhirEncounter,
} from '@/types/fhir'

type ResourceMap = {
  Patient: FhirPatient
  Condition: FhirCondition
  Observation: FhirObservation
  MedicationAdministration: FhirMedicationAdministration
  MedicationRequest: FhirMedicationRequest
  Procedure: FhirProcedure
  ImagingStudy: FhirImagingStudy
  DiagnosticReport: FhirDiagnosticReport
  Specimen: FhirSpecimen
  DocumentReference: FhirDocumentReference
  Encounter: FhirEncounter
}

/** Extract all resources of a given type from a FHIR bundle. */
export function getResources<K extends keyof ResourceMap>(
  bundle: FhirBundle,
  resourceType: K,
): ResourceMap[K][] {
  return (bundle.entry ?? [])
    .map((e) => e.resource)
    .filter((r): r is ResourceMap[K] => r?.resourceType === resourceType)
}

/** Extract the single Patient resource from the bundle (assumes one patient). */
export function getPatient(bundle: FhirBundle): FhirPatient | null {
  return getResources(bundle, 'Patient')[0] ?? null
}

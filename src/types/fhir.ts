// Re-export FHIR R4 types from @types/fhir and add project-specific helpers.
// The @types/fhir package provides: fhir.Patient, fhir.Condition, fhir.Observation, etc.

export type FhirBundle = fhir4.Bundle
export type FhirPatient = fhir4.Patient
export type FhirCondition = fhir4.Condition
export type FhirObservation = fhir4.Observation
export type FhirMedicationAdministration = fhir4.MedicationAdministration
export type FhirMedicationRequest = fhir4.MedicationRequest
export type FhirProcedure = fhir4.Procedure
export type FhirImagingStudy = fhir4.ImagingStudy
export type FhirDiagnosticReport = fhir4.DiagnosticReport
export type FhirSpecimen = fhir4.Specimen
export type FhirDocumentReference = fhir4.DocumentReference
export type FhirEncounter = fhir4.Encounter

/** T0-relative position in months (event.date − T0) / 30.44 */
export type MonthsFromT0 = number

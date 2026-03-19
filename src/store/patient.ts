import { create } from 'zustand'
import { getPatient, getResources } from '@/lib/bundleUtils'
import { computeT0 } from '@/lib/t0'
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
} from '@/types/fhir'

interface PatientState {
  // Raw parsed resources
  patient: FhirPatient | null
  conditions: FhirCondition[]
  observations: FhirObservation[]
  medicationAdministrations: FhirMedicationAdministration[]
  medicationRequests: FhirMedicationRequest[]
  procedures: FhirProcedure[]
  imagingStudies: FhirImagingStudy[]
  diagnosticReports: FhirDiagnosticReport[]
  specimens: FhirSpecimen[]
  documents: FhirDocumentReference[]
  // Computed
  t0: Date | null
  // Action
  loadBundle: (bundle: FhirBundle) => void
}

export const usePatientStore = create<PatientState>((set) => ({
  patient: null,
  conditions: [],
  observations: [],
  medicationAdministrations: [],
  medicationRequests: [],
  procedures: [],
  imagingStudies: [],
  diagnosticReports: [],
  specimens: [],
  documents: [],
  t0: null,

  loadBundle: (bundle) => {
    const conditions = getResources(bundle, 'Condition')
    set({
      patient: getPatient(bundle),
      conditions,
      observations: getResources(bundle, 'Observation'),
      medicationAdministrations: getResources(bundle, 'MedicationAdministration'),
      medicationRequests: getResources(bundle, 'MedicationRequest'),
      procedures: getResources(bundle, 'Procedure'),
      imagingStudies: getResources(bundle, 'ImagingStudy'),
      diagnosticReports: getResources(bundle, 'DiagnosticReport'),
      specimens: getResources(bundle, 'Specimen'),
      documents: getResources(bundle, 'DocumentReference'),
      t0: computeT0(conditions),
    })
  },
}))

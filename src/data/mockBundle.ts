/**
 * Mock FHIR R4 Patient/$everything bundle — fictional patient data.
 * Patient: Marie Dupont, HER2+ invasive ductal carcinoma of the left breast.
 * T0 = 2021-06-15 (date of primary diagnosis).
 * Reference date for this mock: 2026-03-19 (~57 months from T0).
 *
 * Covers all 9 resource types from the spec:
 * Patient, Condition, MedicationAdministration, MedicationRequest, Procedure,
 * ImagingStudy, DiagnosticReport, Observation, Specimen, DocumentReference.
 */
import type { FhirBundle } from '@/types/fhir'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function b(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

const PATIENT_REF = { reference: 'Patient/patient-001' }

// ─── Mock bundle ─────────────────────────────────────────────────────────────

export const mockBundle: FhirBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 53,
  entry: [

    // ── Patient ───────────────────────────────────────────────────────────────
    {
      fullUrl: 'urn:uuid:patient-001',
      resource: {
        resourceType: 'Patient',
        id: 'patient-001',
        identifier: [
          {
            use: 'official',
            system: 'http://carpem.fr/patient-id',
            value: 'CARPEM-2021-00123',
          },
          {
            use: 'usual',
            type: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR', display: 'Medical record number' }],
            },
            system: 'http://aphp.fr/mrn',
            value: 'MRN-987654',
          },
        ],
        name: [{ use: 'official', family: 'Dupont', given: ['Marie'] }],
        gender: 'female',
        birthDate: '1970-03-12',
        deceasedBoolean: false,
      },
    },

    // ── Condition: Primary diagnosis — T0 anchor ──────────────────────────────
    {
      fullUrl: 'urn:uuid:condition-primary',
      resource: {
        resourceType: 'Condition',
        id: 'condition-primary',
        extension: [
          { url: 'http://carpem.fr/fhir/StructureDefinition/t0-anchor', valueBoolean: true },
        ],
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }],
        },
        verificationStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }],
        },
        category: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }] },
        ],
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '254837009', display: 'Malignant neoplasm of breast' }],
          text: 'Invasive ductal carcinoma of the left breast, HER2+ ER− PR−',
        },
        bodySite: [
          { coding: [{ system: 'http://snomed.info/sct', code: '80248007', display: 'Left breast structure' }] },
        ],
        subject: PATIENT_REF,
        onsetDateTime: '2021-06-15',
        recordedDate: '2021-06-15',
      },
    },

    // ── Condition: Disease progression ────────────────────────────────────────
    {
      fullUrl: 'urn:uuid:condition-progression',
      resource: {
        resourceType: 'Condition',
        id: 'condition-progression',
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
        },
        verificationStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }],
        },
        category: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis' }] },
        ],
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '246455001', display: 'Recurrence of neoplasm' }],
          text: 'Hepatic metastases — disease progression',
        },
        subject: PATIENT_REF,
        onsetDateTime: '2023-06-15',
      },
    },

    // ── Observation: TNM staging ──────────────────────────────────────────────
    {
      fullUrl: 'urn:uuid:obs-tnm',
      resource: {
        resourceType: 'Observation',
        id: 'obs-tnm',
        status: 'final',
        category: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] },
        ],
        code: { coding: [{ system: 'http://loinc.org', code: '21908-9', display: 'Stage group.clinical Cancer' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2021-06-20',
        valueCodeableConcept: {
          coding: [{ system: 'http://cancerstaging.org', code: 'IIB', display: 'Stage IIB' }],
          text: 'T2 N1 M0 — Stage IIB',
        },
      },
    },

    // ── Observation: Disease progression marker (RECIST PD) ───────────────────
    {
      fullUrl: 'urn:uuid:obs-progression',
      resource: {
        resourceType: 'Observation',
        id: 'obs-progression',
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '21976-6', display: 'Disease progression' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2023-06-15',
        valueCodeableConcept: {
          coding: [{ system: 'http://recist.org', code: 'PD', display: 'Progressive Disease (RECIST)' }],
        },
      },
    },

    // ── Procedure: Mastectomy (surgical-procedure) ────────────────────────────
    {
      fullUrl: 'urn:uuid:proc-mastectomy',
      resource: {
        resourceType: 'Procedure',
        id: 'proc-mastectomy',
        status: 'completed',
        category: {
          coding: [{ system: 'http://snomed.info/sct', code: '387713003', display: 'Surgical procedure' }],
        },
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '172043006', display: 'Total mastectomy with axillary lymph node dissection' }],
          text: 'Mastectomy + sentinel lymph node biopsy',
        },
        subject: PATIENT_REF,
        performedDateTime: '2021-07-01',
      },
    },

    // ── Procedure: Radiotherapy (radiation-therapy) ───────────────────────────
    {
      fullUrl: 'urn:uuid:proc-radiotherapy',
      resource: {
        resourceType: 'Procedure',
        id: 'proc-radiotherapy',
        status: 'completed',
        category: {
          coding: [{ system: 'http://snomed.info/sct', code: '108290001', display: 'Radiation oncology AND/OR radiotherapy' }],
        },
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '33195004', display: 'Radiotherapy of breast' }],
          text: 'Adjuvant radiotherapy — left breast wall (50 Gy / 25 fractions)',
        },
        subject: PATIENT_REF,
        performedPeriod: { start: '2022-01-20', end: '2022-03-05' },
      },
    },

    // ── MedicationAdministration: FEC (Chemotherapy, ATC L01) ────────────────
    // 3 cycles: Aug / Sep / Oct 2021
    ...(['2021-08-01', '2021-09-01', '2021-10-01']).map((date, i) => ({
      fullUrl: `urn:uuid:medadmin-fec-${i + 1}`,
      resource: {
        resourceType: 'MedicationAdministration' as const,
        id: `medadmin-fec-${i + 1}`,
        status: 'completed' as const,
        medicationCodeableConcept: {
          coding: [
            { system: 'http://www.whocc.no/atc', code: 'L01', display: 'Antineoplastic agents' },
            { system: 'http://www.whocc.no/atc', code: 'L01AA01', display: 'Cyclophosphamide' },
          ],
          text: 'FEC (Fluorouracil + Epirubicin + Cyclophosphamide)',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        note: [{ text: `FEC cycle ${i + 1} of 3` }],
      },
    })),

    // ── MedicationAdministration: Docetaxel (Chemotherapy, ATC L01) ──────────
    // 3 cycles: Nov 2021 / Dec 2021 / Jan 2022
    ...(['2021-11-01', '2021-12-01', '2022-01-10']).map((date, i) => ({
      fullUrl: `urn:uuid:medadmin-docetaxel-${i + 1}`,
      resource: {
        resourceType: 'MedicationAdministration' as const,
        id: `medadmin-docetaxel-${i + 1}`,
        status: 'completed' as const,
        medicationCodeableConcept: {
          coding: [
            { system: 'http://www.whocc.no/atc', code: 'L01', display: 'Antineoplastic agents' },
            { system: 'http://www.whocc.no/atc', code: 'L01CD02', display: 'Docetaxel' },
          ],
          text: 'Docetaxel',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        note: [{ text: `Docetaxel cycle ${i + 1} of 3` }],
      },
    })),

    // ── MedicationAdministration: Trastuzumab (Targeted/mAb, ATC L01XC) ──────
    // 6 representative doses across Mar 2022 – May 2023
    ...(['2022-03-15', '2022-06-15', '2022-09-15', '2022-12-15', '2023-03-15', '2023-05-15']).map((date, i) => ({
      fullUrl: `urn:uuid:medadmin-tras-${i + 1}`,
      resource: {
        resourceType: 'MedicationAdministration' as const,
        id: `medadmin-tras-${i + 1}`,
        status: 'completed' as const,
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.whocc.no/atc', code: 'L01XC03', display: 'Trastuzumab' }],
          text: 'Trastuzumab (Herceptin)',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        note: [{ text: `Trastuzumab dose ${i + 1}` }],
      },
    })),

    // ── MedicationAdministration: Pertuzumab + Trastuzumab (ATC L01XC) ────────
    // 6 cycles: Aug 2023 – Jun 2024
    ...(['2023-08-01', '2023-10-01', '2023-12-01', '2024-02-01', '2024-04-01', '2024-06-01']).map((date, i) => ({
      fullUrl: `urn:uuid:medadmin-pertu-${i + 1}`,
      resource: {
        resourceType: 'MedicationAdministration' as const,
        id: `medadmin-pertu-${i + 1}`,
        status: 'completed' as const,
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.whocc.no/atc', code: 'L01XC13', display: 'Pertuzumab' }],
          text: 'Pertuzumab + Trastuzumab',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        note: [{ text: `Pertuzumab + Trastuzumab cycle ${i + 1} of 6` }],
      },
    })),

    // ── MedicationRequest: Trastuzumab maintenance (prophylactic — dashed bar) ─
    {
      fullUrl: 'urn:uuid:medreq-tras-maintenance',
      resource: {
        resourceType: 'MedicationRequest',
        id: 'medreq-tras-maintenance',
        status: 'active',
        intent: 'prophylactic',
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.whocc.no/atc', code: 'L01XC03', display: 'Trastuzumab' }],
          text: 'Trastuzumab maintenance (prophylactic)',
        },
        subject: PATIENT_REF,
        authoredOn: '2024-06-15',
      },
    },

    // ── ImagingStudy: CT Thorax-Abdomen-Pelvis — 1-year evaluation ────────────
    {
      fullUrl: 'urn:uuid:imaging-ct-y1',
      resource: {
        resourceType: 'ImagingStudy',
        id: 'imaging-ct-y1',
        status: 'available',
        subject: PATIENT_REF,
        started: '2022-06-15T09:30:00Z',
        modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
        numberOfSeries: 3,
        numberOfInstances: 312,
        description: 'CT Thorax-Abdomen-Pelvis — 1-year evaluation — no evidence of recurrence',
      },
    },

    // ── ImagingStudy: CT — hepatic lesions at progression ────────────────────
    {
      fullUrl: 'urn:uuid:imaging-ct-prog',
      resource: {
        resourceType: 'ImagingStudy',
        id: 'imaging-ct-prog',
        status: 'available',
        subject: PATIENT_REF,
        started: '2023-06-01T10:00:00Z',
        modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
        numberOfSeries: 3,
        numberOfInstances: 298,
        description: 'CT Thorax-Abdomen-Pelvis — 2 hepatic lesions suspicious for metastases',
      },
    },

    // ── ImagingStudy: PET-CT — hepatic metastases confirmed ──────────────────
    {
      fullUrl: 'urn:uuid:imaging-pet',
      resource: {
        resourceType: 'ImagingStudy',
        id: 'imaging-pet',
        status: 'available',
        subject: PATIENT_REF,
        started: '2024-01-20T08:00:00Z',
        modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'PT', display: 'Positron emission tomography' }],
        numberOfSeries: 2,
        numberOfInstances: 182,
        description: 'PET-CT — 2 hypermetabolic hepatic lesions confirmed',
      },
    },

    // ── Specimen: Baseline biopsy (FFPE, left breast) ────────────────────────
    {
      fullUrl: 'urn:uuid:specimen-baseline',
      resource: {
        resourceType: 'Specimen',
        id: 'specimen-baseline',
        extension: [
          { url: 'http://carpem.fr/fhir/StructureDefinition/collection-context', valueCode: 'baseline' },
        ],
        type: {
          coding: [{ system: 'http://snomed.info/sct', code: '119376003', display: 'Tissue specimen' }],
          text: 'FFPE tissue block — left breast core biopsy',
        },
        subject: PATIENT_REF,
        collection: {
          collectedDateTime: '2021-06-10',
          bodySite: { coding: [{ system: 'http://snomed.info/sct', code: '80248007', display: 'Left breast structure' }] },
          method: { coding: [{ system: 'http://snomed.info/sct', code: '129314006', display: 'Core needle biopsy' }] },
        },
      },
    },

    // ── Specimen: At-progression biopsy (liver) ───────────────────────────────
    {
      fullUrl: 'urn:uuid:specimen-progression',
      resource: {
        resourceType: 'Specimen',
        id: 'specimen-progression',
        extension: [
          { url: 'http://carpem.fr/fhir/StructureDefinition/collection-context', valueCode: 'at-progression' },
        ],
        type: {
          coding: [{ system: 'http://snomed.info/sct', code: '119376003', display: 'Tissue specimen' }],
          text: 'FFPE tissue block — liver biopsy at progression',
        },
        subject: PATIENT_REF,
        collection: {
          collectedDateTime: '2023-07-01',
          bodySite: { coding: [{ system: 'http://snomed.info/sct', code: '10200004', display: 'Liver structure' }] },
          method: { coding: [{ system: 'http://snomed.info/sct', code: '432416000', display: 'Ultrasound guided percutaneous biopsy' }] },
        },
      },
    },

    // ── DiagnosticReport: Comprehensive genomic profiling ─────────────────────
    {
      fullUrl: 'urn:uuid:report-genomic',
      resource: {
        resourceType: 'DiagnosticReport',
        id: 'report-genomic',
        status: 'final',
        category: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'GE', display: 'Genetics' }] },
        ],
        code: {
          coding: [{ system: 'http://loinc.org', code: '81247-9', display: 'Master HL7 genetic variant reporting panel' }],
          text: 'Comprehensive genomic profiling (CGP)',
        },
        subject: PATIENT_REF,
        effectiveDateTime: '2023-08-15',
        specimen: [{ reference: 'Specimen/specimen-progression' }],
        result: [
          { reference: 'Observation/obs-variant-pik3ca' },
          { reference: 'Observation/obs-variant-tp53' },
          { reference: 'Observation/obs-variant-brca1' },
        ],
      },
    },

    // ── Observations: Genomic variants ───────────────────────────────────────
    {
      fullUrl: 'urn:uuid:obs-variant-pik3ca',
      resource: {
        resourceType: 'Observation',
        id: 'obs-variant-pik3ca',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '69548-6', display: 'Genetic variant assessment' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2023-08-15',
        interpretation: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'A', display: 'Abnormal' }] },
        ],
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied [ID]' }] },
            valueCodeableConcept: { coding: [{ system: 'http://www.genenames.org', code: 'HGNC:8975', display: 'PIK3CA' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '81258-6', display: 'Variant allele frequency [NFr]' }] },
            valueQuantity: { value: 0.34, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48006-1', display: 'Molecular consequence' }] },
            valueCodeableConcept: { coding: [{ code: 'missense_variant', display: 'Missense variant' }] },
          },
        ],
      },
    },
    {
      fullUrl: 'urn:uuid:obs-variant-tp53',
      resource: {
        resourceType: 'Observation',
        id: 'obs-variant-tp53',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '69548-6', display: 'Genetic variant assessment' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2023-08-15',
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied [ID]' }] },
            valueCodeableConcept: { coding: [{ system: 'http://www.genenames.org', code: 'HGNC:11998', display: 'TP53' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '81258-6', display: 'Variant allele frequency [NFr]' }] },
            valueQuantity: { value: 0.28, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48006-1', display: 'Molecular consequence' }] },
            valueCodeableConcept: { coding: [{ code: 'frameshift_variant', display: 'Frameshift variant' }] },
          },
        ],
      },
    },
    {
      fullUrl: 'urn:uuid:obs-variant-brca1',
      resource: {
        resourceType: 'Observation',
        id: 'obs-variant-brca1',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '69548-6', display: 'Genetic variant assessment' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2023-08-15',
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied [ID]' }] },
            valueCodeableConcept: { coding: [{ system: 'http://www.genenames.org', code: 'HGNC:1100', display: 'BRCA1' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '81258-6', display: 'Variant allele frequency [NFr]' }] },
            valueQuantity: { value: 0.15, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48006-1', display: 'Molecular consequence' }] },
            valueCodeableConcept: { coding: [{ code: 'splice_region_variant', display: 'Splice site variant' }] },
          },
        ],
      },
    },

    // ── Observations: WBC (lab, 5 timepoints) ────────────────────────────────
    ...[
      { date: '2021-06-20', value: 5.8 },   // baseline
      { date: '2022-03-01', value: 3.1 },   // on-treatment (chemo nadir)
      { date: '2022-12-15', value: 6.2 },   // 1.5-year follow-up
      { date: '2023-07-15', value: 7.4 },   // at progression
      { date: '2024-06-15', value: 5.5 },   // on second-line
    ].map(({ date, value }, i) => ({
      fullUrl: `urn:uuid:obs-wbc-${i + 1}`,
      resource: {
        resourceType: 'Observation' as const,
        id: `obs-wbc-${i + 1}`,
        status: 'final' as const,
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: {
          coding: [{ system: 'http://loinc.org', code: '6690-2', display: 'Leukocytes [#/volume] in Blood by Automated count' }],
          text: 'WBC',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        valueQuantity: { value, unit: '10⁹/L', system: 'http://unitsofmeasure.org', code: '10*9/L' },
        referenceRange: [{ low: { value: 4.0, unit: '10⁹/L' }, high: { value: 11.0, unit: '10⁹/L' } }],
      },
    })),

    // ── Observations: CA 15-3 (lab, 5 timepoints) ────────────────────────────
    ...[
      { date: '2021-06-20', value: 18 },   // baseline — normal
      { date: '2022-03-01', value: 24 },   // on-treatment — normal
      { date: '2022-12-15', value: 20 },   // follow-up — normal
      { date: '2023-07-15', value: 68 },   // at progression — elevated
      { date: '2024-06-15', value: 45 },   // on second-line — elevated
    ].map(({ date, value }, i) => ({
      fullUrl: `urn:uuid:obs-ca153-${i + 1}`,
      resource: {
        resourceType: 'Observation' as const,
        id: `obs-ca153-${i + 1}`,
        status: 'final' as const,
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: {
          coding: [{ system: 'http://loinc.org', code: '10334-1', display: 'Cancer Ag 15-3 [Units/volume] in Serum or Plasma' }],
          text: 'CA 15-3',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        valueQuantity: { value, unit: 'U/mL', system: 'http://unitsofmeasure.org', code: 'U/mL' },
        referenceRange: [{ high: { value: 30, unit: 'U/mL' } }],
      },
    })),

    // ── Observations: CEA (lab, 5 timepoints) ────────────────────────────────
    ...[
      { date: '2021-06-20', value: 2.1 },   // baseline — normal
      { date: '2022-03-01', value: 1.8 },   // on-treatment — normal
      { date: '2022-12-15', value: 2.3 },   // follow-up — normal
      { date: '2023-07-15', value: 12.4 },  // at progression — elevated
      { date: '2024-06-15', value: 8.7 },   // on second-line — elevated
    ].map(({ date, value }, i) => ({
      fullUrl: `urn:uuid:obs-cea-${i + 1}`,
      resource: {
        resourceType: 'Observation' as const,
        id: `obs-cea-${i + 1}`,
        status: 'final' as const,
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: {
          coding: [{ system: 'http://loinc.org', code: '2857-1', display: 'Carcinoembryonic Ag [Mass/volume] in Serum or Plasma' }],
          text: 'CEA',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        valueQuantity: { value, unit: 'ng/mL', system: 'http://unitsofmeasure.org', code: 'ng/mL' },
        referenceRange: [{ high: { value: 5.0, unit: 'ng/mL' } }],
      },
    })),

    // ── DocumentReference: Clinical notes (3) ────────────────────────────────
    {
      fullUrl: 'urn:uuid:docref-initial',
      resource: {
        resourceType: 'DocumentReference',
        id: 'docref-initial',
        status: 'current',
        type: {
          coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }],
          text: 'Initial oncology consultation',
        },
        subject: PATIENT_REF,
        date: '2021-06-15T14:00:00Z',
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: b(
              'Initial oncology consultation — 2021-06-15\n\n' +
              'Patient Marie Dupont, 51 years old, referred for left breast mass discovered on routine screening. ' +
              'Mammography and ultrasound-guided core biopsy confirm invasive ductal carcinoma grade III, HER2+ (IHC 3+), ' +
              'ER negative, PR negative. Axillary lymph node involvement on ultrasound (2 nodes). ' +
              'cT2 N1 M0 — Stage IIB. MDT decision: primary surgery (mastectomy + axillary dissection) ' +
              'followed by adjuvant chemotherapy (FEC-D) and trastuzumab. Patient informed and consented.'
            ),
          },
        }],
      },
    },
    {
      fullUrl: 'urn:uuid:docref-year1',
      resource: {
        resourceType: 'DocumentReference',
        id: 'docref-year1',
        status: 'current',
        type: {
          coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }],
          text: 'One-year follow-up consultation',
        },
        subject: PATIENT_REF,
        date: '2022-06-15T10:30:00Z',
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: b(
              'One-year follow-up — 2022-06-15\n\n' +
              'Patient completed adjuvant FEC-D chemotherapy (6 cycles) and adjuvant radiotherapy (50 Gy / 25 fractions). ' +
              'Currently on trastuzumab maintenance (dose 4). CT thorax-abdomen normal — no evidence of recurrence. ' +
              'CA 15-3 and CEA within normal limits. Reports mild fatigue and grade 1 peripheral neuropathy. ' +
              'LVEF on echocardiography stable at 62%. Continue current management. Next imaging in 6 months.'
            ),
          },
        }],
      },
    },
    {
      fullUrl: 'urn:uuid:docref-progression',
      resource: {
        resourceType: 'DocumentReference',
        id: 'docref-progression',
        status: 'current',
        type: {
          coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }],
          text: 'Post-progression assessment',
        },
        subject: PATIENT_REF,
        date: '2023-07-20T09:00:00Z',
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: b(
              'Post-progression assessment — 2023-07-20\n\n' +
              'CT and PET-CT confirm 2 hypermetabolic hepatic lesions consistent with metastases. ' +
              'CA 15-3 elevated at 68 U/mL; CEA at 12.4 ng/mL. Liver biopsy (2023-07-01) confirms ' +
              'breast cancer metastasis, HER2+ retained. Comprehensive genomic profiling requested. ' +
              'MDT decision: second-line therapy with pertuzumab + trastuzumab. ' +
              'Patient anxious but accepting of proposed management. Social worker referral made.'
            ),
          },
        }],
      },
    },

  ],
}

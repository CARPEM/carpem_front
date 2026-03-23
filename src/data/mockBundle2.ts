/**
 * Mock FHIR R4 Patient/$everything bundle — fictional patient data.
 * Patient: Jean Martin, KRAS-mutant sigmoid colon adenocarcinoma.
 * T0 = 2022-09-10 (date of primary diagnosis).
 * Reference date for this mock: 2026-03-19 (~42 months from T0).
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

const PATIENT_REF = { reference: 'Patient/patient-002' }

// ─── Mock bundle ─────────────────────────────────────────────────────────────

export const mockBundle2: FhirBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 58,
  entry: [

    // ── Patient ───────────────────────────────────────────────────────────────
    {
      fullUrl: 'urn:uuid:patient-002',
      resource: {
        resourceType: 'Patient',
        id: 'patient-002',
        identifier: [
          {
            use: 'official',
            system: 'http://carpem.fr/patient-id',
            value: 'CARPEM-2022-00456',
          },
          {
            use: 'usual',
            type: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR', display: 'Medical record number' }],
            },
            system: 'http://aphp.fr/mrn',
            value: 'MRN-654321',
          },
        ],
        name: [{ use: 'official', family: 'Martin', given: ['Jean'] }],
        gender: 'male',
        birthDate: '1945-08-14',
        deceasedBoolean: false,
      },
    },

    // ── Condition: Primary diagnosis — T0 anchor ──────────────────────────────
    {
      fullUrl: 'urn:uuid:cond2-primary',
      resource: {
        resourceType: 'Condition',
        id: 'cond2-primary',
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
          coding: [{ system: 'http://snomed.info/sct', code: '363406005', display: 'Malignant neoplasm of colon' }],
          text: 'Adenocarcinoma of sigmoid colon, KRAS G12D mutant, T3 N1 M0 — Stage IIIB',
        },
        bodySite: [
          { coding: [{ system: 'http://snomed.info/sct', code: '60184004', display: 'Sigmoid colon structure' }] },
        ],
        subject: PATIENT_REF,
        onsetDateTime: '2022-09-10',
        recordedDate: '2022-09-10',
      },
    },

    // ── Condition: Disease progression — liver metastases ─────────────────────
    {
      fullUrl: 'urn:uuid:cond2-progression',
      resource: {
        resourceType: 'Condition',
        id: 'cond2-progression',
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
          coding: [{ system: 'http://snomed.info/sct', code: '94381002', display: 'Secondary malignant neoplasm of liver' }],
          text: 'Hepatic metastases — disease progression (3 bilobar lesions)',
        },
        subject: PATIENT_REF,
        onsetDateTime: '2024-06-15',
      },
    },

    // ── Observation: TNM staging ──────────────────────────────────────────────
    {
      fullUrl: 'urn:uuid:obs2-tnm',
      resource: {
        resourceType: 'Observation',
        id: 'obs2-tnm',
        status: 'final',
        category: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] },
        ],
        code: { coding: [{ system: 'http://loinc.org', code: '21908-9', display: 'Stage group.clinical Cancer' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2022-09-10',
        valueCodeableConcept: {
          coding: [{ system: 'http://cancerstaging.org', code: 'IIIB', display: 'Stage IIIB' }],
          text: 'T3 N1 M0 — Stage IIIB',
        },
      },
    },

    // ── Observation: Disease progression marker ───────────────────────────────
    {
      fullUrl: 'urn:uuid:obs2-progression',
      resource: {
        resourceType: 'Observation',
        id: 'obs2-progression',
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '21976-6', display: 'Disease progression' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2024-06-15',
        valueCodeableConcept: {
          coding: [{ system: 'http://recist.org', code: 'PD', display: 'Progressive Disease (RECIST)' }],
        },
      },
    },

    // ── Procedure: Sigmoid colectomy ──────────────────────────────────────────
    {
      fullUrl: 'urn:uuid:proc2-colectomy',
      resource: {
        resourceType: 'Procedure',
        id: 'proc2-colectomy',
        status: 'completed',
        category: {
          coding: [{ system: 'http://snomed.info/sct', code: '387713003', display: 'Surgical procedure' }],
        },
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '85971008', display: 'Sigmoid colectomy' }],
          text: 'Laparoscopic sigmoid colectomy with primary anastomosis + D3 lymphadenectomy',
        },
        subject: PATIENT_REF,
        performedDateTime: '2022-10-05',
        note: [{ text: 'R0 resection achieved. 18 lymph nodes harvested, 3 positive (pT3 N1b M0).' }],
      },
    },

    // ── Procedure: Percutaneous liver biopsy ──────────────────────────────────
    {
      fullUrl: 'urn:uuid:proc2-liver-biopsy',
      resource: {
        resourceType: 'Procedure',
        id: 'proc2-liver-biopsy',
        status: 'completed',
        category: {
          coding: [{ system: 'http://snomed.info/sct', code: '387713003', display: 'Surgical procedure' }],
        },
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '432416000', display: 'Ultrasound guided percutaneous biopsy of liver' }],
          text: 'CT-guided percutaneous liver biopsy (segment VI lesion)',
        },
        subject: PATIENT_REF,
        performedDateTime: '2024-07-10',
      },
    },

    // ── MedicationAdministration: FOLFOX (L01, adjuvant) — 12 cycles ─────────
    // Every ~2 weeks Nov 2022 – Apr 2023
    ...([
      '2022-11-01', '2022-11-15', '2022-12-01', '2022-12-15',
      '2023-01-05', '2023-01-19', '2023-02-02', '2023-02-16',
      '2023-03-02', '2023-03-16', '2023-04-01', '2023-04-15',
    ]).map((date, i) => ({
      fullUrl: `urn:uuid:medadmin2-folfox-${i + 1}`,
      resource: {
        resourceType: 'MedicationAdministration' as const,
        id: `medadmin2-folfox-${i + 1}`,
        status: 'completed' as const,
        medicationCodeableConcept: {
          coding: [
            { system: 'http://www.whocc.no/atc', code: 'L01', display: 'Antineoplastic agents' },
            { system: 'http://www.whocc.no/atc', code: 'L01XA03', display: 'Oxaliplatin' },
          ],
          text: 'FOLFOX (Oxaliplatin + Leucovorin + Fluorouracil)',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        note: [{ text: `FOLFOX cycle ${i + 1} of 12` }],
      },
    })),

    // ── MedicationAdministration: FOLFIRI (L01) — 8 cycles from Aug 2024 ─────
    ...([
      '2024-08-01', '2024-08-15', '2024-09-01', '2024-09-15',
      '2024-10-01', '2024-10-15', '2024-11-01', '2024-11-15',
    ]).map((date, i) => ({
      fullUrl: `urn:uuid:medadmin2-folfiri-${i + 1}`,
      resource: {
        resourceType: 'MedicationAdministration' as const,
        id: `medadmin2-folfiri-${i + 1}`,
        status: 'completed' as const,
        medicationCodeableConcept: {
          coding: [
            { system: 'http://www.whocc.no/atc', code: 'L01', display: 'Antineoplastic agents' },
            { system: 'http://www.whocc.no/atc', code: 'L01XX19', display: 'Irinotecan' },
          ],
          text: 'FOLFIRI (Irinotecan + Leucovorin + Fluorouracil)',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        note: [{ text: `FOLFIRI cycle ${i + 1}` }],
      },
    })),

    // ── MedicationAdministration: Bevacizumab (L01XC07) — same dates ─────────
    ...([
      '2024-08-01', '2024-08-15', '2024-09-01', '2024-09-15',
      '2024-10-01', '2024-10-15', '2024-11-01', '2024-11-15',
    ]).map((date, i) => ({
      fullUrl: `urn:uuid:medadmin2-beva-${i + 1}`,
      resource: {
        resourceType: 'MedicationAdministration' as const,
        id: `medadmin2-beva-${i + 1}`,
        status: 'completed' as const,
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.whocc.no/atc', code: 'L01XC07', display: 'Bevacizumab' }],
          text: 'Bevacizumab (Avastin)',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        note: [{ text: `Bevacizumab cycle ${i + 1}` }],
      },
    })),

    // ── MedicationRequest: FOLFIRI + Bevacizumab ongoing ─────────────────────
    {
      fullUrl: 'urn:uuid:medreq2-folfiri-beva',
      resource: {
        resourceType: 'MedicationRequest',
        id: 'medreq2-folfiri-beva',
        status: 'active',
        intent: 'plan',
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.whocc.no/atc', code: 'L01XC07', display: 'Bevacizumab' }],
          text: 'FOLFIRI + Bevacizumab (ongoing)',
        },
        subject: PATIENT_REF,
        authoredOn: '2024-08-01',
      },
    },

    // ── ImagingStudy: CT staging at diagnosis ─────────────────────────────────
    {
      fullUrl: 'urn:uuid:imaging2-ct-staging',
      resource: {
        resourceType: 'ImagingStudy',
        id: 'imaging2-ct-staging',
        status: 'available',
        subject: PATIENT_REF,
        started: '2022-09-05T08:00:00Z',
        modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
        numberOfSeries: 3,
        numberOfInstances: 345,
        description: 'CT Thorax-Abdomen-Pelvis — staging — T3 N1 M0 confirmed, no distant metastases',
      },
    },

    // ── ImagingStudy: CT 9-month surveillance (post-adjuvant) ────────────────
    {
      fullUrl: 'urn:uuid:imaging2-ct-9m',
      resource: {
        resourceType: 'ImagingStudy',
        id: 'imaging2-ct-9m',
        status: 'available',
        subject: PATIENT_REF,
        started: '2023-06-10T09:00:00Z',
        modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
        numberOfSeries: 3,
        numberOfInstances: 318,
        description: 'CT Thorax-Abdomen-Pelvis — 9-month surveillance — no evidence of recurrence',
      },
    },

    // ── ImagingStudy: CT 18-month surveillance ────────────────────────────────
    {
      fullUrl: 'urn:uuid:imaging2-ct-18m',
      resource: {
        resourceType: 'ImagingStudy',
        id: 'imaging2-ct-18m',
        status: 'available',
        subject: PATIENT_REF,
        started: '2024-03-15T09:30:00Z',
        modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
        numberOfSeries: 3,
        numberOfInstances: 302,
        description: 'CT Thorax-Abdomen-Pelvis — 18-month surveillance — no evidence of recurrence',
      },
    },

    // ── ImagingStudy: CT at progression ──────────────────────────────────────
    {
      fullUrl: 'urn:uuid:imaging2-ct-prog',
      resource: {
        resourceType: 'ImagingStudy',
        id: 'imaging2-ct-prog',
        status: 'available',
        subject: PATIENT_REF,
        started: '2024-06-10T08:30:00Z',
        modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
        numberOfSeries: 4,
        numberOfInstances: 389,
        description: 'CT Thorax-Abdomen-Pelvis — 3 bilobar hepatic lesions — liver metastases',
      },
    },

    // ── ImagingStudy: MRI liver at progression ────────────────────────────────
    {
      fullUrl: 'urn:uuid:imaging2-mri-liver',
      resource: {
        resourceType: 'ImagingStudy',
        id: 'imaging2-mri-liver',
        status: 'available',
        subject: PATIENT_REF,
        started: '2024-06-25T11:00:00Z',
        modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' }],
        numberOfSeries: 6,
        numberOfInstances: 214,
        description: 'MRI liver with hepato-specific contrast — 3 metastases confirmed (max 28 mm), potentially resectable',
      },
    },

    // ── Specimen: Baseline FFPE colon biopsy ──────────────────────────────────
    {
      fullUrl: 'urn:uuid:specimen2-baseline',
      resource: {
        resourceType: 'Specimen',
        id: 'specimen2-baseline',
        extension: [
          { url: 'http://carpem.fr/fhir/StructureDefinition/collection-context', valueCode: 'baseline' },
        ],
        type: {
          coding: [{ system: 'http://snomed.info/sct', code: '119376003', display: 'Tissue specimen' }],
          text: 'FFPE tissue block — sigmoid colon biopsy',
        },
        subject: PATIENT_REF,
        collection: {
          collectedDateTime: '2022-09-05',
          bodySite: { coding: [{ system: 'http://snomed.info/sct', code: '60184004', display: 'Sigmoid colon structure' }] },
          method: { coding: [{ system: 'http://snomed.info/sct', code: '386089008', display: 'Colonoscopic biopsy' }] },
        },
      },
    },

    // ── Specimen: Blood sample at diagnosis ───────────────────────────────────
    {
      fullUrl: 'urn:uuid:specimen2-blood-baseline',
      resource: {
        resourceType: 'Specimen',
        id: 'specimen2-blood-baseline',
        extension: [
          { url: 'http://carpem.fr/fhir/StructureDefinition/collection-context', valueCode: 'baseline' },
        ],
        type: {
          coding: [{ system: 'http://snomed.info/sct', code: '119297000', display: 'Blood specimen' }],
          text: 'Blood serum — baseline',
        },
        subject: PATIENT_REF,
        collection: {
          collectedDateTime: '2022-09-10',
          bodySite: { coding: [{ system: 'http://snomed.info/sct', code: '70925003', display: 'Antecubital fossa structure' }] },
          method: { coding: [{ system: 'http://snomed.info/sct', code: '28520004', display: 'Venipuncture' }] },
        },
      },
    },

    // ── Specimen: Liver biopsy at progression ─────────────────────────────────
    {
      fullUrl: 'urn:uuid:specimen2-progression',
      resource: {
        resourceType: 'Specimen',
        id: 'specimen2-progression',
        extension: [
          { url: 'http://carpem.fr/fhir/StructureDefinition/collection-context', valueCode: 'at-progression' },
        ],
        type: {
          coding: [{ system: 'http://snomed.info/sct', code: '119376003', display: 'Tissue specimen' }],
          text: 'FFPE tissue block — liver biopsy at progression',
        },
        subject: PATIENT_REF,
        collection: {
          collectedDateTime: '2024-07-10',
          bodySite: { coding: [{ system: 'http://snomed.info/sct', code: '10200004', display: 'Liver structure' }] },
          method: { coding: [{ system: 'http://snomed.info/sct', code: '432416000', display: 'CT-guided percutaneous biopsy' }] },
        },
      },
    },

    // ── DiagnosticReport: Comprehensive genomic profiling ─────────────────────
    {
      fullUrl: 'urn:uuid:report2-genomic',
      resource: {
        resourceType: 'DiagnosticReport',
        id: 'report2-genomic',
        status: 'final',
        category: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'GE', display: 'Genetics' }] },
        ],
        code: {
          coding: [{ system: 'http://loinc.org', code: '81247-9', display: 'Master HL7 genetic variant reporting panel' }],
          text: 'Comprehensive genomic profiling (CGP) — liver metastasis',
        },
        subject: PATIENT_REF,
        effectiveDateTime: '2024-07-25',
        specimen: [{ reference: 'Specimen/specimen2-progression' }],
        result: [
          { reference: 'Observation/obs2-variant-kras' },
          { reference: 'Observation/obs2-variant-apc' },
          { reference: 'Observation/obs2-variant-tp53' },
        ],
      },
    },

    // ── Observations: Genomic variants ───────────────────────────────────────
    {
      fullUrl: 'urn:uuid:obs2-variant-kras',
      resource: {
        resourceType: 'Observation',
        id: 'obs2-variant-kras',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '69548-6', display: 'Genetic variant assessment' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2024-07-25',
        interpretation: [
          { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'A', display: 'Abnormal' }] },
        ],
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied [ID]' }] },
            valueCodeableConcept: { coding: [{ system: 'http://www.genenames.org', code: 'HGNC:6407', display: 'KRAS' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '81258-6', display: 'Variant allele frequency [NFr]' }] },
            valueQuantity: { value: 0.42, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48006-1', display: 'Molecular consequence' }] },
            valueCodeableConcept: { coding: [{ code: 'missense_variant', display: 'Missense variant (G12D)' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48004-6', display: 'DNA change (c.HGVS)' }] },
            valueString: 'c.35G>A',
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48005-3', display: 'Amino acid change (p.HGVS)' }] },
            valueString: 'p.Gly12Asp',
          },
        ],
      },
    },
    {
      fullUrl: 'urn:uuid:obs2-variant-apc',
      resource: {
        resourceType: 'Observation',
        id: 'obs2-variant-apc',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '69548-6', display: 'Genetic variant assessment' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2024-07-25',
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied [ID]' }] },
            valueCodeableConcept: { coding: [{ system: 'http://www.genenames.org', code: 'HGNC:583', display: 'APC' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '81258-6', display: 'Variant allele frequency [NFr]' }] },
            valueQuantity: { value: 0.38, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48006-1', display: 'Molecular consequence' }] },
            valueCodeableConcept: { coding: [{ code: 'frameshift_variant', display: 'Frameshift variant' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48004-6', display: 'DNA change (c.HGVS)' }] },
            valueString: 'c.3927_3931del',
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48005-3', display: 'Amino acid change (p.HGVS)' }] },
            valueString: 'p.Glu1309Aspfs*4',
          },
        ],
      },
    },
    {
      fullUrl: 'urn:uuid:obs2-variant-tp53',
      resource: {
        resourceType: 'Observation',
        id: 'obs2-variant-tp53',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: { coding: [{ system: 'http://loinc.org', code: '69548-6', display: 'Genetic variant assessment' }] },
        subject: PATIENT_REF,
        effectiveDateTime: '2024-07-25',
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied [ID]' }] },
            valueCodeableConcept: { coding: [{ system: 'http://www.genenames.org', code: 'HGNC:11998', display: 'TP53' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '81258-6', display: 'Variant allele frequency [NFr]' }] },
            valueQuantity: { value: 0.29, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48006-1', display: 'Molecular consequence' }] },
            valueCodeableConcept: { coding: [{ code: 'missense_variant', display: 'Missense variant' }] },
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48004-6', display: 'DNA change (c.HGVS)' }] },
            valueString: 'c.742C>T',
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '48005-3', display: 'Amino acid change (p.HGVS)' }] },
            valueString: 'p.Arg248Trp',
          },
        ],
      },
    },

    // ── Observations: CEA (lab, 6 timepoints) ────────────────────────────────
    ...[
      { date: '2022-09-10', value: 18.4 },  // baseline — elevated
      { date: '2023-02-15', value: 6.2 },   // on FOLFOX — decreasing
      { date: '2023-06-10', value: 3.1 },   // post-adjuvant — near normal
      { date: '2024-03-15', value: 4.8 },   // surveillance — normal
      { date: '2024-06-10', value: 42.7 },  // at progression — elevated
      { date: '2024-11-15', value: 28.3 },  // on FOLFIRI+Beva — decreasing
    ].map(({ date, value }, i) => ({
      fullUrl: `urn:uuid:obs2-cea-${i + 1}`,
      resource: {
        resourceType: 'Observation' as const,
        id: `obs2-cea-${i + 1}`,
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

    // ── Observations: CA 19-9 (lab, 6 timepoints) ────────────────────────────
    ...[
      { date: '2022-09-10', value: 142 },   // baseline — elevated
      { date: '2023-02-15', value: 48 },    // on FOLFOX — decreasing
      { date: '2023-06-10', value: 22 },    // post-adjuvant — normal
      { date: '2024-03-15', value: 31 },    // surveillance — borderline
      { date: '2024-06-10', value: 387 },   // at progression — very elevated
      { date: '2024-11-15', value: 198 },   // on FOLFIRI+Beva — decreasing
    ].map(({ date, value }, i) => ({
      fullUrl: `urn:uuid:obs2-ca199-${i + 1}`,
      resource: {
        resourceType: 'Observation' as const,
        id: `obs2-ca199-${i + 1}`,
        status: 'final' as const,
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: {
          coding: [{ system: 'http://loinc.org', code: '24108-3', display: 'Cancer Ag 19-9 [Units/volume] in Serum or Plasma' }],
          text: 'CA 19-9',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        valueQuantity: { value, unit: 'U/mL', system: 'http://unitsofmeasure.org', code: 'U/mL' },
        referenceRange: [{ high: { value: 37, unit: 'U/mL' } }],
      },
    })),

    // ── Observations: Hemoglobin (lab, 6 timepoints) ──────────────────────────
    ...[
      { date: '2022-09-10', value: 9.8 },   // baseline — anemia (GI bleeding)
      { date: '2023-02-15', value: 10.4 },  // on FOLFOX — slight improvement
      { date: '2023-06-10', value: 13.2 },  // post-adjuvant — recovered
      { date: '2024-03-15', value: 12.8 },  // surveillance — normal
      { date: '2024-06-10', value: 11.1 },  // at progression — mild anemia
      { date: '2024-11-15', value: 10.6 },  // on FOLFIRI+Beva — mild anemia
    ].map(({ date, value }, i) => ({
      fullUrl: `urn:uuid:obs2-hb-${i + 1}`,
      resource: {
        resourceType: 'Observation' as const,
        id: `obs2-hb-${i + 1}`,
        status: 'final' as const,
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
        code: {
          coding: [{ system: 'http://loinc.org', code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' }],
          text: 'Hemoglobin',
        },
        subject: PATIENT_REF,
        effectiveDateTime: date,
        valueQuantity: { value, unit: 'g/dL', system: 'http://unitsofmeasure.org', code: 'g/dL' },
        referenceRange: [{ low: { value: 13.0, unit: 'g/dL' }, high: { value: 17.5, unit: 'g/dL' } }],
      },
    })),

    // ── DocumentReference: Initial oncology consultation ──────────────────────
    {
      fullUrl: 'urn:uuid:docref2-initial',
      resource: {
        resourceType: 'DocumentReference',
        id: 'docref2-initial',
        status: 'current',
        type: {
          coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }],
          text: 'Initial oncology consultation',
        },
        subject: PATIENT_REF,
        date: '2022-09-10T14:00:00Z',
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: b(
              'Initial oncology consultation — 2022-09-10\n\n' +
              'Patient Jean Martin, 77 years old, referred following colonoscopy performed for rectal bleeding and change in bowel habits over 3 months. ' +
              'Colonoscopy identified a stenosing mass of the sigmoid colon at 35 cm. Biopsy confirms moderately differentiated adenocarcinoma. ' +
              'CT staging (2022-09-05): T3 N1 M0, no distant metastases. CEA = 18.4 ng/mL, CA 19-9 = 142 U/mL. ' +
              'Moderate microcytic anaemia (Hb 9.8 g/dL) secondary to chronic GI blood loss. ' +
              'Molecular analysis: KRAS G12D mutation, MSS (microsatellite stable). RAS/BRAF wild-type: negative. ' +
              'MDT decision: primary laparoscopic sigmoid colectomy followed by adjuvant FOLFOX x 12 cycles. ' +
              'Patient and family informed. Anesthesiology pre-operative assessment requested.'
            ),
          },
        }],
      },
    },

    // ── DocumentReference: Post-operative note ────────────────────────────────
    {
      fullUrl: 'urn:uuid:docref2-postop',
      resource: {
        resourceType: 'DocumentReference',
        id: 'docref2-postop',
        status: 'current',
        type: {
          coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }],
          text: 'Post-operative oncology review',
        },
        subject: PATIENT_REF,
        date: '2022-10-20T10:00:00Z',
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: b(
              'Post-operative review — 2022-10-20\n\n' +
              'Laparoscopic sigmoid colectomy performed 2022-10-05. R0 resection confirmed. ' +
              'Histology: pT3 N1b M0 (3/18 lymph nodes positive), grade 2, no lymphovascular invasion. MSS. ' +
              'Post-operative course uneventful. Patient discharged day 5. ' +
              'Haemoglobin recovering (Hb 11.2 g/dL at discharge). Iron supplementation initiated. ' +
              'Adjuvant FOLFOX chemotherapy to begin 2022-11-01. Geriatric oncology assessment completed — ' +
              'patient deemed fit for standard-dose FOLFOX. Performance status ECOG 1.'
            ),
          },
        }],
      },
    },

    // ── DocumentReference: Progression assessment ─────────────────────────────
    {
      fullUrl: 'urn:uuid:docref2-progression',
      resource: {
        resourceType: 'DocumentReference',
        id: 'docref2-progression',
        status: 'current',
        type: {
          coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }],
          text: 'Hepatic progression assessment',
        },
        subject: PATIENT_REF,
        date: '2024-07-01T09:00:00Z',
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: b(
              'Hepatic progression assessment — 2024-07-01\n\n' +
              'Surveillance CT (2024-06-10) identifies 3 new hepatic lesions (max 28 mm, bilobar) not present at 18-month CT. ' +
              'CEA risen to 42.7 ng/mL; CA 19-9 at 387 U/mL. PET-CT and MRI liver confirm bilobar metastatic disease. ' +
              'CT-guided liver biopsy (2024-07-10) confirms colorectal metastasis, KRAS G12D retained. ' +
              'Comprehensive genomic profiling requested. Liver MDT: lesions potentially resectable after downstaging. ' +
              'Decision: FOLFIRI + Bevacizumab with reassessment after 4 cycles (surgical intent). ' +
              'Patient ECOG PS 1. Informed of palliative intent pending response to chemotherapy. ' +
              'Geriatric review: no contraindication to bevacizumab. Hypertension to be monitored closely.'
            ),
          },
        }],
      },
    },


    // ── Encounters (hospitalizations) ─────────────────────────────────────────
    {
      fullUrl: 'urn:uuid:enc2-diag',
      resource: {
        resourceType: 'Encounter', id: 'enc2-diag', status: 'finished',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
        type: [{ text: 'Initial staging workup — colonoscopy, CT TAP, MDT referral' }],
        subject: PATIENT_REF,
        period: { start: '2022-09-10', end: '2022-09-15' },
      },
    },
    {
      fullUrl: 'urn:uuid:enc2-surgery',
      resource: {
        resourceType: 'Encounter', id: 'enc2-surgery', status: 'finished',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
        type: [{ text: 'Post-operative care — laparoscopic sigmoid colectomy' }],
        subject: PATIENT_REF,
        period: { start: '2022-10-05', end: '2022-10-12' },
      },
    },
    {
      fullUrl: 'urn:uuid:enc2-folfox-ae',
      resource: {
        resourceType: 'Encounter', id: 'enc2-folfox-ae', status: 'finished',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
        type: [{ text: 'FOLFOX adverse event — grade 3 nausea, dehydration, neuropathy' }],
        subject: PATIENT_REF,
        period: { start: '2023-02-18', end: '2023-02-22' },
      },
    },

  ],
}

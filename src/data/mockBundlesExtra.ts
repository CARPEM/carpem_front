/**
 * Mock FHIR R4 bundles — patients 3 to 10. Fictional data only.
 *
 * P3  Sophie Laurent,    38F — Cervical SCC HPV16+, T0=2021-03-15
 * P4  Robert Lefevre,    65M — NSCLC EGFR del19,    T0=2020-11-08
 * P5  Isabelle Moreau,   58F — Ovarian HGSOC BRCA2, T0=2019-08-20
 * P6  Alexandre Petit,   47M — Melanoma BRAF V600E, T0=2022-04-10
 * P7  Marguerite Blanc,  72F — AML FLT3-ITD,        T0=2023-01-15
 * P8  Henri Rousseau,    55M — Prostate mCRPC,      T0=2018-06-01
 * P9  Camille Fontaine,  44F — TNBC BRCA1,          T0=2023-06-01
 * P10 Pierre Garnier,    69M — Pancreatic PDAC,     T0=2024-01-15
 */
import type { FhirBundle } from '@/types/fhir'

function b(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

const T0_EXT = { url: 'http://carpem.fr/fhir/StructureDefinition/t0-anchor', valueBoolean: true as const }
const ctx = (code: string) => ({ url: 'http://carpem.fr/fhir/StructureDefinition/collection-context', valueCode: code })
const clinActive  = { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',   code: 'active',    display: 'Active'    }] }
const verConfirm  = { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }] }
const catEncDx    = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category',  code: 'encounter-diagnosis' }] }]
const catLab      = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }]
const progressionCode = { coding: [{ system: 'http://loinc.org', code: '21976-6', display: 'Disease progression' }] }
const progressionVal  = { coding: [{ system: 'http://recist.org', code: 'PD', display: 'Progressive Disease (RECIST)' }] }
const surgCat = { coding: [{ system: 'http://snomed.info/sct', code: '387713003', display: 'Surgical procedure' }] }
const rtCat   = { coding: [{ system: 'http://snomed.info/sct', code: '108290001', display: 'Radiation oncology AND/OR radiotherapy' }] }

function doses(
  prefix: string,
  dates: string[],
  atcCode: string,
  atcDisplay: string,
  text: string,
  patRef: { reference: string },
): object[] {
  return dates.map((date, i) => ({
    fullUrl: `urn:uuid:${prefix}-${i + 1}`,
    resource: {
      resourceType: 'MedicationAdministration' as const,
      id: `${prefix}-${i + 1}`,
      status: 'completed' as const,
      medicationCodeableConcept: {
        coding: [{ system: 'http://www.whocc.no/atc', code: atcCode, display: atcDisplay }],
        text,
      },
      subject: patRef,
      effectiveDateTime: date,
      note: [{ text: `${text} — dose ${i + 1}` }],
    },
  }))
}

function labObs(
  prefix: string,
  loincCode: string,
  loincDisplay: string,
  label: string,
  unit: string,
  ucumCode: string,
  points: { date: string; value: number }[],
  refHigh: number | null,
  refLow: number | null,
  patRef: { reference: string },
): object[] {
  return points.map(({ date, value }, i) => ({
    fullUrl: `urn:uuid:${prefix}-${i + 1}`,
    resource: {
      resourceType: 'Observation' as const,
      id: `${prefix}-${i + 1}`,
      status: 'final' as const,
      category: catLab,
      code: { coding: [{ system: 'http://loinc.org', code: loincCode, display: loincDisplay }], text: label },
      subject: patRef,
      effectiveDateTime: date,
      valueQuantity: { value, unit, system: 'http://unitsofmeasure.org', code: ucumCode },
      referenceRange: [
        ...(refLow  != null ? [{ low:  { value: refLow,  unit } }] : []),
        ...(refHigh != null ? [{ high: { value: refHigh, unit } }] : []),
      ],
    },
  }))
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT 3 — Sophie Laurent, 38F, Cervical SCC HPV16+
// T0 = 2021-03-15 | ~60 months to 2026-03
// ═══════════════════════════════════════════════════════════════════════════════
const P3 = { reference: 'Patient/patient-003' }
export const mockBundle3: FhirBundle = {
  resourceType: 'Bundle', type: 'searchset', total: 42,
  entry: [
    { fullUrl: 'urn:uuid:patient-003', resource: {
      resourceType: 'Patient', id: 'patient-003',
      identifier: [{ use: 'official', system: 'http://carpem.fr/patient-id', value: 'CARPEM-2021-00789' }],
      name: [{ use: 'official', family: 'Laurent', given: ['Sophie'] }],
      gender: 'female', birthDate: '1987-05-22', deceasedBoolean: false,
    }},
    { fullUrl: 'urn:uuid:cond3-primary', resource: {
      resourceType: 'Condition', id: 'cond3-primary',
      extension: [T0_EXT], clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '363354003', display: 'Malignant neoplasm of cervix uteri' }],
              text: 'Squamous cell carcinoma of the cervix, HPV16+, FIGO IB2' },
      subject: P3, onsetDateTime: '2021-03-15', recordedDate: '2021-03-15',
    }},
    { fullUrl: 'urn:uuid:cond3-progression', resource: {
      resourceType: 'Condition', id: 'cond3-progression',
      clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '94385007', display: 'Secondary malignant neoplasm of lung' }],
              text: 'Pulmonary metastases — disease progression' },
      subject: P3, onsetDateTime: '2023-09-10',
    }},
    { fullUrl: 'urn:uuid:obs3-staging', resource: {
      resourceType: 'Observation', id: 'obs3-staging', status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: '21908-9', display: 'Stage group.clinical Cancer' }] },
      subject: P3, effectiveDateTime: '2021-03-15',
      valueCodeableConcept: { text: 'FIGO IB2 — tumour 4.5 cm, negative lymph nodes on MRI' },
    }},
    { fullUrl: 'urn:uuid:obs3-prog', resource: {
      resourceType: 'Observation', id: 'obs3-prog', status: 'final',
      code: progressionCode, subject: P3, effectiveDateTime: '2023-09-10',
      valueCodeableConcept: progressionVal,
    }},
    // Procedures
    { fullUrl: 'urn:uuid:proc3-rt', resource: {
      resourceType: 'Procedure', id: 'proc3-rt', status: 'completed', category: rtCat,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '33195004', display: 'Radiotherapy' }],
              text: 'External beam RT + brachytherapy (85 Gy EQD2) concurrent with cisplatin' },
      subject: P3, performedPeriod: { start: '2021-04-01', end: '2021-06-10' },
    }},
    { fullUrl: 'urn:uuid:proc3-hysterectomy', resource: {
      resourceType: 'Procedure', id: 'proc3-hysterectomy', status: 'completed', category: surgCat,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '116140006', display: 'Radical hysterectomy' }],
              text: 'Radical hysterectomy (Wertheim) + pelvic lymphadenectomy' },
      subject: P3, performedDateTime: '2021-07-20',
    }},
    // Cisplatin concurrent with RT (6 weekly cycles)
    ...doses('p3-cisplatin', ['2021-04-01','2021-04-08','2021-04-22','2021-05-06','2021-05-20','2021-06-03'],
      'L01XA01', 'Cisplatin', 'Cisplatin (concurrent with RT)', P3),
    // Pembrolizumab 2nd line
    ...doses('p3-pembro', ['2023-10-15','2023-12-15','2024-02-15','2024-04-15','2024-06-15','2024-08-15'],
      'L01FF02', 'Pembrolizumab', 'Pembrolizumab', P3),
    // Imaging
    { fullUrl: 'urn:uuid:img3-mri-baseline', resource: {
      resourceType: 'ImagingStudy', id: 'img3-mri-baseline', status: 'available', subject: P3,
      started: '2021-03-10T08:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' }],
      numberOfSeries: 5, numberOfInstances: 210,
      description: 'MRI pelvis — IB2 cervical tumour (4.5 cm), no lymph node involvement',
    }},
    { fullUrl: 'urn:uuid:img3-ct-1y', resource: {
      resourceType: 'ImagingStudy', id: 'img3-ct-1y', status: 'available', subject: P3,
      started: '2022-03-20T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 290,
      description: 'CT TAP — 1-year surveillance — complete remission',
    }},
    { fullUrl: 'urn:uuid:img3-ct-prog', resource: {
      resourceType: 'ImagingStudy', id: 'img3-ct-prog', status: 'available', subject: P3,
      started: '2023-09-05T08:30:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 315,
      description: 'CT TAP — 2 pulmonary nodules (right lobe), suspicious for metastases',
    }},
    // Specimens
    { fullUrl: 'urn:uuid:spec3-baseline', resource: {
      resourceType: 'Specimen', id: 'spec3-baseline',
      extension: [ctx('baseline')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '119376003', display: 'Tissue specimen' }], text: 'FFPE — cervical biopsy' },
      subject: P3, collection: { collectedDateTime: '2021-03-10' },
    }},
    { fullUrl: 'urn:uuid:spec3-prog', resource: {
      resourceType: 'Specimen', id: 'spec3-prog',
      extension: [ctx('at-progression')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '119376003', display: 'Tissue specimen' }], text: 'FFPE — lung biopsy at progression' },
      subject: P3, collection: { collectedDateTime: '2023-09-20' },
    }},
    // Lab: Hb
    ...labObs('p3-hb', '718-7', 'Hemoglobin [Mass/volume] in Blood', 'Hemoglobin', 'g/dL', 'g/dL',
      [{ date:'2021-03-15', value:11.8 },{ date:'2021-06-10', value:9.4 },{ date:'2022-03-20', value:12.6 },
       { date:'2023-09-10', value:10.8 },{ date:'2024-06-15', value:11.2 }],
      null, 12.0, P3),
    // Lab: WBC
    ...labObs('p3-wbc', '6690-2', 'Leukocytes [#/volume] in Blood', 'WBC', '10⁹/L', '10*9/L',
      [{ date:'2021-03-15', value:7.2 },{ date:'2021-06-10', value:3.8 },{ date:'2022-03-20', value:6.1 },
       { date:'2023-09-10', value:8.4 },{ date:'2024-06-15', value:6.8 }],
      11.0, 4.0, P3),
    // DocumentReferences
    { fullUrl: 'urn:uuid:doc3-initial', resource: {
      resourceType: 'DocumentReference', id: 'doc3-initial', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }], text: 'Initial oncology consultation' },
      subject: P3, date: '2021-03-15T10:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Initial consultation — 2021-03-15\n\nSophie Laurent, 33 years old, referred for abnormal smear and post-coital bleeding for 3 months. ' +
        'Colposcopy biopsy confirms squamous cell carcinoma, HPV16 positive. MRI pelvis: tumour 4.5 cm, FIGO IB2. ' +
        'No lymph node involvement on imaging. MDT decision: concurrent chemoradiotherapy (cisplatin weekly) ' +
        'followed by brachytherapy, then radical hysterectomy. Patient counselled regarding fertility implications. Psychological support initiated.'
      )}}],
    }},
    { fullUrl: 'urn:uuid:doc3-prog', resource: {
      resourceType: 'DocumentReference', id: 'doc3-prog', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }], text: 'Progression assessment' },
      subject: P3, date: '2023-09-20T09:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Progression assessment — 2023-09-20\n\nCT identifies 2 new pulmonary nodules not present at 1-year surveillance. ' +
        'CT-guided lung biopsy confirms squamous cell carcinoma metastasis. PD-L1 CPS score 42. ' +
        'MDT decision: 2nd-line pembrolizumab (200 mg Q3W). Patient informed and consented.'
      )}}],
    }},
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT 4 — Robert Lefevre, 65M, NSCLC EGFR exon 19 del
// T0 = 2020-11-08 | ~64 months to 2026-03
// ═══════════════════════════════════════════════════════════════════════════════
const P4 = { reference: 'Patient/patient-004' }
export const mockBundle4: FhirBundle = {
  resourceType: 'Bundle', type: 'searchset', total: 44,
  entry: [
    { fullUrl: 'urn:uuid:patient-004', resource: {
      resourceType: 'Patient', id: 'patient-004',
      identifier: [{ use: 'official', system: 'http://carpem.fr/patient-id', value: 'CARPEM-2020-01042' }],
      name: [{ use: 'official', family: 'Lefevre', given: ['Robert'] }],
      gender: 'male', birthDate: '1960-02-14', deceasedBoolean: false,
    }},
    { fullUrl: 'urn:uuid:cond4-primary', resource: {
      resourceType: 'Condition', id: 'cond4-primary',
      extension: [T0_EXT], clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '254637007', display: 'Non-small cell carcinoma of lung' }],
              text: 'Lung adenocarcinoma, EGFR exon 19 deletion, stage IIIB (cT3 N2 M0)' },
      bodySite: [{ coding: [{ system: 'http://snomed.info/sct', code: '44029006', display: 'Left lower lobe of lung' }] }],
      subject: P4, onsetDateTime: '2020-11-08', recordedDate: '2020-11-08',
    }},
    { fullUrl: 'urn:uuid:cond4-progression', resource: {
      resourceType: 'Condition', id: 'cond4-progression',
      clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '94225005', display: 'Secondary malignant neoplasm of brain' }],
              text: 'CNS metastases — leptomeningeal progression' },
      subject: P4, onsetDateTime: '2023-02-15',
    }},
    { fullUrl: 'urn:uuid:obs4-staging', resource: {
      resourceType: 'Observation', id: 'obs4-staging', status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: '21908-9' }] },
      subject: P4, effectiveDateTime: '2020-11-08',
      valueCodeableConcept: { text: 'Stage IIIB — T3 N2 M0' },
    }},
    { fullUrl: 'urn:uuid:obs4-prog', resource: {
      resourceType: 'Observation', id: 'obs4-prog', status: 'final',
      code: progressionCode, subject: P4, effectiveDateTime: '2023-02-15',
      valueCodeableConcept: progressionVal,
    }},
    // Osimertinib 1st line — continuous, represent as quarterly doses
    ...doses('p4-osi-1l', ['2020-12-01','2021-03-01','2021-06-01','2021-09-01','2021-12-01',
                           '2022-03-01','2022-06-01','2022-09-01','2022-12-01','2023-01-15'],
      'L01XE35', 'Osimertinib', 'Osimertinib 80 mg QD', P4),
    // Osimertinib high dose post-CNS progression
    ...doses('p4-osi-2l', ['2023-03-01','2023-06-01','2023-09-01','2023-12-01','2024-03-01','2024-06-01'],
      'L01XE35', 'Osimertinib', 'Osimertinib 160 mg QD (post-CNS progression)', P4),
    // Whole brain RT for CNS progression
    { fullUrl: 'urn:uuid:proc4-wbrt', resource: {
      resourceType: 'Procedure', id: 'proc4-wbrt', status: 'completed', category: rtCat,
      code: { text: 'Whole brain radiotherapy (30 Gy / 10 fractions)' },
      subject: P4, performedPeriod: { start: '2023-02-20', end: '2023-03-03' },
    }},
    // Imaging
    { fullUrl: 'urn:uuid:img4-pet-baseline', resource: {
      resourceType: 'ImagingStudy', id: 'img4-pet-baseline', status: 'available', subject: P4,
      started: '2020-11-05T08:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'PT', display: 'Positron emission tomography' }],
      numberOfSeries: 2, numberOfInstances: 195,
      description: 'PET-CT — left lower lobe mass + mediastinal adenopathy — stage IIIB',
    }},
    { fullUrl: 'urn:uuid:img4-ct-1y', resource: {
      resourceType: 'ImagingStudy', id: 'img4-ct-1y', status: 'available', subject: P4,
      started: '2021-11-10T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 302, description: 'CT TAP — partial response, 45% tumour reduction',
    }},
    { fullUrl: 'urn:uuid:img4-mri-cns', resource: {
      resourceType: 'ImagingStudy', id: 'img4-mri-cns', status: 'available', subject: P4,
      started: '2023-02-10T10:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' }],
      numberOfSeries: 6, numberOfInstances: 224,
      description: 'MRI brain with gadolinium — leptomeningeal enhancement, 2 parenchymal lesions',
    }},
    { fullUrl: 'urn:uuid:img4-ct-2024', resource: {
      resourceType: 'ImagingStudy', id: 'img4-ct-2024', status: 'available', subject: P4,
      started: '2024-06-05T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 288, description: 'CT TAP — stable CNS disease, pulmonary stable disease',
    }},
    // Specimens
    { fullUrl: 'urn:uuid:spec4-baseline', resource: {
      resourceType: 'Specimen', id: 'spec4-baseline',
      extension: [ctx('baseline')],
      type: { text: 'FFPE — CT-guided lung biopsy' },
      subject: P4, collection: { collectedDateTime: '2020-11-03' },
    }},
    { fullUrl: 'urn:uuid:spec4-liquid', resource: {
      resourceType: 'Specimen', id: 'spec4-liquid',
      extension: [ctx('on-treatment')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '119297000', display: 'Blood specimen' }], text: 'cfDNA liquid biopsy — on-treatment' },
      subject: P4, collection: { collectedDateTime: '2022-06-01' },
    }},
    // Lab: CEA
    ...labObs('p4-cea', '2857-1', 'Carcinoembryonic Ag [Mass/volume] in Serum or Plasma', 'CEA', 'ng/mL', 'ng/mL',
      [{ date:'2020-11-08', value:28.4 },{ date:'2021-06-01', value:8.2 },{ date:'2022-03-01', value:5.1 },
       { date:'2023-02-15', value:18.7 },{ date:'2024-06-05', value:11.3 }],
      5.0, null, P4),
    // Lab: WBC
    ...labObs('p4-wbc', '6690-2', 'Leukocytes [#/volume] in Blood', 'WBC', '10⁹/L', '10*9/L',
      [{ date:'2020-11-08', value:9.8 },{ date:'2021-06-01', value:7.4 },{ date:'2022-03-01', value:6.8 },
       { date:'2023-02-15', value:8.1 },{ date:'2024-06-05', value:7.2 }],
      11.0, 4.0, P4),
    { fullUrl: 'urn:uuid:doc4-initial', resource: {
      resourceType: 'DocumentReference', id: 'doc4-initial', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4' }], text: 'Initial consultation' },
      subject: P4, date: '2020-11-08T14:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Initial consultation — 2020-11-08\n\nRobert Lefevre, 60 years old, non-smoker, referred for 2-month dry cough and weight loss of 4 kg. ' +
        'CT identifies 3.8 cm left lower lobe mass + mediastinal adenopathy. Bronchoscopy biopsy: lung adenocarcinoma. ' +
        'PET-CT confirms stage IIIB (no distant metastases). Molecular: EGFR exon 19 deletion, PD-L1 45%. ALK, ROS1 negative. ' +
        'MDT: 1st-line osimertinib 80 mg/day (FLAURA protocol). Baseline LVEF normal.'
      )}}],
    }},
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT 5 — Isabelle Moreau, 58F, Ovarian HGSOC BRCA2 germline
// T0 = 2019-08-20 | ~79 months to 2026-03
// ═══════════════════════════════════════════════════════════════════════════════
const P5 = { reference: 'Patient/patient-005' }
export const mockBundle5: FhirBundle = {
  resourceType: 'Bundle', type: 'searchset', total: 48,
  entry: [
    { fullUrl: 'urn:uuid:patient-005', resource: {
      resourceType: 'Patient', id: 'patient-005',
      identifier: [{ use: 'official', system: 'http://carpem.fr/patient-id', value: 'CARPEM-2019-00312' }],
      name: [{ use: 'official', family: 'Moreau', given: ['Isabelle'] }],
      gender: 'female', birthDate: '1967-11-30', deceasedBoolean: false,
    }},
    { fullUrl: 'urn:uuid:cond5-primary', resource: {
      resourceType: 'Condition', id: 'cond5-primary',
      extension: [T0_EXT], clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '363443007', display: 'Malignant neoplasm of ovary' }],
              text: 'High-grade serous ovarian carcinoma (HGSOC), BRCA2 germline, FIGO IIIC' },
      subject: P5, onsetDateTime: '2019-08-20', recordedDate: '2019-08-20',
    }},
    { fullUrl: 'urn:uuid:cond5-progression', resource: {
      resourceType: 'Condition', id: 'cond5-progression',
      clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { text: 'Peritoneal recurrence — platinum-sensitive relapse' },
      subject: P5, onsetDateTime: '2022-06-10',
    }},
    { fullUrl: 'urn:uuid:obs5-prog', resource: {
      resourceType: 'Observation', id: 'obs5-prog', status: 'final',
      code: progressionCode, subject: P5, effectiveDateTime: '2022-06-10',
      valueCodeableConcept: progressionVal,
    }},
    // Cytoreductive surgery
    { fullUrl: 'urn:uuid:proc5-crs', resource: {
      resourceType: 'Procedure', id: 'proc5-crs', status: 'completed', category: surgCat,
      code: { text: 'Cytoreductive surgery — total hysterectomy + BSO + omentectomy + peritonectomy (R0)' },
      subject: P5, performedDateTime: '2019-09-10',
    }},
    // Carbo+Paclitaxel x6
    ...doses('p5-carbotax', ['2019-10-15','2019-11-19','2019-12-17','2020-01-21','2020-02-18','2020-03-17'],
      'L01XA02', 'Carboplatin', 'Carboplatin + Paclitaxel', P5),
    // Olaparib maintenance 1st line
    ...doses('p5-olaparib1', ['2020-05-01','2020-08-01','2020-11-01','2021-02-01','2021-05-01','2021-08-01','2021-11-01','2022-02-01'],
      'L01XK01', 'Olaparib', 'Olaparib maintenance (PARP inhibitor)', P5),
    // 2nd line after relapse: Carboplatin + Doxorubicin liposomal
    ...doses('p5-carbo-2l', ['2022-07-15','2022-08-19','2022-09-16','2022-10-21','2022-11-18','2022-12-16'],
      'L01XA02', 'Carboplatin', 'Carboplatin + Pegylated liposomal doxorubicin', P5),
    // Olaparib maintenance 2nd line
    ...doses('p5-olaparib2', ['2023-02-01','2023-05-01','2023-08-01','2023-11-01','2024-02-01','2024-05-01'],
      'L01XK01', 'Olaparib', 'Olaparib maintenance 2L', P5),
    // Imaging
    { fullUrl: 'urn:uuid:img5-ct-baseline', resource: {
      resourceType: 'ImagingStudy', id: 'img5-ct-baseline', status: 'available', subject: P5,
      started: '2019-08-15T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 4, numberOfInstances: 380,
      description: 'CT TAP — bilateral ovarian masses + peritoneal carcinomatosis + ascites — FIGO IIIC',
    }},
    { fullUrl: 'urn:uuid:img5-ct-1y', resource: {
      resourceType: 'ImagingStudy', id: 'img5-ct-1y', status: 'available', subject: P5,
      started: '2020-09-20T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 296, description: 'CT TAP — complete radiological response',
    }},
    { fullUrl: 'urn:uuid:img5-ct-relapse', resource: {
      resourceType: 'ImagingStudy', id: 'img5-ct-relapse', status: 'available', subject: P5,
      started: '2022-06-05T08:30:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 4, numberOfInstances: 342, description: 'CT TAP — peritoneal nodules + CA-125 rising — platinum-sensitive relapse',
    }},
    // Specimens
    { fullUrl: 'urn:uuid:spec5-baseline', resource: {
      resourceType: 'Specimen', id: 'spec5-baseline',
      extension: [ctx('baseline')],
      type: { text: 'FFPE — oophorectomy specimen' },
      subject: P5, collection: { collectedDateTime: '2019-09-10' },
    }},
    // Lab: CA-125
    ...labObs('p5-ca125', '83050-6', 'Cancer Ag 125 [Units/volume] in Serum or Plasma', 'CA-125', 'U/mL', 'U/mL',
      [{ date:'2019-08-20', value:1840 },{ date:'2020-03-17', value:42 },{ date:'2021-02-01', value:18 },
       { date:'2022-06-10', value:320 },{ date:'2022-12-16', value:68 },{ date:'2024-05-01', value:35 }],
      35, null, P5),
    // Lab: Hb
    ...labObs('p5-hb', '718-7', 'Hemoglobin [Mass/volume] in Blood', 'Hemoglobin', 'g/dL', 'g/dL',
      [{ date:'2019-08-20', value:10.2 },{ date:'2020-03-17', value:9.6 },{ date:'2021-02-01', value:12.4 },
       { date:'2022-06-10', value:11.8 },{ date:'2022-12-16', value:9.8 },{ date:'2024-05-01', value:11.5 }],
      null, 12.0, P5),
    { fullUrl: 'urn:uuid:doc5-initial', resource: {
      resourceType: 'DocumentReference', id: 'doc5-initial', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4' }], text: 'Initial consultation' },
      subject: P5, date: '2019-08-20T14:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Initial consultation — 2019-08-20\n\nIsabelle Moreau, 51 years old, referred for abdominal distension and CA-125 of 1840 U/mL on routine investigation. ' +
        'CT confirms bilateral ovarian masses with peritoneal carcinomatosis and moderate ascites. FIGO IIIC. ' +
        'BRCA2 germline pathogenic variant (c.5946delT) confirmed by genetic testing. ' +
        'MDT: primary cytoreductive surgery aiming R0, then 6 cycles carboplatin/paclitaxel, then olaparib maintenance (OlympiA protocol). ' +
        'Genetic counselling offered to first-degree relatives.'
      )}}],
    }},
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT 6 — Alexandre Petit, 47M, Cutaneous Melanoma BRAF V600E Stage IV
// T0 = 2022-04-10 | ~47 months to 2026-03
// ═══════════════════════════════════════════════════════════════════════════════
const P6 = { reference: 'Patient/patient-006' }
export const mockBundle6: FhirBundle = {
  resourceType: 'Bundle', type: 'searchset', total: 40,
  entry: [
    { fullUrl: 'urn:uuid:patient-006', resource: {
      resourceType: 'Patient', id: 'patient-006',
      identifier: [{ use: 'official', system: 'http://carpem.fr/patient-id', value: 'CARPEM-2022-00214' }],
      name: [{ use: 'official', family: 'Petit', given: ['Alexandre'] }],
      gender: 'male', birthDate: '1978-09-05', deceasedBoolean: false,
    }},
    { fullUrl: 'urn:uuid:cond6-primary', resource: {
      resourceType: 'Condition', id: 'cond6-primary',
      extension: [T0_EXT], clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '372244006', display: 'Malignant melanoma' }],
              text: 'Stage IV cutaneous melanoma, BRAF V600E, M1c (hepatic + pulmonary metastases)' },
      subject: P6, onsetDateTime: '2022-04-10', recordedDate: '2022-04-10',
    }},
    { fullUrl: 'urn:uuid:cond6-progression', resource: {
      resourceType: 'Condition', id: 'cond6-progression',
      clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { text: 'Progression on BRAF/MEK inhibition — CNS and hepatic progression' },
      subject: P6, onsetDateTime: '2024-01-20',
    }},
    { fullUrl: 'urn:uuid:obs6-prog', resource: {
      resourceType: 'Observation', id: 'obs6-prog', status: 'final',
      code: progressionCode, subject: P6, effectiveDateTime: '2024-01-20',
      valueCodeableConcept: progressionVal,
    }},
    // Dabrafenib + Trametinib 1st line (represent as monthly)
    ...doses('p6-dab-tra', ['2022-05-01','2022-08-01','2022-11-01','2023-02-01','2023-05-01',
                            '2023-08-01','2023-11-01','2024-01-01'],
      'L01XE23', 'Dabrafenib', 'Dabrafenib + Trametinib', P6),
    // Pembrolizumab 2nd line
    ...doses('p6-pembro', ['2024-02-15','2024-05-15','2024-08-15','2024-11-15','2025-02-15'],
      'L01FF02', 'Pembrolizumab', 'Pembrolizumab 200 mg Q3W', P6),
    // Imaging
    { fullUrl: 'urn:uuid:img6-pet-baseline', resource: {
      resourceType: 'ImagingStudy', id: 'img6-pet-baseline', status: 'available', subject: P6,
      started: '2022-04-05T08:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'PT', display: 'Positron emission tomography' }],
      numberOfSeries: 2, numberOfInstances: 188,
      description: 'PET-CT — primary left thigh lesion + multiple hepatic and pulmonary metastases — M1c',
    }},
    { fullUrl: 'urn:uuid:img6-ct-6m', resource: {
      resourceType: 'ImagingStudy', id: 'img6-ct-6m', status: 'available', subject: P6,
      started: '2022-10-15T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 311, description: 'CT TAP — partial response, 62% tumour reduction',
    }},
    { fullUrl: 'urn:uuid:img6-mri-prog', resource: {
      resourceType: 'ImagingStudy', id: 'img6-mri-prog', status: 'available', subject: P6,
      started: '2024-01-15T10:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' }],
      numberOfSeries: 5, numberOfInstances: 198,
      description: 'MRI brain + CT TAP — 2 new brain metastases, hepatic progression on BRAF/MEK',
    }},
    // Specimens
    { fullUrl: 'urn:uuid:spec6-baseline', resource: {
      resourceType: 'Specimen', id: 'spec6-baseline',
      extension: [ctx('baseline')],
      type: { text: 'FFPE — excisional biopsy left thigh melanoma' },
      subject: P6, collection: { collectedDateTime: '2022-04-05' },
    }},
    { fullUrl: 'urn:uuid:spec6-prog', resource: {
      resourceType: 'Specimen', id: 'spec6-prog',
      extension: [ctx('at-progression')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '119376003' }], text: 'FFPE — liver biopsy at progression' },
      subject: P6, collection: { collectedDateTime: '2024-01-25' },
    }},
    // Lab: LDH
    ...labObs('p6-ldh', '14804-9', 'Lactate dehydrogenase [Enzymatic activity/volume] in Serum or Plasma', 'LDH', 'U/L', 'U/L',
      [{ date:'2022-04-10', value:542 },{ date:'2022-10-15', value:198 },{ date:'2023-05-01', value:172 },
       { date:'2024-01-20', value:421 },{ date:'2024-08-15', value:285 }],
      250, null, P6),
    // Lab: S100B
    ...labObs('p6-s100b', '12994-6', 'S100 proteins [Mass/volume] in Serum', 'S100B', 'µg/L', 'ug/L',
      [{ date:'2022-04-10', value:1.8 },{ date:'2022-10-15', value:0.4 },{ date:'2023-05-01', value:0.3 },
       { date:'2024-01-20', value:1.2 },{ date:'2024-08-15', value:0.7 }],
      0.2, null, P6),
    { fullUrl: 'urn:uuid:doc6-initial', resource: {
      resourceType: 'DocumentReference', id: 'doc6-initial', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4' }], text: 'Initial consultation' },
      subject: P6, date: '2022-04-10T11:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Initial consultation — 2022-04-10\n\nAlexandre Petit, 43 years old, referred for rapidly growing left thigh pigmented lesion (Breslow 8.2 mm, ulcerated, Clark V). ' +
        'PET-CT: multiple hepatic and pulmonary hypermetabolic lesions — stage IV M1c. LDH 542 U/L. ' +
        'Molecular: BRAF V600E, NRAS wild-type. PD-L1 TPS 15%. ' +
        'MDT: 1st-line dabrafenib + trametinib given rapid disease and high tumour burden. ' +
        'Pembrolizumab reserved for 2nd-line or progression. Patient enrolled in COMBI-RT trial.'
      )}}],
    }},
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT 7 — Marguerite Blanc, 72F, AML FLT3-ITD de novo
// T0 = 2023-01-15 | ~38 months to 2026-03
// ═══════════════════════════════════════════════════════════════════════════════
const P7 = { reference: 'Patient/patient-007' }
export const mockBundle7: FhirBundle = {
  resourceType: 'Bundle', type: 'searchset', total: 36,
  entry: [
    { fullUrl: 'urn:uuid:patient-007', resource: {
      resourceType: 'Patient', id: 'patient-007',
      identifier: [{ use: 'official', system: 'http://carpem.fr/patient-id', value: 'CARPEM-2023-00087' }],
      name: [{ use: 'official', family: 'Blanc', given: ['Marguerite'] }],
      gender: 'female', birthDate: '1953-04-18', deceasedBoolean: false,
    }},
    { fullUrl: 'urn:uuid:cond7-primary', resource: {
      resourceType: 'Condition', id: 'cond7-primary',
      extension: [T0_EXT], clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '91861009', display: 'Acute myeloid leukemia' }],
              text: 'De novo AML, FLT3-ITD+, NPM1 mutant, ELN intermediate risk — blasts 72%' },
      subject: P7, onsetDateTime: '2023-01-15', recordedDate: '2023-01-15',
    }},
    { fullUrl: 'urn:uuid:cond7-relapse', resource: {
      resourceType: 'Condition', id: 'cond7-relapse',
      clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { text: 'AML relapse post-consolidation — FLT3-ITD blasts 38%' },
      subject: P7, onsetDateTime: '2024-04-10',
    }},
    { fullUrl: 'urn:uuid:obs7-prog', resource: {
      resourceType: 'Observation', id: 'obs7-prog', status: 'final',
      code: progressionCode, subject: P7, effectiveDateTime: '2024-04-10',
      valueCodeableConcept: progressionVal,
    }},
    // Induction: 7+3 + Midostaurin
    ...doses('p7-cytar', ['2023-01-20','2023-01-21','2023-01-22','2023-01-23','2023-01-24','2023-01-25','2023-01-26'],
      'L01BC01', 'Cytarabine', 'Cytarabine (7+3 induction)', P7),
    ...doses('p7-dauno', ['2023-01-20','2023-01-21','2023-01-22'],
      'L01DB02', 'Daunorubicin', 'Daunorubicin (7+3 induction)', P7),
    ...doses('p7-mido', ['2023-01-20','2023-02-20','2023-03-20','2023-04-20','2023-05-20','2023-06-20'],
      'L01XE39', 'Midostaurin', 'Midostaurin (FLT3 inhibitor)', P7),
    // Consolidation: HiDAC x3
    ...doses('p7-hidac', ['2023-04-15','2023-06-01','2023-07-15'],
      'L01BC01', 'Cytarabine', 'HiDAC consolidation', P7),
    // 2nd line: Gilteritinib after relapse
    ...doses('p7-gilter', ['2024-05-01','2024-07-01','2024-09-01','2024-11-01'],
      'L01XE45', 'Gilteritinib', 'Gilteritinib (FLT3 inhibitor 2L)', P7),
    // Bone marrow transplant procedure
    { fullUrl: 'urn:uuid:proc7-bmt', resource: {
      resourceType: 'Procedure', id: 'proc7-bmt', status: 'completed', category: surgCat,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '58997002', display: 'Allogeneic bone marrow transplant' }],
              text: 'Allogeneic haematopoietic stem cell transplantation (matched unrelated donor, RIC conditioning)' },
      subject: P7, performedDateTime: '2023-09-05',
    }},
    // Imaging
    { fullUrl: 'urn:uuid:img7-bm-baseline', resource: {
      resourceType: 'ImagingStudy', id: 'img7-bm-baseline', status: 'available', subject: P7,
      started: '2023-01-16T08:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'PT', display: 'Positron emission tomography' }],
      numberOfSeries: 2, numberOfInstances: 142, description: 'PET-CT — diffuse BM hypermetabolism consistent with AML',
    }},
    { fullUrl: 'urn:uuid:img7-ct-tx', resource: {
      resourceType: 'ImagingStudy', id: 'img7-ct-tx', status: 'available', subject: P7,
      started: '2023-08-20T08:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 198, description: 'CT TAP pre-transplant — complete remission confirmed',
    }},
    // Specimens
    { fullUrl: 'urn:uuid:spec7-bm-baseline', resource: {
      resourceType: 'Specimen', id: 'spec7-bm-baseline',
      extension: [ctx('baseline')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '396997002', display: 'Bone marrow specimen' }], text: 'Bone marrow biopsy — baseline' },
      subject: P7, collection: { collectedDateTime: '2023-01-16' },
    }},
    { fullUrl: 'urn:uuid:spec7-bm-relapse', resource: {
      resourceType: 'Specimen', id: 'spec7-bm-relapse',
      extension: [ctx('at-progression')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '396997002', display: 'Bone marrow specimen' }], text: 'Bone marrow biopsy — at relapse' },
      subject: P7, collection: { collectedDateTime: '2024-04-12' },
    }},
    // Lab: WBC
    ...labObs('p7-wbc', '6690-2', 'Leukocytes [#/volume] in Blood', 'WBC', '10⁹/L', '10*9/L',
      [{ date:'2023-01-15', value:82.4 },{ date:'2023-04-15', value:1.2 },{ date:'2023-08-01', value:4.8 },
       { date:'2024-04-10', value:38.6 },{ date:'2024-09-01', value:3.2 }],
      11.0, 4.0, P7),
    // Lab: Hb
    ...labObs('p7-hb', '718-7', 'Hemoglobin [Mass/volume] in Blood', 'Hemoglobin', 'g/dL', 'g/dL',
      [{ date:'2023-01-15', value:7.8 },{ date:'2023-04-15', value:8.6 },{ date:'2023-08-01', value:10.4 },
       { date:'2024-04-10', value:8.2 },{ date:'2024-09-01', value:11.2 }],
      null, 12.0, P7),
    { fullUrl: 'urn:uuid:doc7-initial', resource: {
      resourceType: 'DocumentReference', id: 'doc7-initial', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4' }], text: 'Initial consultation' },
      subject: P7, date: '2023-01-15T16:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Initial consultation — 2023-01-15\n\nMarguerite Blanc, 69 years old, admitted for fatigue, fever and bruising for 3 weeks. ' +
        'CBC: WBC 82.4 × 10⁹/L with 72% blasts, Hb 7.8 g/dL, platelets 18 × 10⁹/L. ' +
        'Bone marrow biopsy: AML with 72% blasts. Cytogenetics: normal karyotype. ' +
        'Molecular: FLT3-ITD (allelic ratio 0.42), NPM1 exon 12 mutation, DNMT3A R882H. ELN 2022: intermediate risk. ' +
        'MDT: intensive induction (7+3 + midostaurin) given adequate performance status (ECOG 1). ' +
        'Goal: CR followed by allogeneic SCT in CR1. MUD search initiated in parallel.'
      )}}],
    }},
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT 8 — Henri Rousseau, 55M, Metastatic Castration-Resistant Prostate Cancer
// T0 = 2018-06-01 (initial diagnosis) | ~93 months to 2026-03
// ═══════════════════════════════════════════════════════════════════════════════
const P8 = { reference: 'Patient/patient-008' }
export const mockBundle8: FhirBundle = {
  resourceType: 'Bundle', type: 'searchset', total: 52,
  entry: [
    { fullUrl: 'urn:uuid:patient-008', resource: {
      resourceType: 'Patient', id: 'patient-008',
      identifier: [{ use: 'official', system: 'http://carpem.fr/patient-id', value: 'CARPEM-2018-00551' }],
      name: [{ use: 'official', family: 'Rousseau', given: ['Henri'] }],
      gender: 'male', birthDate: '1970-12-03', deceasedBoolean: false,
    }},
    { fullUrl: 'urn:uuid:cond8-primary', resource: {
      resourceType: 'Condition', id: 'cond8-primary',
      extension: [T0_EXT], clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '399068003', display: 'Malignant neoplasm of prostate' }],
              text: 'Prostate adenocarcinoma, Gleason 4+4=8, de novo metastatic (bone + lymph nodes), hormone-sensitive' },
      subject: P8, onsetDateTime: '2018-06-01', recordedDate: '2018-06-01',
    }},
    { fullUrl: 'urn:uuid:cond8-crpc', resource: {
      resourceType: 'Condition', id: 'cond8-crpc',
      clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { text: 'Castration-resistant prostate cancer (CRPC) — PSA progression on ADT' },
      subject: P8, onsetDateTime: '2021-03-01',
    }},
    { fullUrl: 'urn:uuid:obs8-prog', resource: {
      resourceType: 'Observation', id: 'obs8-prog', status: 'final',
      code: progressionCode, subject: P8, effectiveDateTime: '2021-03-01',
      valueCodeableConcept: progressionVal,
    }},
    // ADT: LHRH agonist (continuous — represent as 6-monthly injections)
    ...doses('p8-lhrh', ['2018-06-15','2018-12-15','2019-06-15','2019-12-15','2020-06-15','2020-12-15','2021-06-15'],
      'L02AE02', 'Leuprorelin', 'Leuprorelin (LHRH agonist, 6-monthly depot)', P8),
    // Abiraterone 1st line (hormone-sensitive)
    ...doses('p8-abi', ['2018-07-01','2019-01-01','2019-07-01','2020-01-01','2020-07-01','2021-01-01'],
      'L02BX03', 'Abiraterone', 'Abiraterone + Prednisone', P8),
    // Enzalutamide after CRPC
    ...doses('p8-enza', ['2021-04-01','2021-10-01','2022-04-01','2022-10-01','2023-04-01'],
      'L02BB04', 'Enzalutamide', 'Enzalutamide', P8),
    // Docetaxel chemotherapy
    ...doses('p8-docetaxel', ['2023-06-01','2023-07-01','2023-08-01','2023-09-01','2023-10-01','2023-11-01'],
      'L01CD02', 'Docetaxel', 'Docetaxel 75 mg/m²', P8),
    // Lutetium PSMA (recent)
    ...doses('p8-lu177', ['2024-03-01','2024-06-01','2024-09-01','2024-12-01'],
      'L01XX', 'Lutetium-177-PSMA', '¹⁷⁷Lu-PSMA-617 (VISION protocol)', P8),
    // Imaging
    { fullUrl: 'urn:uuid:img8-bone-scan', resource: {
      resourceType: 'ImagingStudy', id: 'img8-bone-scan', status: 'available', subject: P8,
      started: '2018-05-28T08:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'NM', display: 'Nuclear Medicine' }],
      numberOfSeries: 1, numberOfInstances: 45, description: 'Bone scan — multiple skeletal metastases (spine, pelvis, ribs)',
    }},
    { fullUrl: 'urn:uuid:img8-psma-pet', resource: {
      resourceType: 'ImagingStudy', id: 'img8-psma-pet', status: 'available', subject: P8,
      started: '2021-03-10T08:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'PT', display: 'Positron emission tomography' }],
      numberOfSeries: 2, numberOfInstances: 178,
      description: 'PSMA PET-CT — 14 osseous lesions + 3 lymph node metastases — CRPC confirmed',
    }},
    { fullUrl: 'urn:uuid:img8-ct-2024', resource: {
      resourceType: 'ImagingStudy', id: 'img8-ct-2024', status: 'available', subject: P8,
      started: '2024-09-15T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 267,
      description: 'CT TAP — partial response to ¹⁷⁷Lu-PSMA — osseous lesions decreasing',
    }},
    // Specimens
    { fullUrl: 'urn:uuid:spec8-baseline', resource: {
      resourceType: 'Specimen', id: 'spec8-baseline',
      extension: [ctx('baseline')],
      type: { text: 'FFPE — prostate biopsy (12 cores)' },
      subject: P8, collection: { collectedDateTime: '2018-05-25' },
    }},
    { fullUrl: 'urn:uuid:spec8-liquid', resource: {
      resourceType: 'Specimen', id: 'spec8-liquid',
      extension: [ctx('at-progression')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '119297000' }], text: 'cfDNA liquid biopsy — at CRPC' },
      subject: P8, collection: { collectedDateTime: '2021-03-05' },
    }},
    // Lab: PSA
    ...labObs('p8-psa', '19197-8', 'Prostate specific Ag [Mass/volume] in Serum or Plasma', 'PSA', 'ng/mL', 'ng/mL',
      [{ date:'2018-06-01', value:148 },{ date:'2019-06-15', value:2.4 },{ date:'2020-12-15', value:1.8 },
       { date:'2021-03-01', value:28.4 },{ date:'2022-04-01', value:12.6 },{ date:'2023-06-01', value:48.2 },{ date:'2024-09-15', value:18.4 }],
      4.0, null, P8),
    // Lab: Alkaline Phosphatase
    ...labObs('p8-alp', '6768-6', 'Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma', 'Alk Phos', 'U/L', 'U/L',
      [{ date:'2018-06-01', value:284 },{ date:'2019-06-15', value:124 },{ date:'2020-12-15', value:98 },
       { date:'2021-03-01', value:312 },{ date:'2023-06-01', value:428 },{ date:'2024-09-15', value:186 }],
      120, null, P8),
    // Lab: Hb
    ...labObs('p8-hb', '718-7', 'Hemoglobin [Mass/volume] in Blood', 'Hemoglobin', 'g/dL', 'g/dL',
      [{ date:'2018-06-01', value:12.8 },{ date:'2020-12-15', value:13.4 },{ date:'2021-03-01', value:11.6 },
       { date:'2023-06-01', value:10.2 },{ date:'2024-09-15', value:11.8 }],
      null, 13.0, P8),
    { fullUrl: 'urn:uuid:doc8-initial', resource: {
      resourceType: 'DocumentReference', id: 'doc8-initial', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4' }], text: 'Initial consultation' },
      subject: P8, date: '2018-06-01T14:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Initial consultation — 2018-06-01\n\nHenri Rousseau, 47 years old, referred for elevated PSA (148 ng/mL) and bone pain. ' +
        'Prostate biopsy: Gleason 4+4=8, 10/12 cores positive. Bone scan + MRI: multiple skeletal metastases. ECOG PS 1. ' +
        'De novo metastatic hormone-sensitive prostate cancer. MDT: ADT (leuprorelin) + abiraterone (STAMPEDE protocol). ' +
        'Baseline testosterone level checked. Zoledronic acid initiated for bone protection.'
      )}}],
    }},
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT 9 — Camille Fontaine, 44F, Triple-Negative Breast Cancer BRCA1
// T0 = 2023-06-01 | ~21 months to 2026-03
// ═══════════════════════════════════════════════════════════════════════════════
const P9 = { reference: 'Patient/patient-009' }
export const mockBundle9: FhirBundle = {
  resourceType: 'Bundle', type: 'searchset', total: 38,
  entry: [
    { fullUrl: 'urn:uuid:patient-009', resource: {
      resourceType: 'Patient', id: 'patient-009',
      identifier: [{ use: 'official', system: 'http://carpem.fr/patient-id', value: 'CARPEM-2023-00634' }],
      name: [{ use: 'official', family: 'Fontaine', given: ['Camille'] }],
      gender: 'female', birthDate: '1981-07-19', deceasedBoolean: false,
    }},
    { fullUrl: 'urn:uuid:cond9-primary', resource: {
      resourceType: 'Condition', id: 'cond9-primary',
      extension: [T0_EXT], clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '254837009', display: 'Malignant neoplasm of breast' }],
              text: 'Triple-negative breast cancer (TNBC), BRCA1 germline, grade III, cT2 N1 M0, Stage IIA' },
      bodySite: [{ coding: [{ system: 'http://snomed.info/sct', code: '368209003', display: 'Right breast structure' }] }],
      subject: P9, onsetDateTime: '2023-06-01', recordedDate: '2023-06-01',
    }},
    // Neoadjuvant Pembrolizumab + Paclitaxel/Carboplatin (12 weekly)
    ...doses('p9-pembro-nac', ['2023-07-01','2023-08-01','2023-09-01','2023-10-01'],
      'L01FF02', 'Pembrolizumab', 'Pembrolizumab (neoadjuvant, KEYNOTE-522)', P9),
    ...doses('p9-ptx-nac', ['2023-07-01','2023-07-08','2023-07-15','2023-07-22','2023-07-29',
                            '2023-08-05','2023-08-12','2023-08-19','2023-08-26','2023-09-02','2023-09-09','2023-09-16'],
      'L01CD01', 'Paclitaxel', 'Paclitaxel + Carboplatin (neoadjuvant weekly)', P9),
    // AC x4 (dose-dense)
    ...doses('p9-ac', ['2023-10-10','2023-10-31','2023-11-21','2023-12-12'],
      'L01DB', 'Doxorubicin', 'AC (Doxorubicin + Cyclophosphamide) neoadjuvant', P9),
    // Surgery
    { fullUrl: 'urn:uuid:proc9-mastectomy', resource: {
      resourceType: 'Procedure', id: 'proc9-mastectomy', status: 'completed', category: surgCat,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '172043006', display: 'Total mastectomy' }],
              text: 'Right mastectomy + sentinel node biopsy (pCR achieved — ypT0 ypN0)' },
      subject: P9, performedDateTime: '2024-01-15',
    }},
    // Adjuvant Pembrolizumab
    ...doses('p9-pembro-adj', ['2024-02-15','2024-05-15','2024-08-15','2024-11-15','2025-02-15'],
      'L01FF02', 'Pembrolizumab', 'Pembrolizumab (adjuvant)', P9),
    // Adjuvant Olaparib (BRCA1)
    ...doses('p9-olaparib-adj', ['2024-02-15','2024-05-15','2024-08-15','2024-11-15','2025-02-15'],
      'L01XK01', 'Olaparib', 'Olaparib (adjuvant, OlympiA)', P9),
    // Imaging
    { fullUrl: 'urn:uuid:img9-mri-baseline', resource: {
      resourceType: 'ImagingStudy', id: 'img9-mri-baseline', status: 'available', subject: P9,
      started: '2023-05-28T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' }],
      numberOfSeries: 5, numberOfInstances: 244, description: 'MRI breast — 2.8 cm right UOQ tumour + axillary node involvement',
    }},
    { fullUrl: 'urn:uuid:img9-mri-post-nac', resource: {
      resourceType: 'ImagingStudy', id: 'img9-mri-post-nac', status: 'available', subject: P9,
      started: '2023-12-20T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' }],
      numberOfSeries: 5, numberOfInstances: 238, description: 'MRI breast post-NAC — complete radiological response (pCR)',
    }},
    // Specimens
    { fullUrl: 'urn:uuid:spec9-baseline', resource: {
      resourceType: 'Specimen', id: 'spec9-baseline',
      extension: [ctx('baseline')],
      type: { text: 'FFPE — right breast core needle biopsy' },
      subject: P9, collection: { collectedDateTime: '2023-05-25' },
    }},
    { fullUrl: 'urn:uuid:spec9-blood', resource: {
      resourceType: 'Specimen', id: 'spec9-blood',
      extension: [ctx('on-treatment')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '119297000' }], text: 'Blood — BRCA1 germline testing' },
      subject: P9, collection: { collectedDateTime: '2023-06-01' },
    }},
    // Lab: WBC
    ...labObs('p9-wbc', '6690-2', 'Leukocytes [#/volume] in Blood', 'WBC', '10⁹/L', '10*9/L',
      [{ date:'2023-06-01', value:6.8 },{ date:'2023-09-16', value:2.4 },{ date:'2023-12-12', value:3.1 },
       { date:'2024-05-15', value:5.8 },{ date:'2024-11-15', value:6.2 }],
      11.0, 4.0, P9),
    // Lab: Hb
    ...labObs('p9-hb', '718-7', 'Hemoglobin [Mass/volume] in Blood', 'Hemoglobin', 'g/dL', 'g/dL',
      [{ date:'2023-06-01', value:12.8 },{ date:'2023-09-16', value:10.2 },{ date:'2023-12-12', value:9.8 },
       { date:'2024-05-15', value:12.4 },{ date:'2024-11-15', value:12.9 }],
      null, 12.0, P9),
    { fullUrl: 'urn:uuid:doc9-initial', resource: {
      resourceType: 'DocumentReference', id: 'doc9-initial', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4' }], text: 'Initial consultation' },
      subject: P9, date: '2023-06-01T10:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Initial consultation — 2023-06-01\n\nCamille Fontaine, 41 years old, referred for 2.8 cm right breast lump (self-detected). ' +
        'Core biopsy: grade III invasive ductal carcinoma, ER/PR/HER2 negative (TNBC). ' +
        'MRI: cT2 N1 — right axillary node. CT staging: no distant metastases. ' +
        'BRCA1 germline pathogenic variant confirmed (c.5266dupC, 5382insC). ' +
        'MDT: neoadjuvant pembrolizumab + paclitaxel/carboplatin (KEYNOTE-522), then AC × 4, then surgery. ' +
        'Adjuvant pembrolizumab + olaparib (OlympiA). Genetic counselling and prophylactic salpingo-oophorectomy discussed.'
      )}}],
    }},
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT 10 — Pierre Garnier, 69M, Pancreatic Ductal Adenocarcinoma
// T0 = 2024-01-15 | ~14 months to 2026-03
// ═══════════════════════════════════════════════════════════════════════════════
const P10 = { reference: 'Patient/patient-010' }
export const mockBundle10: FhirBundle = {
  resourceType: 'Bundle', type: 'searchset', total: 32,
  entry: [
    { fullUrl: 'urn:uuid:patient-010', resource: {
      resourceType: 'Patient', id: 'patient-010',
      identifier: [{ use: 'official', system: 'http://carpem.fr/patient-id', value: 'CARPEM-2024-00028' }],
      name: [{ use: 'official', family: 'Garnier', given: ['Pierre'] }],
      gender: 'male', birthDate: '1956-03-22', deceasedBoolean: false,
    }},
    { fullUrl: 'urn:uuid:cond10-primary', resource: {
      resourceType: 'Condition', id: 'cond10-primary',
      extension: [T0_EXT], clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '372003004', display: 'Malignant neoplasm of pancreas' }],
              text: 'Pancreatic ductal adenocarcinoma, head, locally advanced unresectable (T4 N1 M0)' },
      bodySite: [{ coding: [{ system: 'http://snomed.info/sct', code: '73132005', display: 'Head of pancreas structure' }] }],
      subject: P10, onsetDateTime: '2024-01-15', recordedDate: '2024-01-15',
    }},
    { fullUrl: 'urn:uuid:cond10-progression', resource: {
      resourceType: 'Condition', id: 'cond10-progression',
      clinicalStatus: clinActive, verificationStatus: verConfirm, category: catEncDx,
      code: { text: 'Hepatic metastases — progression on FOLFIRINOX' },
      subject: P10, onsetDateTime: '2025-04-10',
    }},
    { fullUrl: 'urn:uuid:obs10-staging', resource: {
      resourceType: 'Observation', id: 'obs10-staging', status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: '21908-9' }] },
      subject: P10, effectiveDateTime: '2024-01-15',
      valueCodeableConcept: { text: 'T4 N1 M0 — locally advanced, abutting superior mesenteric artery, unresectable' },
    }},
    { fullUrl: 'urn:uuid:obs10-prog', resource: {
      resourceType: 'Observation', id: 'obs10-prog', status: 'final',
      code: progressionCode, subject: P10, effectiveDateTime: '2025-04-10',
      valueCodeableConcept: progressionVal,
    }},
    // Biliary stent (ERCP)
    { fullUrl: 'urn:uuid:proc10-stent', resource: {
      resourceType: 'Procedure', id: 'proc10-stent', status: 'completed', category: surgCat,
      code: { coding: [{ system: 'http://snomed.info/sct', code: '174413005', display: 'Biliary stent insertion' }],
              text: 'ERCP + self-expanding metal biliary stent (obstructive jaundice)' },
      subject: P10, performedDateTime: '2024-01-20',
    }},
    // FOLFIRINOX (every 2 weeks x 8 cycles)
    ...doses('p10-folfiri', ['2024-02-15','2024-03-01','2024-03-15','2024-04-01',
                             '2024-04-15','2024-05-01','2024-05-15','2024-06-01'],
      'L01XX19', 'Irinotecan', 'FOLFIRINOX (Oxaliplatin + Irinotecan + Leucovorin + 5-FU)', P10),
    // Gemcitabine + nab-Paclitaxel 2nd line
    ...doses('p10-gem-nab', ['2025-05-01','2025-06-01','2025-07-01','2025-08-01'],
      'L01BC05', 'Gemcitabine', 'Gemcitabine + nab-Paclitaxel', P10),
    // Imaging
    { fullUrl: 'urn:uuid:img10-ct-baseline', resource: {
      resourceType: 'ImagingStudy', id: 'img10-ct-baseline', status: 'available', subject: P10,
      started: '2024-01-10T08:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 4, numberOfInstances: 412,
      description: 'CT TAP (arterial + portal phase) — 4 cm head mass, SMA abutment >180°, T4 — unresectable',
    }},
    { fullUrl: 'urn:uuid:img10-mrcp', resource: {
      resourceType: 'ImagingStudy', id: 'img10-mrcp', status: 'available', subject: P10,
      started: '2024-01-12T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' }],
      numberOfSeries: 4, numberOfInstances: 186,
      description: 'MRCP — main pancreatic duct dilatation + biliary obstruction',
    }},
    { fullUrl: 'urn:uuid:img10-ct-4m', resource: {
      resourceType: 'ImagingStudy', id: 'img10-ct-4m', status: 'available', subject: P10,
      started: '2024-06-10T09:00:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 358, description: 'CT TAP — stable disease on FOLFIRINOX (RECIST SD)',
    }},
    { fullUrl: 'urn:uuid:img10-ct-prog', resource: {
      resourceType: 'ImagingStudy', id: 'img10-ct-prog', status: 'available', subject: P10,
      started: '2025-04-05T08:30:00Z',
      modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' }],
      numberOfSeries: 3, numberOfInstances: 344, description: 'CT TAP — 2 new hepatic lesions — FOLFIRINOX progression',
    }},
    // Specimens
    { fullUrl: 'urn:uuid:spec10-baseline', resource: {
      resourceType: 'Specimen', id: 'spec10-baseline',
      extension: [ctx('baseline')],
      type: { text: 'FFPE — EUS-guided FNA pancreatic head' },
      subject: P10, collection: { collectedDateTime: '2024-01-11' },
    }},
    { fullUrl: 'urn:uuid:spec10-blood', resource: {
      resourceType: 'Specimen', id: 'spec10-blood',
      extension: [ctx('on-treatment')],
      type: { coding: [{ system: 'http://snomed.info/sct', code: '119297000' }], text: 'Blood serum — baseline' },
      subject: P10, collection: { collectedDateTime: '2024-01-15' },
    }},
    // Lab: CA 19-9
    ...labObs('p10-ca199', '24108-3', 'Cancer Ag 19-9 [Units/volume] in Serum or Plasma', 'CA 19-9', 'U/mL', 'U/mL',
      [{ date:'2024-01-15', value:2840 },{ date:'2024-03-15', value:1420 },{ date:'2024-06-10', value:980 },
       { date:'2025-04-05', value:4200 },{ date:'2025-07-01', value:3100 }],
      37, null, P10),
    // Lab: CEA
    ...labObs('p10-cea', '2857-1', 'Carcinoembryonic Ag [Mass/volume] in Serum or Plasma', 'CEA', 'ng/mL', 'ng/mL',
      [{ date:'2024-01-15', value:18.4 },{ date:'2024-03-15', value:12.2 },{ date:'2024-06-10', value:9.8 },
       { date:'2025-04-05', value:32.1 },{ date:'2025-07-01', value:24.6 }],
      5.0, null, P10),
    // Lab: Bilirubin
    ...labObs('p10-bili', '1975-2', 'Bilirubin.total [Mass/volume] in Serum or Plasma', 'Bilirubin', 'µmol/L', 'umol/L',
      [{ date:'2024-01-15', value:182 },{ date:'2024-01-22', value:48 },{ date:'2024-03-15', value:22 },
       { date:'2024-06-10', value:18 },{ date:'2025-04-05', value:64 }],
      17, null, P10),
    { fullUrl: 'urn:uuid:doc10-initial', resource: {
      resourceType: 'DocumentReference', id: 'doc10-initial', status: 'current',
      type: { coding: [{ system: 'http://loinc.org', code: '11488-4' }], text: 'Initial consultation' },
      subject: P10, date: '2024-01-15T15:00:00Z',
      content: [{ attachment: { contentType: 'text/plain', data: b(
        'Initial consultation — 2024-01-15\n\nPierre Garnier, 67 years old, referred for painless jaundice, weight loss (6 kg over 2 months), and steatorrhoea. ' +
        'CA 19-9: 2840 U/mL. CT identifies 4 cm head of pancreas mass with SMA abutment >180° and biliary/pancreatic duct dilatation. ' +
        'EUS-guided biopsy: pancreatic ductal adenocarcinoma, KRAS G12V, CDKN2A loss. MSS. BRCA1/2 wild-type. ' +
        'Biliary stent placed (2024-01-20) — bilirubin normalising. ' +
        'Multidisciplinary panel: locally advanced unresectable. ' +
        'MDT: palliative FOLFIRINOX (modified, given age) with restaging CT after 4 cycles. ' +
        'Palliative care team involved. Nutritional support (enteral supplementation) initiated.'
      )}}],
    }},
  ],
}

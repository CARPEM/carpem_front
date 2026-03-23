import type { Request, Response } from 'express'

export function handleMetadata(_req: Request, res: Response): void {
  res.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: '2024-01-01',
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [
      {
        mode: 'server',
        resource: [
          {
            type: 'Patient',
            interaction: [
              { code: 'read' },
              { code: 'search-type' },
            ],
            operation: [
              {
                name: 'everything',
                definition: 'http://hl7.org/fhir/OperationDefinition/Patient-everything',
              },
            ],
          },
        ],
      },
    ],
  })
}

/** Pixel width of the left label column. */
export const LABEL_WIDTH = 155

/** Pixel height of the time axis area. */
export const AXIS_HEIGHT = 50

/** Pixel height of each swim lane row. */
export const LANE_HEIGHT = 70

/** Maximum zoom: 100 px per month (most zoomed-in). */
export const ZOOM_PX_MAX = 100

/** Semantic axis ticks, always shown when in viewport. */
export const SEMANTIC_TICKS: { months: number; label: string }[] = [
  { months: 0, label: 'DX' },
  { months: 1, label: 'Mo 1' },
  { months: 12, label: 'Yr 1' },
  { months: 18, label: 'Mo 18' },
  { months: 24, label: 'Yr 2' },
  { months: 30, label: 'Mo 30' },
  { months: 36, label: 'Yr 3' },
  { months: 48, label: 'Yr 4' },
  { months: 60, label: 'Yr 5' },
  { months: 72, label: 'Yr 6' },
]

/** The six swim-lane rows, in order. Label arrays render as two lines. */
export const SWIM_LANES = [
  { id: 'key-events',       label: ['KEY EVENTS &', 'DIAGNOSIS:'] },
  { id: 'hospitalizations', label: ['HOSPITALI-', 'SATIONS:'] },
  { id: 'systemic',         label: ['SYSTEMIC', 'THERAPY:'] },
  { id: 'rt-surgery',       label: ['RADIOTHERAPY', '& SURGERY:'] },
  { id: 'imaging',          label: ['IMAGING &', 'PROCEDURES:'] },
  { id: 'biobanking',       label: ['BIOBANKING', 'SAMPLES:'] },
] as const

export type SwimLaneId = typeof SWIM_LANES[number]['id']

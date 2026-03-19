export interface MarkerInfo {
  resourceType: string
  label: string
  date: string
  temporal: string
}

export interface TooltipState {
  x: number
  y: number
  info: MarkerInfo
}

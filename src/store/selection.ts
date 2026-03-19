import { create } from 'zustand'

interface SelectionState {
  selectedSpecimenId: string | null
  setSelectedSpecimen: (id: string | null) => void
  selectedProcedureId: string | null
  setSelectedProcedure: (id: string | null) => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedSpecimenId: null,
  setSelectedSpecimen: (id) => set({ selectedSpecimenId: id }),
  selectedProcedureId: null,
  setSelectedProcedure: (id) => set({ selectedProcedureId: id }),
}))

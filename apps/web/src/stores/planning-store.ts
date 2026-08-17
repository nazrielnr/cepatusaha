/**
 * Planning Store - NO PERSISTENCE VERSION
 *
 * Each page load starts fresh. No stale state bugs.
 */

import { create } from 'zustand'
import type {
  RequirementsFormData,
  RequirementsAnswers,
  PlanningData,
} from '@/types/planning'

interface PlanningStore {
  // Data state
  requirementsData: RequirementsFormData | null
  planningData: PlanningData | null
  userAnswers: RequirementsAnswers | null
  activePlanningTab: 'prd' | 'sitemap' | 'design' | 'seo'

  // Actions
  setRequirements: (data: RequirementsFormData) => void
  setUserAnswers: (answers: RequirementsAnswers) => void
  setPlanningDocs: (data: PlanningData) => void
  setActiveTab: (tab: 'prd' | 'sitemap' | 'design' | 'seo') => void
  reset: () => void
}

const initialState = {
  requirementsData: null,
  planningData: null,
  userAnswers: null,
  activePlanningTab: 'prd' as const,
}

export const usePlanningStore = create<PlanningStore>()((set) => ({
  ...initialState,

  setRequirements: (data) => set({
    requirementsData: data,
    userAnswers: null,
  }),

  setUserAnswers: (answers) => set({
    userAnswers: answers,
  }),

  setPlanningDocs: (data) => set({
    planningData: data,
  }),

  setActiveTab: (tab) => set({
    activePlanningTab: tab
  }),

  reset: () => set(initialState),
}))

// Selector hooks
export const useRequirementsData = () => usePlanningStore((s) => s.requirementsData)
export const usePlanningData = () => usePlanningStore((s) => s.planningData)
export const useUserAnswers = () => usePlanningStore((s) => s.userAnswers)
export const useActivePlanningTab = () => usePlanningStore((s) => s.activePlanningTab)

// COMPUTED: isPlanningMode = true only when data exists
export const useIsPlanningMode = () => usePlanningStore((s) =>
  s.requirementsData !== null || s.planningData !== null
)

// COMPUTED: Get current phase
export const usePlanningPhase = () => usePlanningStore((s) => {
  if (s.planningData) return 'review'
  if (s.userAnswers) return 'waiting'
  if (s.requirementsData) return 'form'
  return 'idle'
})

// Clear old storage on module load
if (typeof window !== 'undefined') {
  sessionStorage.removeItem('planning-store')
}

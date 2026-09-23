import { create } from 'zustand'
import { toast } from 'sonner'
import { DEMO_PERSONAS } from '@/data/personas'
import { DEMO_ADMIN_STAFF, useAdminEngine } from './admin-engine'
import { useAuthEngine } from './auth-engine'
import { useVehicleStore } from '@/data/vehicle-store'
import { useEventLogger } from './event-logger'

interface PresentationState {
  isPaletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void

  // Orchestrated reset
  resetAllDemoData: (navigate?: (path: string) => void) => void

  // Persona switching actions
  switchCitizenPersona: (personaId: string, navigate: (path: string) => void) => void
  switchAdminStaff: (staffId: string, navigate: (path: string) => void) => Promise<void>
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  isPaletteOpen: false,

  openPalette: () => set({ isPaletteOpen: true }),
  closePalette: () => set({ isPaletteOpen: false }),
  togglePalette: () => set((state) => ({ isPaletteOpen: !state.isPaletteOpen })),

  resetAllDemoData: (navigate) => {
    // 1. Purge all LocalStorage persistence keys
    try {
      localStorage.removeItem('kadirs_sso_auth_v2')
      localStorage.removeItem('kadirs_sso_events_v2')
      localStorage.removeItem('kadirs_sso_consents_v2')
      localStorage.removeItem('kadirs_admin_engine_v1')
      localStorage.removeItem('kadvreg_vehicle_store')
    } catch {
      // Storage access safety
    }

    // 2. Reset in-memory Zustand stores to pristine seed data
    useAuthEngine.getState().resetDemo()
    useAdminEngine.getState().resetAdminDemo()
    useVehicleStore.getState().resetToInitial()
    useEventLogger.getState().clearEvents()

    // 3. Close palette if open
    set({ isPaletteOpen: false })

    // 4. User feedback
    toast.success('Demo State Restored', {
      description: 'All local stores, tokens, vehicles, and audit streams reset to pristine baseline.',
      duration: 4000
    })

    // 5. Clean redirect if navigate callback is provided
    if (navigate) {
      navigate('/')
    }
  },

  switchCitizenPersona: (personaId: string, navigate: (path: string) => void) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId)
    if (!persona) return

    // Ensure admin session is deactivated when switching to citizen
    if (useAdminEngine.getState().currentAdmin) {
      useAdminEngine.getState().logoutAdmin()
    }

    // Hydrate auth engine
    useAuthEngine.getState().loginAsPersona(personaId)

    // Close palette
    get().closePalette()

    // Feedback
    toast.success(`Switched to ${persona.name}`, {
      description: `${persona.role} · Starting at ${persona.startingUrl}`,
      duration: 3500
    })

    // Navigate to persona's starting URL
    navigate(persona.startingUrl)
  },

  switchAdminStaff: async (staffId: string, navigate: (path: string) => void) => {
    const officer = DEMO_ADMIN_STAFF.find((s) => s.staffId === staffId)
    if (!officer) return

    // Perform FIDO2 login ceremony
    await useAdminEngine.getState().loginAdminWithFido2(officer.staffId, 'valid_fido2_signature')

    // Close palette
    get().closePalette()

    // Feedback
    toast.success(`Authenticated as ${officer.name}`, {
      description: `${officer.role.replace('_', ' ').toUpperCase()} (${officer.department}) · AAL3 Session`,
      duration: 3500
    })

    // Target route
    const targetRoute = officer.role === 'checker_officer' ? '/admin/approvals' : '/admin/dashboard'
    navigate(targetRoute)
  }
}))

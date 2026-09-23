import { create } from 'zustand'
import type { PersonaType } from '@/types'
import { buildToken, type BuiltToken } from './token-builder'
import { useAuthEngine } from './auth-engine'
import { useAdminEngine } from './admin-engine'

export type InspectorTab = 'token' | 'events' | 'flow' | 'topology'

export interface TspMetadata {
  id: string
  name: string
  audience: string
  scopes: string[]
  clientType: string
  redirectUri: string
  keyId: string
}

export const TSP_INSPECTOR_METADATA: Record<string, TspMetadata> = {
  paykaduna: {
    id: 'paykaduna',
    name: 'PayKaduna Central Revenue Gateway',
    audience: 'paykaduna',
    scopes: ['profile:read', 'services:access', 'receipts:view'],
    clientType: 'OAuth 2.0 PKCE (Confidential Web Client)',
    redirectUri: 'https://pay.kaduna.gov.ng/auth/callback',
    keyId: 'kadirs-auth-2024-q3-key'
  },
  kadvreg: {
    id: 'kadvreg',
    name: 'KADVREG Vehicle Licensing & Fleet Platform',
    audience: 'kadvreg',
    scopes: ['profile:read', 'vehicles:manage', 'licensing:renew'],
    clientType: 'OAuth 2.0 PKCE (Headless / Deep Link Client)',
    redirectUri: 'https://kadvreg.kaduna.gov.ng/oauth/callback',
    keyId: 'kadirs-auth-2024-q3-key'
  },
  pit: {
    id: 'pit',
    name: 'Personal Income Tax e-Tax Platform',
    audience: 'pit',
    scopes: ['profile:read', 'tax:read', 'tax:file', 'tcc:generate'],
    clientType: 'OAuth 2.0 PKCE (Confidential Web Client)',
    redirectUri: 'https://pit.kadirs.gov.ng/callback',
    keyId: 'kadirs-auth-2024-q3-key'
  },
  'kadirs-admin': {
    id: 'kadirs-admin',
    name: 'KADIRS Central Administration Console',
    audience: 'kadirs-admin',
    scopes: ['admin:supervisory', 'checker:signoff', 'audit:export', 'ndpa:compliance'],
    clientType: 'FIDO2 WebAuthn AAL3 Hardware-Bound Session',
    redirectUri: 'https://admin.kadirs.gov.ng/oauth/session',
    keyId: 'kadirs-auth-2024-q3-key'
  }
}

interface InspectorState {
  isOpen: boolean
  activeTab: InspectorTab
  selectedTspId: string

  openInspector: (tab?: InspectorTab) => void
  closeInspector: () => void
  toggleInspector: () => void
  setActiveTab: (tab: InspectorTab) => void
  setSelectedTspId: (tspId: string) => void
  getActiveToken: () => BuiltToken
}

export const useInspectorStore = create<InspectorState>((set, get) => ({
  isOpen: false,
  activeTab: 'token',
  selectedTspId: 'paykaduna',

  openInspector: (tab) => {
    set({
      isOpen: true,
      activeTab: tab || get().activeTab
    })
  },

  closeInspector: () => set({ isOpen: false }),

  toggleInspector: () => set((state) => ({ isOpen: !state.isOpen })),

  setActiveTab: (activeTab) => set({ activeTab }),

  setSelectedTspId: (selectedTspId) => set({ selectedTspId }),

  getActiveToken: () => {
    const { selectedTspId } = get()
    const tsp = TSP_INSPECTOR_METADATA[selectedTspId] || TSP_INSPECTOR_METADATA.paykaduna

    // Check citizen or admin session
    const currentUser = useAuthEngine.getState().currentUser
    const activePersona = useAuthEngine.getState().activePersona
    const currentAdmin = useAdminEngine.getState().currentAdmin

    let citizenId = 'CIT-KAD-2024-00847'
    let personaType: PersonaType = 'individual'
    let assuranceLevel: '1' | '2' | '3' = '2'

    if (selectedTspId === 'kadirs-admin' && currentAdmin) {
      citizenId = `ADM-STF-${currentAdmin.staffId}`
      assuranceLevel = '3'
    } else if (currentUser) {
      citizenId = currentUser.citizenId
      personaType = activePersona || 'individual'
      assuranceLevel = '2'
    }

    return buildToken({
      citizenId,
      tspId: tsp.audience,
      scopes: tsp.scopes,
      personaType,
      assuranceLevel,
      consentRef: `CNS-KAD-${Date.now().toString(36).toUpperCase()}`
    })
  }
}))

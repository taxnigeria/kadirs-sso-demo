import { create } from 'zustand'
import type { SystemEvent, ConsentEvent } from '../types'

interface EventLoggerState {
  events: SystemEvent[]
  consentRecords: ConsentEvent[]
  logEvent: (event: Omit<SystemEvent, 'id' | 'timestamp'>) => SystemEvent
  logConsent: (consent: Omit<ConsentEvent, 'id' | 'timestamp'>) => ConsentEvent
  clearEvents: () => void
}

const STORAGE_KEY_EVENTS = 'kadirs_sso_events_v2'
const STORAGE_KEY_CONSENTS = 'kadirs_sso_consents_v2'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Ignore storage quota errors in demo
  }
}

// Initial baseline events for demonstration realism
const INITIAL_SYSTEM_EVENTS: SystemEvent[] = [
  {
    id: 'evt-init-001',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'auth',
    action: 'IAM_SERVER_BOOTSTRAP',
    actor: 'system',
    details: {
      status: 'HEALTHY',
      dataCenter: 'Rack Centre Lagos (Tier III)',
      keyRotation: '90-day RSA-256 active'
    }
  },
  {
    id: 'evt-init-002',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    category: 'admin',
    action: 'TSP_CLIENT_REGISTERED',
    actor: 'admin@kadirs.gov.ng',
    tspId: 'kadvreg',
    details: {
      clientName: 'KADVREG Vehicle Registration',
      grantTypes: ['authorization_code', 'refresh_token'],
      redirectUris: ['https://kadvreg.gov.ng/oauth/callback']
    }
  }
]

export const useEventLogger = create<EventLoggerState>((set) => ({
  events: loadFromStorage<SystemEvent[]>(STORAGE_KEY_EVENTS, INITIAL_SYSTEM_EVENTS),
  consentRecords: loadFromStorage<ConsentEvent[]>(STORAGE_KEY_CONSENTS, []),

  logEvent: (partialEvent) => {
    const newEvent: SystemEvent = {
      ...partialEvent,
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    }

    set((state) => {
      // Append-only simulation (newest first for UI presentation)
      const updated = [newEvent, ...state.events]
      saveToStorage(STORAGE_KEY_EVENTS, updated)
      return { events: updated }
    })

    return newEvent
  },

  logConsent: (partialConsent) => {
    const newConsent: ConsentEvent = {
      ...partialConsent,
      id: `CNS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      timestamp: new Date().toISOString()
    }

    set((state) => {
      const updated = [newConsent, ...state.consentRecords]
      saveToStorage(STORAGE_KEY_CONSENTS, updated)
      return { consentRecords: updated }
    })

    return newConsent
  },

  clearEvents: () => {
    saveToStorage(STORAGE_KEY_EVENTS, INITIAL_SYSTEM_EVENTS)
    saveToStorage(STORAGE_KEY_CONSENTS, [])
    set({ events: INITIAL_SYSTEM_EVENTS, consentRecords: [] })
  }
}))

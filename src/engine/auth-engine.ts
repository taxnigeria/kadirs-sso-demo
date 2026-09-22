import { create } from 'zustand'
import type {
  CitizenProfile,
  IdentityRecord,
  CorporateEntity,
  GovernmentAgency,
  PersonaType,
  TokenPayload
} from '../types'
import { DEMO_PERSONAS } from '../data/personas'
import { buildToken } from './token-builder'
import { useEventLogger } from './event-logger'
import { useVehicleStore } from '../data/vehicle-store'

interface AuthState {
  // Current authenticated state
  currentUser: CitizenProfile | null
  identity: IdentityRecord | null
  activePersona: PersonaType
  isAuthenticated: boolean
  
  // Scoped token
  currentToken: TokenPayload | null
  rawTokenString: string | null
  currentTspContext: string

  // Ecosystem state
  corporateEntities: CorporateEntity[]
  agencies: GovernmentAgency[]
  connectedTsps: string[] // List of TSPs citizen has authorized
  reconciledRecordIds: string[] // List of legacy record IDs already linked

  // Actions
  login: (identifier: string, password?: string) => { success: boolean; citizen: CitizenProfile; personaId?: string }
  loginAsPersona: (personaId: string) => void
  logout: () => void
  switchTspContext: (tspId: string) => TokenPayload
  switchPersona: (persona: PersonaType) => void
  updateProfile: (updates: Partial<CitizenProfile>) => void
  registerCitizen: (identity: IdentityRecord, profile: Omit<CitizenProfile, 'citizenId' | 'createdAt' | 'profileCompleteness'>) => CitizenProfile
  registerCorporate: (corporate: CorporateEntity, repNIN: string) => void
  registerAgency: (agency: Omit<GovernmentAgency, 'submittedAt'> | Omit<GovernmentAgency, 'status' | 'submittedAt'>) => GovernmentAgency
  approveAgency: (tin: string, adminNotes?: string) => void
  rejectAgency: (tin: string, reason: string) => void
  revokeTspConsent: (tspId: string) => void
  reconcileRecord: (recordId: string) => void
  isNINRegistered: (nin: string) => boolean
  isEmailRegistered: (email: string) => { registered: boolean; isPersonal: boolean; ownerName?: string }
  isRCRegistered: (rc: string) => { registered: boolean; companyName?: string }
  isAgencyTINRegistered: (tin: string) => { registered: boolean; agencyName?: string; status?: string }
  findRepresentativeByNIN: (nin: string) => { found: boolean; name?: string; email?: string }
  resetDemo: () => void
}

export function checkNINRegistered(nin: string, dynamicIdentity?: IdentityRecord | null): boolean {
  const clean = nin.replace(/\D/g, '')
  if (!clean) return false
  if (dynamicIdentity && dynamicIdentity.nin === clean) return true
  return DEMO_PERSONAS.some((p) => p.identity.nin === clean)
}

export function checkEmailRegistered(
  email: string,
  dynamicUser?: CitizenProfile | null
): { registered: boolean; isPersonal: boolean; ownerName?: string } {
  const clean = email.trim().toLowerCase()
  if (!clean) return { registered: false, isPersonal: false }

  if (dynamicUser && dynamicUser.email.toLowerCase() === clean) {
    return { registered: true, isPersonal: true, ownerName: dynamicUser.citizenId }
  }

  for (const p of DEMO_PERSONAS) {
    if (p.profile.email.toLowerCase() === clean) {
      return { registered: true, isPersonal: true, ownerName: p.identity.legalName }
    }
    if (p.corporate && p.profile.email.toLowerCase() === clean) {
      return { registered: true, isPersonal: false, ownerName: p.corporate.companyName }
    }
  }
  return { registered: false, isPersonal: false }
}

export function checkRCRegistered(
  rc: string,
  corporateList: CorporateEntity[] = []
): { registered: boolean; companyName?: string } {
  const clean = rc.trim().toUpperCase()
  if (!clean) return { registered: false }
  const dynamicMatch = corporateList.find((c) => c.rcNumber.toUpperCase() === clean)
  if (dynamicMatch) {
    return { registered: true, companyName: dynamicMatch.companyName }
  }
  const personaMatch = DEMO_PERSONAS.find((p) => p.corporate?.rcNumber.toUpperCase() === clean)
  if (personaMatch && personaMatch.corporate) {
    return { registered: true, companyName: personaMatch.corporate.companyName }
  }
  return { registered: false }
}

export function checkAgencyTINRegistered(
  tin: string,
  agencyList: GovernmentAgency[] = []
): { registered: boolean; agencyName?: string; status?: string } {
  const clean = tin.trim().toUpperCase()
  if (!clean) return { registered: false }
  const dynamicMatch = agencyList.find((a) => a.tin.toUpperCase() === clean)
  if (dynamicMatch) {
    return { registered: true, agencyName: dynamicMatch.agencyName, status: dynamicMatch.status }
  }
  const personaMatch = DEMO_PERSONAS.find((p) => p.agency?.tin.toUpperCase() === clean)
  if (personaMatch && personaMatch.agency) {
    return { registered: true, agencyName: personaMatch.agency.agencyName, status: personaMatch.agency.status }
  }
  return { registered: false }
}

const STORAGE_KEY_AUTH = 'kadirs_sso_auth_v2'

function getInitialState() {
  const aliyu = DEMO_PERSONAS.find((p) => p.id === 'aliyu')!
  const amara = DEMO_PERSONAS.find((p) => p.id === 'amara')!

  return {
    currentUser: null as CitizenProfile | null,
    identity: null as IdentityRecord | null,
    activePersona: 'individual' as PersonaType,
    isAuthenticated: false,
    currentToken: null as TokenPayload | null,
    rawTokenString: null as string | null,
    currentTspContext: 'paykaduna',
    corporateEntities: [amara.corporate!],
    agencies: [aliyu.agency!],
    connectedTsps: ['paykaduna', 'kadvreg'],
    reconciledRecordIds: [] as string[]
  }
}

export const useAuthEngine = create<AuthState>((set, get) => ({
  ...getInitialState(),

  login: (identifier: string) => {
    const clean = identifier.trim().toLowerCase()
    const cleanDigits = clean.replace(/[\s+-]/g, '')

    // Check pre-seeded personas
    const found = DEMO_PERSONAS.find((p) => {
      const pEmail = p.profile.email.toLowerCase()
      const pPhone = p.profile.phone.replace(/[\s+-]/g, '')
      const pNin = p.identity.nin
      const pCitizenId = p.profile.citizenId.toLowerCase()
      return (
        pEmail === clean ||
        pPhone === cleanDigits ||
        pPhone.endsWith(cleanDigits) ||
        pNin === cleanDigits ||
        pCitizenId === clean
      )
    })

    const current = get().currentUser
    const currentIdentity = get().identity
    const isDynamicMatch =
      current &&
      (current.email.toLowerCase() === clean ||
        current.phone.replace(/[\s+-]/g, '').endsWith(cleanDigits) ||
        current.citizenId.toLowerCase() === clean ||
        (currentIdentity && currentIdentity.nin === cleanDigits))

    let persona = found
    let profileToUse = persona ? persona.profile : isDynamicMatch ? current! : null
    let identityToUse = persona ? persona.identity : isDynamicMatch ? currentIdentity! : null
    let personaTypeToUse: PersonaType = persona
      ? persona.corporate ? 'corporate' : persona.agency ? 'agency' : 'individual'
      : (get().activePersona || 'individual')

    if (!profileToUse || !identityToUse) {
      persona = DEMO_PERSONAS.find((p) => p.id === 'fatima')!
      profileToUse = persona.profile
      identityToUse = persona.identity
      personaTypeToUse = 'individual'
    }

    const tokenResult = buildToken({
      citizenId: profileToUse.citizenId,
      tspId: get().currentTspContext || 'paykaduna',
      scopes: ['profile:read', 'tax:read', 'services:access'],
      personaType: personaTypeToUse
    })

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'CITIZEN_LOGIN_SUCCESS',
      actor: profileToUse.citizenId,
      tspId: get().currentTspContext,
      details: {
        method: 'email_password_2fa',
        citizenName: identityToUse.legalName,
        assuranceLevel: '2'
      }
    })

    set({
      currentUser: profileToUse,
      identity: identityToUse,
      activePersona: personaTypeToUse,
      isAuthenticated: true,
      currentToken: tokenResult.payload,
      rawTokenString: tokenResult.raw
    })

    return {
      success: true,
      citizen: profileToUse,
      personaId: persona?.id
    }
  },

  reconcileRecord: (recordId: string) => {
    set((state) => ({
      reconciledRecordIds: state.reconciledRecordIds.includes(recordId)
        ? state.reconciledRecordIds
        : [...state.reconciledRecordIds, recordId]
    }))
  },

  loginAsPersona: (personaId: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId)
    if (!persona) return

    const tokenResult = buildToken({
      citizenId: persona.profile.citizenId,
      tspId: get().currentTspContext || 'paykaduna',
      scopes: ['profile:read', 'tax:read'],
      personaType: persona.role.includes('Corporate') ? 'corporate' : persona.role.includes('Agency') ? 'agency' : 'individual'
    })

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'DEMO_PERSONA_ACTIVATED',
      actor: persona.profile.citizenId,
      details: {
        personaName: persona.name,
        journey: persona.journey
      }
    })

    set({
      currentUser: persona.profile,
      identity: persona.identity,
      activePersona: persona.corporate ? 'corporate' : persona.agency ? 'agency' : 'individual',
      isAuthenticated: true,
      currentToken: tokenResult.payload,
      rawTokenString: tokenResult.raw
    })
  },

  logout: () => {
    const user = get().currentUser
    if (user) {
      useEventLogger.getState().logEvent({
        category: 'auth',
        action: 'CITIZEN_LOGOUT',
        actor: user.citizenId,
        details: { sessionTerminated: true }
      })
    }

    set({
      currentUser: null,
      identity: null,
      isAuthenticated: false,
      currentToken: null,
      rawTokenString: null
    })
  },

  switchTspContext: (tspId: string) => {
    const user = get().currentUser
    if (!user) {
      throw new Error('Cannot issue TSP token without active user session')
    }

    // Determine TSP-scoped claims
    const scopes = tspId === 'kadvreg' 
      ? ['profile:read', 'vehicle:read', 'vehicle:write']
      : tspId === 'pit'
      ? ['profile:read', 'tax:assess', 'tax:file']
      : ['profile:read', 'payments:view']

    const tokenResult = buildToken({
      citizenId: user.citizenId,
      tspId,
      scopes,
      personaType: get().activePersona
    })

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'SSO_TOKEN_EXCHANGED',
      actor: user.citizenId,
      tspId,
      details: {
        audience: tspId,
        scopes,
        subjectClaim: user.citizenId,
        ninExcluded: true
      }
    })

    // Ensure TSP is in connected list
    const currentConnected = get().connectedTsps
    const updatedConnected = currentConnected.includes(tspId) ? currentConnected : [...currentConnected, tspId]

    set({
      currentTspContext: tspId,
      currentToken: tokenResult.payload,
      rawTokenString: tokenResult.raw,
      connectedTsps: updatedConnected
    })

    return tokenResult.payload
  },

  switchPersona: (persona: PersonaType) => {
    const user = get().currentUser
    if (!user) return

    const tokenResult = buildToken({
      citizenId: user.citizenId,
      tspId: get().currentTspContext,
      scopes: ['profile:read'],
      personaType: persona
    })

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'PERSONA_SWITCHED',
      actor: user.citizenId,
      details: {
        newPersona: persona
      }
    })

    set({
      activePersona: persona,
      currentToken: tokenResult.payload,
      rawTokenString: tokenResult.raw
    })
  },

  updateProfile: (updates: Partial<CitizenProfile>) => {
    const current = get().currentUser
    if (!current) return

    const updated: CitizenProfile = {
      ...current,
      ...updates,
      // Recalculate completeness
      profileCompleteness: Math.min(
        100,
        (current.profileCompleteness || 70) + (updates.tin ? 15 : 0) + (updates.employmentType ? 10 : 0)
      )
    }

    useEventLogger.getState().logEvent({
      category: 'profile',
      action: 'PROFILE_FIELD_UPDATED',
      actor: current.citizenId,
      details: { updatedFields: Object.keys(updates) }
    })

    set({ currentUser: updated })
  },

  registerCitizen: (identity, profileData) => {
    const citizenId = `CIT-KAD-2024-${Math.floor(10000 + Math.random() * 90000)}`
    const newProfile: CitizenProfile = {
      ...profileData,
      citizenId,
      personas: ['individual'],
      profileCompleteness: 90,
      createdAt: new Date().toISOString()
    }

    const tokenResult = buildToken({
      citizenId,
      tspId: 'paykaduna',
      scopes: ['profile:read', 'services:access'],
      personaType: 'individual'
    })

    useEventLogger.getState().logEvent({
      category: 'kyc',
      action: 'NIN_IDENTITY_ANCHORED',
      actor: citizenId,
      details: {
        legalName: identity.legalName,
        verificationProvider: identity.verificationProvider,
        layer1Locked: true
      }
    })

    set({
      currentUser: newProfile,
      identity,
      activePersona: 'individual',
      isAuthenticated: true,
      currentToken: tokenResult.payload,
      rawTokenString: tokenResult.raw,
      connectedTsps: ['paykaduna']
    })

    return newProfile
  },

  registerCorporate: (corporate, repNIN) => {
    set((state) => ({
      corporateEntities: [...state.corporateEntities, corporate]
    }))

    useEventLogger.getState().logEvent({
      category: 'kyc',
      action: 'CAC_CORPORATE_REGISTERED',
      actor: repNIN,
      details: {
        rcNumber: corporate.rcNumber,
        companyName: corporate.companyName,
        status: corporate.status
      }
    })
  },

  registerAgency: (agencyData) => {
    const newAgency: GovernmentAgency = {
      ...agencyData,
      status: ('status' in agencyData && agencyData.status) ? agencyData.status : 'pending_approval',
      submittedAt: new Date().toISOString()
    }

    set((state) => ({
      agencies: [newAgency, ...state.agencies]
    }))

    useEventLogger.getState().logEvent({
      category: 'admin',
      action: 'AGENCY_REGISTRATION_SUBMITTED',
      actor: agencyData.representativeCitizenId || 'applicant',
      details: {
        agencyName: agencyData.agencyName,
        tin: agencyData.tin,
        approvalQueue: 'Maker/Checker'
      }
    })

    return newAgency
  },

  approveAgency: (tin: string, adminNotes?: string) => {
    set((state) => ({
      agencies: state.agencies.map((a) =>
        a.tin === tin ? { ...a, status: 'approved', reviewNotes: adminNotes || 'Approved by KADIRS Admin Board' } : a
      )
    }))

    useEventLogger.getState().logEvent({
      category: 'admin',
      action: 'MAKER_CHECKER_AGENCY_APPROVED',
      actor: 'admin@kadirs.gov.ng',
      details: {
        tin,
        decision: 'APPROVED',
        dualControlVerified: true
      }
    })
  },

  rejectAgency: (tin: string, reason: string) => {
    set((state) => ({
      agencies: state.agencies.map((a) =>
        a.tin === tin ? { ...a, status: 'rejected', reviewNotes: reason } : a
      )
    }))

    useEventLogger.getState().logEvent({
      category: 'admin',
      action: 'MAKER_CHECKER_AGENCY_REJECTED',
      actor: 'admin@kadirs.gov.ng',
      details: {
        tin,
        decision: 'REJECTED',
        reason
      }
    })
  },

  revokeTspConsent: (tspId: string) => {
    const user = get().currentUser
    const actorId = user ? user.citizenId : 'citizen'

    useEventLogger.getState().logConsent({
      citizenId: actorId,
      type: 'consent_withdrawal',
      tspId,
      policyVersion: 'v2.0-2024',
      granted: false,
      ipAddress: '102.89.34.11',
      deviceInfo: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    })

    useEventLogger.getState().logEvent({
      category: 'webhook',
      action: 'TSP_CONSENT_WITHDRAWN',
      actor: actorId,
      tspId,
      details: {
        message: `NDPA mandate: TSP ${tspId} notified via HMAC-SHA256 webhook to delete local cache`,
        ttlGraceMinutes: 15
      }
    })

    set((state) => ({
      connectedTsps: state.connectedTsps.filter((id) => id !== tspId)
    }))
  },

  isNINRegistered: (nin: string) => checkNINRegistered(nin, get().identity),
  isEmailRegistered: (email: string) => checkEmailRegistered(email, get().currentUser),
  isRCRegistered: (rc: string) => checkRCRegistered(rc, get().corporateEntities),
  isAgencyTINRegistered: (tin: string) => checkAgencyTINRegistered(tin, get().agencies),
  findRepresentativeByNIN: (nin: string) => {
    const clean = nin.replace(/\D/g, '')
    if (get().identity && get().identity?.nin === clean && get().currentUser) {
      return { found: true, name: get().identity!.legalName, email: get().currentUser!.email }
    }
    const found = DEMO_PERSONAS.find((p) => p.identity.nin === clean)
    if (found) {
      return { found: true, name: found.identity.legalName, email: found.profile.email }
    }
    return { found: false }
  },

  resetDemo: () => {
    localStorage.removeItem(STORAGE_KEY_AUTH)
    useEventLogger.getState().clearEvents()
    useVehicleStore.getState().resetToInitial()
    set(getInitialState())
  }
}))

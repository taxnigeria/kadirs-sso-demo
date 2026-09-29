import { create } from 'zustand'
import type {
  CitizenProfile,
  IdentityRecord,
  CorporateEntity,
  CorporateBranch,
  EntityBinding,
  BranchAccessRequest,
  EntityRole,
  GovernmentAgency,
  PersonaType,
  TokenPayload
} from '../types'
import { DEMO_PERSONAS } from '../data/personas'
import { buildToken } from './token-builder'
import { useEventLogger } from './event-logger'
import { useVehicleStore } from '../data/vehicle-store'

export interface PendingContactChange {
  type: 'email' | 'phone'
  oldValue: string
  newValue: string
  initiatedAt: string
  expiresAt: string
}

export interface PendingDeletion {
  requestedAt: string
  coolingPeriodExpiresAt: string
  reason?: string
}

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
  branches: CorporateBranch[]
  entityBindings: EntityBinding[]
  accessRequests: BranchAccessRequest[]
  activeCorporateContext: { entityId: string; branchId: string } | null
  agencies: GovernmentAgency[]
  connectedTsps: string[] // List of TSPs citizen has authorized
  reconciledRecordIds: string[] // List of legacy record IDs already linked

  // NDPA Security & Privacy Lifecycle State
  pendingContactChange: PendingContactChange | null
  pendingDeletion: PendingDeletion | null

  // Actions
  login: (identifier: string, password?: string) => { success: boolean; citizen: CitizenProfile; personaId?: string }
  loginAsPersona: (personaId: string) => void
  logout: () => void
  switchTspContext: (tspId: string) => TokenPayload
  switchPersona: (persona: PersonaType) => void
  switchBranchContext: (entityId: string, branchId: string) => TokenPayload
  updateProfile: (updates: Partial<CitizenProfile>) => void
  registerCitizen: (identity: IdentityRecord, profile: Omit<CitizenProfile, 'citizenId' | 'createdAt' | 'profileCompleteness'>) => CitizenProfile
  registerCorporate: (corporate: CorporateEntity, repNIN: string) => void
  registerCorporateWithBranch: (params: {
    corporate: CorporateEntity
    initialBranch: Omit<CorporateBranch, 'id' | 'entityId' | 'createdAt'>
    repCitizenId: string
    repLegalName: string
    corporateEmail: string
    role?: EntityRole
    isDirectorMatch?: boolean
  }) => void
  createBranch: (entityId: string, branch: Omit<CorporateBranch, 'id' | 'entityId' | 'createdAt'>) => CorporateBranch
  requestEntityAccess: (params: {
    entityId: string
    entityName: string
    requesterCitizenId: string
    requesterName: string
    requestedRole: EntityRole
    requestedBranchId: string | null
    justification: string
    mandateDocRef?: string
  }) => BranchAccessRequest
  approveAccessRequest: (requestId: string, deciderId?: string) => void
  rejectAccessRequest: (requestId: string, reason: string, deciderId?: string) => void
  getBranchesForEntity: (entityId: string) => CorporateBranch[]
  getBindingsForCitizen: (citizenId: string) => EntityBinding[]
  registerAgency: (agency: Omit<GovernmentAgency, 'submittedAt'> | Omit<GovernmentAgency, 'status' | 'submittedAt'>) => GovernmentAgency
  approveAgency: (tin: string, adminNotes?: string) => void
  rejectAgency: (tin: string, reason: string) => void
  revokeTspConsent: (tspId: string) => void
  reconcileRecord: (recordId: string) => void
  initiateContactChange: (type: 'email' | 'phone', newValue: string) => void
  cancelContactChange: () => void
  applyContactChangeImmediately: () => void
  initiateAccountDeletion: (reason?: string) => void
  cancelAccountDeletion: () => void
  isNINRegistered: (nin: string) => boolean
  isEmailRegistered: (email: string) => { registered: boolean; isPersonal: boolean; ownerName?: string }
  isRCRegistered: (rc: string) => { registered: boolean; companyName?: string; entity?: CorporateEntity }
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
): { registered: boolean; companyName?: string; entity?: CorporateEntity } {
  const clean = rc.trim().toUpperCase()
  if (!clean) return { registered: false }
  const dynamicMatch = corporateList.find((c) => c.rcNumber.toUpperCase() === clean)
  if (dynamicMatch) {
    return { registered: true, companyName: dynamicMatch.companyName, entity: dynamicMatch }
  }
  const personaMatch = DEMO_PERSONAS.find((p) => p.corporate?.rcNumber.toUpperCase() === clean)
  if (personaMatch && personaMatch.corporate) {
    return { registered: true, companyName: personaMatch.corporate.companyName, entity: personaMatch.corporate }
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

interface PersistedAuthData {
  currentUser: CitizenProfile | null
  identity: IdentityRecord | null
  activePersona: PersonaType
  isAuthenticated: boolean
  currentToken: TokenPayload | null
  rawTokenString: string | null
  currentTspContext: string
  connectedTsps: string[]
  reconciledRecordIds: string[]
  corporateEntities?: CorporateEntity[]
  branches?: CorporateBranch[]
  entityBindings?: EntityBinding[]
  accessRequests?: BranchAccessRequest[]
}

function loadPersistedAuth(): Partial<PersistedAuthData> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function savePersistedAuth(state: Partial<AuthState>): void {
  try {
    const payload: PersistedAuthData = {
      currentUser: state.currentUser ?? null,
      identity: state.identity ?? null,
      activePersona: state.activePersona ?? 'individual',
      isAuthenticated: state.isAuthenticated ?? false,
      currentToken: state.currentToken ?? null,
      rawTokenString: state.rawTokenString ?? null,
      currentTspContext: state.currentTspContext ?? 'paykaduna',
      connectedTsps: state.connectedTsps ?? ['paykaduna', 'kadvreg'],
      reconciledRecordIds: state.reconciledRecordIds ?? [],
      corporateEntities: state.corporateEntities,
      branches: state.branches,
      entityBindings: state.entityBindings,
      accessRequests: state.accessRequests
    }
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(payload))
  } catch {
    // Ignore quota issues in demo
  }
}

function persist(): void {
  savePersistedAuth(useAuthEngine.getState())
}

function getInitialState() {
  const aliyu = DEMO_PERSONAS.find((p) => p.id === 'aliyu')!
  const amara = DEMO_PERSONAS.find((p) => p.id === 'amara')!

  const amaraBranches: CorporateBranch[] = [
    {
      id: 'br-amara-hq',
      entityId: amara.corporate!.rcNumber,
      branchCode: 'HQ',
      name: 'Head Office (Kawo)',
      address: 'Plot 7 Ali Akilu Road, Kawo, Kaduna',
      lga: 'Kaduna North',
      taxOffice: 'Kaduna North Tax Office — Kawo, Kaduna',
      contactEmail: 'tax@amaraholdings.ng',
      contactPhone: '+234 812 987 6543',
      kadirsBranchId: 'BR-KAD-1029-01',
      status: 'active',
      createdAt: '2024-07-12T08:00:00Z'
    },
    {
      id: 'br-amara-zaria',
      entityId: amara.corporate!.rcNumber,
      branchCode: 'ZAR-01',
      name: 'Zaria Distribution Hub',
      address: '14 Sokoto Road, Sabon Gari, Zaria',
      lga: 'Sabon Gari',
      taxOffice: 'Sabon Gari Tax Office — Samaru, Zaria',
      contactEmail: 'zaria.hub@amaraholdings.ng',
      contactPhone: '+234 803 555 1290',
      kadirsBranchId: 'BR-KAD-1029-02',
      status: 'active',
      createdAt: '2024-08-15T10:00:00Z'
    }
  ]

  const initialAmaraBinding: EntityBinding = {
    id: 'bind-amara-001',
    citizenId: amara.profile.citizenId,
    entityId: amara.corporate!.rcNumber,
    role: 'ENTITY_ADMIN',
    branchScope: 'ALL',
    corporateEmail: 'amara.rep@amaraholdings.ng',
    legalName: amara.identity.legalName,
    boundAt: '2024-07-12T08:00:00Z'
  }

  const amaraCorporate: CorporateEntity = {
    ...amara.corporate!,
    branches: amaraBranches,
    bindings: [initialAmaraBinding]
  }

  const persisted = loadPersistedAuth()

  return {
    currentUser: persisted?.currentUser ?? null,
    identity: persisted?.identity ?? null,
    activePersona: (persisted?.activePersona as PersonaType) ?? 'individual',
    isAuthenticated: persisted?.isAuthenticated ?? false,
    currentToken: persisted?.currentToken ?? null,
    rawTokenString: persisted?.rawTokenString ?? null,
    currentTspContext: persisted?.currentTspContext ?? 'paykaduna',
    corporateEntities: persisted?.corporateEntities ?? [amaraCorporate],
    branches: persisted?.branches ?? amaraBranches,
    entityBindings: persisted?.entityBindings ?? [initialAmaraBinding],
    accessRequests: persisted?.accessRequests ?? ([] as BranchAccessRequest[]),
    activeCorporateContext: { entityId: amara.corporate!.rcNumber, branchId: 'br-amara-hq' },
    agencies: [aliyu.agency!],
    connectedTsps: persisted?.connectedTsps ?? ['paykaduna', 'kadvreg'],
    reconciledRecordIds: persisted?.reconciledRecordIds ?? ([] as string[]),
    pendingContactChange: null as PendingContactChange | null,
    pendingDeletion: null as PendingDeletion | null
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
    persist()

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
    persist()
  },

  loginAsPersona: (personaId: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId)
    if (!persona) return

    const isCorp = Boolean(persona.corporate)
    const corpContext = isCorp
      ? { entityId: persona.corporate!.rcNumber, branchId: 'br-amara-hq' }
      : null

    const tokenResult = buildToken({
      citizenId: persona.profile.citizenId,
      tspId: get().currentTspContext || 'paykaduna',
      scopes: ['profile:read', 'tax:read'],
      personaType: persona.role.includes('Corporate') ? 'corporate' : persona.role.includes('Agency') ? 'agency' : 'individual',
      ...(corpContext ? { entityId: corpContext.entityId, branchId: corpContext.branchId } : {})
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
      rawTokenString: tokenResult.raw,
      ...(corpContext ? { activeCorporateContext: corpContext } : {})
    })
    persist()
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

    try {
      localStorage.removeItem(STORAGE_KEY_AUTH)
    } catch {
      // ignore
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

    const isCorp = get().activePersona === 'corporate'
    const corpContext = get().activeCorporateContext

    const tokenResult = buildToken({
      citizenId: user.citizenId,
      tspId,
      scopes,
      personaType: get().activePersona,
      ...(isCorp && corpContext ? { entityId: corpContext.entityId, branchId: corpContext.branchId } : {})
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
        ninExcluded: true,
        ...(isCorp && corpContext ? { entityId: corpContext.entityId, branchId: corpContext.branchId } : {})
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
    persist()

    return tokenResult.payload
  },

  switchBranchContext: (entityId: string, branchId: string) => {
    const user = get().currentUser
    if (!user) {
      throw new Error('Cannot switch branch without active user session')
    }

    const branch = get().branches.find(
      (b) => b.id === branchId || (b.entityId.toUpperCase() === entityId.toUpperCase() && b.branchCode.toUpperCase() === branchId.toUpperCase())
    )
    const resolvedBranchId = branch?.id || branchId

    set({
      activeCorporateContext: { entityId, branchId: resolvedBranchId }
    })

    const tokenResult = buildToken({
      citizenId: user.citizenId,
      tspId: get().currentTspContext || 'paykaduna',
      scopes: ['profile:read', 'payments:view', 'tax:file'],
      personaType: 'corporate',
      entityId,
      branchId: resolvedBranchId
    })

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'BRANCH_CONTEXT_SWITCHED',
      actor: user.citizenId,
      details: {
        entityId,
        branchId: resolvedBranchId,
        branchCode: branch?.branchCode || 'HQ',
        branchName: branch?.name || 'Branch'
      }
    })

    set({
      currentToken: tokenResult.payload,
      rawTokenString: tokenResult.raw
    })
    persist()

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
    persist()
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
    persist()
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
    persist()

    return newProfile
  },

  registerCorporate: (corporate, repNIN) => {
    const initialBranch: CorporateBranch = {
      id: `br-${corporate.rcNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}-hq`,
      entityId: corporate.rcNumber,
      branchCode: 'HQ',
      name: 'Head Office',
      address: 'Kaduna State',
      lga: 'Kaduna North',
      taxOffice: 'Kaduna North Tax Office — Kawo, Kaduna',
      contactEmail: `tax@${corporate.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.ng`,
      contactPhone: '+234 812 987 6543',
      status: 'active',
      createdAt: new Date().toISOString()
    }

    const binding: EntityBinding = {
      id: `bind-${Date.now().toString(36)}`,
      citizenId: `CIT-REP-${repNIN.slice(-5) || '001'}`,
      entityId: corporate.rcNumber,
      role: 'ENTITY_ADMIN',
      branchScope: 'ALL',
      corporateEmail: `tax@${corporate.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.ng`,
      legalName: 'Authorized Representative',
      boundAt: new Date().toISOString()
    }

    const corpWithBranch: CorporateEntity = {
      ...corporate,
      branches: [initialBranch],
      bindings: [binding]
    }

    set((state) => ({
      corporateEntities: [...state.corporateEntities, corpWithBranch],
      branches: [...state.branches, initialBranch],
      entityBindings: [...state.entityBindings, binding],
      activeCorporateContext: { entityId: corporate.rcNumber, branchId: initialBranch.id }
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

  registerCorporateWithBranch: (params) => {
    const {
      corporate,
      initialBranch,
      repCitizenId,
      repLegalName,
      corporateEmail,
      role = 'ENTITY_ADMIN',
      isDirectorMatch = true
    } = params

    const branchId = `br-${corporate.rcNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}-${initialBranch.branchCode.toLowerCase()}`
    const branch: CorporateBranch = {
      ...initialBranch,
      id: branchId,
      entityId: corporate.rcNumber,
      createdAt: new Date().toISOString()
    }

    const bindingId = `bind-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
    const binding: EntityBinding = {
      id: bindingId,
      citizenId: repCitizenId,
      entityId: corporate.rcNumber,
      role,
      branchScope: role === 'ENTITY_ADMIN' ? 'ALL' : [branchId],
      corporateEmail,
      legalName: repLegalName,
      boundAt: new Date().toISOString()
    }

    const entityWithBranch: CorporateEntity = {
      ...corporate,
      status: isDirectorMatch ? 'active' : 'inactive',
      branches: [branch],
      bindings: [binding]
    }

    set((state) => ({
      corporateEntities: [...state.corporateEntities, entityWithBranch],
      branches: [...state.branches, branch],
      entityBindings: [...state.entityBindings, binding],
      activeCorporateContext: { entityId: corporate.rcNumber, branchId }
    }))

    // Audit logs
    useEventLogger.getState().logEvent({
      category: 'kyc',
      action: 'CAC_CORPORATE_REGISTERED',
      actor: repCitizenId,
      details: {
        rcNumber: corporate.rcNumber,
        companyName: corporate.companyName,
        status: entityWithBranch.status,
        initialBranchCode: branch.branchCode,
        initialBranchName: branch.name,
        isDirectorMatch
      }
    })

    useEventLogger.getState().logEvent({
      category: 'admin',
      action: 'BRANCH_CREATED',
      actor: repCitizenId,
      details: {
        entityId: corporate.rcNumber,
        branchId,
        branchCode: branch.branchCode,
        branchName: branch.name,
        lga: branch.lga,
        taxOffice: branch.taxOffice
      }
    })

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'OFFICER_BOUND',
      actor: repCitizenId,
      details: {
        bindingId,
        entityId: corporate.rcNumber,
        role,
        branchScope: binding.branchScope,
        corporateEmail
      }
    })
  },

  createBranch: (entityId, branchData) => {
    const existing = get().branches.find(
      (b) => b.entityId.toUpperCase() === entityId.toUpperCase() && b.branchCode.toUpperCase() === branchData.branchCode.toUpperCase()
    )
    if (existing) {
      throw new Error(`Branch with code "${branchData.branchCode}" already exists for this entity.`)
    }

    const branchId = `br-${entityId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${branchData.branchCode.toLowerCase()}`
    const newBranch: CorporateBranch = {
      ...branchData,
      id: branchId,
      entityId,
      createdAt: new Date().toISOString()
    }

    set((state) => ({
      branches: [...state.branches, newBranch],
      corporateEntities: state.corporateEntities.map((corp) =>
        corp.rcNumber.toUpperCase() === entityId.toUpperCase()
          ? { ...corp, branches: [...(corp.branches || []), newBranch] }
          : corp
      )
    }))

    const actor = get().currentUser?.citizenId || 'system'
    useEventLogger.getState().logEvent({
      category: 'admin',
      action: 'BRANCH_CREATED',
      actor,
      details: {
        entityId,
        branchId,
        branchCode: newBranch.branchCode,
        branchName: newBranch.name,
        lga: newBranch.lga,
        taxOffice: newBranch.taxOffice
      }
    })

    return newBranch
  },

  requestEntityAccess: (params) => {
    const requestId = `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
    const request: BranchAccessRequest = {
      id: requestId,
      ...params,
      status: 'PENDING',
      submittedAt: new Date().toISOString()
    }

    set((state) => ({
      accessRequests: [request, ...state.accessRequests]
    }))

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'BRANCH_ACCESS_REQUESTED',
      actor: params.requesterCitizenId,
      details: {
        requestId,
        entityId: params.entityId,
        entityName: params.entityName,
        requestedRole: params.requestedRole,
        requestedBranchId: params.requestedBranchId,
        justification: params.justification
      }
    })

    return request
  },

  approveAccessRequest: (requestId, deciderId) => {
    const req = get().accessRequests.find((r) => r.id === requestId)
    if (!req) return

    const decider = deciderId || get().currentUser?.citizenId || 'admin'
    const bindingId = `bind-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
    const newBinding: EntityBinding = {
      id: bindingId,
      citizenId: req.requesterCitizenId,
      entityId: req.entityId,
      role: req.requestedRole,
      branchScope: req.requestedBranchId ? [req.requestedBranchId] : 'ALL',
      corporateEmail: `${req.requesterCitizenId.toLowerCase()}@entity.gov.ng`,
      legalName: req.requesterName,
      boundAt: new Date().toISOString()
    }

    set((state) => ({
      accessRequests: state.accessRequests.map((r) =>
        r.id === requestId
          ? { ...r, status: 'APPROVED', decidedBy: decider, decidedAt: new Date().toISOString() }
          : r
      ),
      entityBindings: [...state.entityBindings, newBinding]
    }))

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'BRANCH_ACCESS_APPROVED',
      actor: decider,
      details: {
        requestId,
        entityId: req.entityId,
        requesterCitizenId: req.requesterCitizenId,
        bindingId
      }
    })
  },

  rejectAccessRequest: (requestId, reason, deciderId) => {
    const decider = deciderId || get().currentUser?.citizenId || 'admin'
    set((state) => ({
      accessRequests: state.accessRequests.map((r) =>
        r.id === requestId
          ? { ...r, status: 'REJECTED', decidedBy: decider, decidedAt: new Date().toISOString() }
          : r
      )
    }))

    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'BRANCH_ACCESS_REJECTED',
      actor: decider,
      details: { requestId, reason }
    })
  },

  getBranchesForEntity: (entityId: string) => {
    return get().branches.filter((b) => b.entityId.toUpperCase() === entityId.toUpperCase())
  },

  getBindingsForCitizen: (citizenId: string) => {
    return get().entityBindings.filter((b) => b.citizenId === citizenId)
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

  initiateContactChange: (type, newValue) => {
    const user = get().currentUser
    if (!user) return
    const now = new Date()
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const oldValue = type === 'email' ? user.email : user.phone

    useEventLogger.getState().logEvent({
      category: 'security',
      action: 'CONTACT_UPDATE_HOLD_INITIATED',
      actor: user.citizenId,
      details: {
        changeType: type,
        oldValue,
        newValue,
        securityWindowHours: 24,
        coolingExpiry: expires.toISOString(),
        alertDispatchedTo: oldValue
      }
    })

    set({
      pendingContactChange: {
        type,
        oldValue,
        newValue,
        initiatedAt: now.toISOString(),
        expiresAt: expires.toISOString()
      }
    })
  },

  cancelContactChange: () => {
    const user = get().currentUser
    const pending = get().pendingContactChange
    if (pending && user) {
      useEventLogger.getState().logEvent({
        category: 'security',
        action: 'CONTACT_UPDATE_CANCELLED',
        actor: user.citizenId,
        details: {
          changeType: pending.type,
          newValueCancelled: pending.newValue
        }
      })
    }
    set({ pendingContactChange: null })
  },

  applyContactChangeImmediately: () => {
    const user = get().currentUser
    const pending = get().pendingContactChange
    if (!user || !pending) return

    const updates: Partial<CitizenProfile> = {}
    if (pending.type === 'email') updates.email = pending.newValue
    if (pending.type === 'phone') updates.phone = pending.newValue

    useEventLogger.getState().logEvent({
      category: 'security',
      action: 'CONTACT_UPDATE_APPLIED',
      actor: user.citizenId,
      details: {
        changeType: pending.type,
        appliedValue: pending.newValue
      }
    })

    get().updateProfile(updates)
    set({ pendingContactChange: null })
  },

  initiateAccountDeletion: (reason?: string) => {
    const user = get().currentUser
    if (!user) return
    const now = new Date()
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    useEventLogger.getState().logEvent({
      category: 'consent',
      action: 'NDPA_RIGHT_TO_ERASURE_REQUESTED',
      actor: user.citizenId,
      details: {
        statutorySection: 'NDPA 2023 Section 36',
        coolingPeriodDays: 30,
        coolingExpiry: expires.toISOString(),
        reason: reason || 'Citizen requested account deletion'
      }
    })

    set({
      pendingDeletion: {
        requestedAt: now.toISOString(),
        coolingPeriodExpiresAt: expires.toISOString(),
        reason
      }
    })
  },

  cancelAccountDeletion: () => {
    const user = get().currentUser
    if (user) {
      useEventLogger.getState().logEvent({
        category: 'consent',
        action: 'NDPA_ERASURE_CANCELLED_BY_USER',
        actor: user.citizenId,
        details: {
          restoredStatus: 'active',
          timestamp: new Date().toISOString()
        }
      })
    }
    set({ pendingDeletion: null })
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

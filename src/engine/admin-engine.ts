import { create } from 'zustand'
import type {
  AdminUser,
  MakerCheckerItem,
  CitizenAccountSummary,
  CorporateEntityRecord,
  AgencyEntityRecord,
  TspClientRecord,
  SystemTelemetryMetrics,
  NdpaCarExportData
} from '@/types'
import { useEventLogger } from './event-logger'

const STORAGE_KEY_ADMIN = 'kadirs_admin_engine_v1'

// Pre-seeded Admin Staff Profiles
export const DEMO_ADMIN_STAFF: AdminUser[] = [
  {
    id: 'adm-001',
    name: 'Audu Shehu',
    email: 'audu.shehu@kadirs.gov.ng',
    role: 'checker_officer',
    department: 'Revenue Assurance & Governance Directorate',
    staffId: 'KAD-STF-0192',
    fido2KeyName: 'YubiKey 5C FIDO2 #KD-FIDO-9182',
    lastLogin: '2026-09-23T07:15:00Z',
    assuranceLevel: 'AAL3'
  },
  {
    id: 'adm-002',
    name: 'Hajiya Zainab Idris',
    email: 'zainab.idris@kadirs.gov.ng',
    role: 'super_admin',
    department: 'ICT & Central Identity Operations',
    staffId: 'KAD-STF-0012',
    fido2KeyName: 'Feitian BioKey FIDO2 #KD-FIDO-4011',
    lastLogin: '2026-09-23T06:50:00Z',
    assuranceLevel: 'AAL3'
  },
  {
    id: 'adm-003',
    name: 'Barrister Bello Usman',
    email: 'bello.usman@kadirs.gov.ng',
    role: 'dispute_officer',
    department: 'Legal, Disputes & Tax Adjudication',
    staffId: 'KAD-STF-0304',
    fido2KeyName: 'YubiKey 5 NFC #KD-FIDO-7723',
    lastLogin: '2026-09-22T16:20:00Z',
    assuranceLevel: 'AAL3'
  }
]

// Pre-seeded Maker/Checker Queue across all 6 operational categories
const INITIAL_MAKER_CHECKER_ITEMS: MakerCheckerItem[] = [
  {
    id: 'mc-001',
    caseNumber: 'MC-KAD-2024-001',
    category: 'agency_reg',
    title: 'Institutional Agency Onboarding & TSP API Scopes',
    entityName: 'Kaduna State Environmental Protection Authority (KASEPA)',
    applicantName: 'Malam Ibrahim Dan-Ali (Director of Operations)',
    applicantNINMasked: '782•••••419',
    submittedAt: '2026-09-22T10:14:00Z',
    details: {
      gazetteRef: 'KDSG-VOL-48-NO-14',
      issuingMinistry: 'Ministry of Environment and Natural Resources',
      requestedScopes: ['profile:read', 'environment:audit', 'levies:collect'],
      statutoryMandate: 'Environmental Sanitation and Effluent Waste Management Law 2017',
      targetClientType: 'Confidential Web Client (OAuth 2.0 PKCE)'
    },
    status: 'pending'
  },
  {
    id: 'mc-002',
    caseNumber: 'MC-KAD-2024-002',
    category: 'rep_transfer',
    title: 'Corporate Representative Transfer & NIN Binding Reassignment',
    entityName: 'Amara Holdings Ltd (RC-1029384)',
    applicantName: 'Engr. Hadiza Mohammed (New Managing Director)',
    applicantNINMasked: '334•••••801',
    submittedAt: '2026-09-22T11:30:00Z',
    details: {
      rcNumber: 'RC-1029384',
      outgoingDirectorName: 'Dr. Aliyu Bello',
      outgoingDirectorNINMasked: '102•••••992',
      outgoingDirectorCitizenId: 'CIT-KAD-2024-00911',
      incomingDirectorCitizenId: 'CIT-KAD-2024-04182',
      boardResolutionDocRef: 'CAC-FORM-CAC7-EXT-2024.pdf',
      effectiveDate: 'Immediate upon Checker sign-off'
    },
    status: 'pending'
  },
  {
    id: 'mc-003',
    caseNumber: 'MC-KAD-2024-003',
    category: 'officer_add',
    title: 'Officer Credentialing & Tax Assessment Authority Grant',
    entityName: 'Zaria Central Tax Office (KADIRS)',
    applicantName: 'Malam Nasir Danjuma (Senior Revenue Officer)',
    applicantNINMasked: '551•••••620',
    submittedAt: '2026-09-22T14:45:00Z',
    details: {
      staffId: 'KAD-STF-0841',
      assignedOffice: 'Zaria Central Tax Office — PZ Zaria',
      assignedRole: 'Direct Assessment Assessor Level 3',
      supervisorEmail: 'zaria.head@kadirs.gov.ng',
      clearanceStatus: 'KADIRS Internal Audit Passed'
    },
    status: 'pending'
  },
  {
    id: 'mc-004',
    caseNumber: 'MC-KAD-2024-004',
    category: 'disputed_account',
    title: 'Disputed Legacy Vehicle License Match (Fatima Recognition Card)',
    entityName: 'Motor Licensing Directorate (KADVREG)',
    applicantName: 'Fatima Aminu Abdullahi',
    applicantNINMasked: '123•••••901',
    submittedAt: '2026-09-22T16:00:00Z',
    details: {
      disputedRecordId: 'REC-KAD-2024-0847',
      plateNumber: 'KJA-882-AA',
      chassisNumber: 'JT2BF22K8W091823',
      disputeReason: 'Vehicle was legally sold in 2021; buyer failed to execute change of ownership. Citizen declined reconciliation card.',
      claimantCitizenId: 'CIT-KAD-2024-00847',
      policeExtractSubmitted: true
    },
    status: 'pending'
  },
  {
    id: 'mc-005',
    caseNumber: 'MC-KAD-2024-005',
    category: 'identity_conflict',
    title: 'Dual State TIN Reconciliation Conflict (Zaria vs Kaduna South)',
    entityName: 'Personal Income Tax Portal (PIT)',
    applicantName: 'Ibrahim Sani Suleiman',
    applicantNINMasked: '654•••••321',
    submittedAt: '2026-09-22T17:10:00Z',
    details: {
      legacyTinA: '24018291-0001 (Zaria Central)',
      legacyTinB: '24098231-0001 (Kaduna South)',
      conflictTrigger: 'Identical phone carrier number linked to dual legacy TIN accounts registered under slightly variant spellings (Ibrahim Sani vs Ibrahim S. Suleiman)',
      fuzzyScore: 78
    },
    status: 'pending'
  },
  {
    id: 'mc-006',
    caseNumber: 'MC-KAD-2024-006',
    category: 'fraud_flag',
    title: 'Anomalous Concurrent Geographic Login & Rapid 2FA Failovers',
    entityName: 'Central Identity Gate (Auth 2.0)',
    applicantName: 'Flagged Account: CIT-KAD-2024-08912',
    applicantNINMasked: '992•••••114',
    submittedAt: '2026-09-22T18:22:00Z',
    details: {
      ipCluster: ['102.89.44.12 (Kaduna)', '197.210.84.99 (Lagos)'],
      timeDelta: '4 minutes between logins (Impossible Travel)',
      failedAttempts: 4,
      actionTaken: 'Automated 15-minute lock placed; requires manual supervisory review'
    },
    status: 'pending'
  }
]

// Pre-seeded Citizen Accounts (Derived from DEMO_PERSONAS)
const INITIAL_CITIZENS: CitizenAccountSummary[] = [
  {
    citizenId: 'CIT-KAD-2024-00847',
    legalName: 'Fatima Aminu Abdullahi',
    maskedNIN: '123•••••901',
    email: 'fatima.bello@example.com',
    phone: '0814 555 1212',
    taxOffice: 'Kaduna North Tax Office — Kawo, Kaduna',
    lga: 'Kaduna North LGA',
    profileCompleteness: 85,
    isSuspended: false,
    forcePasswordReset: false,
    force2faReset: false,
    lastLogin: '2026-09-22T19:30:00Z'
  },
  {
    citizenId: 'CIT-KAD-2024-01982',
    legalName: 'Musa Garba',
    maskedNIN: '554•••••210',
    email: 'musa.garba@kadvreg.gov.ng',
    phone: '0802 334 9912',
    taxOffice: 'Kaduna Central Revenue Office',
    lga: 'Kaduna South LGA',
    profileCompleteness: 100,
    isSuspended: false,
    forcePasswordReset: false,
    force2faReset: false,
    lastLogin: '2026-09-22T18:45:00Z'
  },
  {
    citizenId: 'CIT-KAD-2024-00412',
    legalName: 'Ibrahim Sani Suleiman',
    maskedNIN: '654•••••321',
    email: 'ibrahim.sani@gmail.com',
    phone: '0803 123 4567',
    taxOffice: 'Zaria Central Tax Office',
    lga: 'Zaria LGA',
    profileCompleteness: 75,
    isSuspended: false,
    forcePasswordReset: false,
    force2faReset: false,
    lastLogin: '2026-09-22T17:15:00Z'
  },
  {
    citizenId: 'CIT-KAD-2024-03119',
    legalName: 'Emeka Obi',
    maskedNIN: '987•••••101',
    email: 'emeka.obi@yahoo.com',
    phone: '0703 982 1102',
    taxOffice: 'Zaria Central Tax Office',
    lga: 'Zaria LGA',
    profileCompleteness: 100,
    isSuspended: false,
    forcePasswordReset: false,
    force2faReset: false,
    lastLogin: '2026-09-22T18:00:00Z'
  }
]

// Pre-seeded Corporate & Agency Entities
const INITIAL_CORPORATE_ENTITIES: CorporateEntityRecord[] = [
  {
    id: 'corp-001',
    rcNumber: 'RC-1029384',
    companyName: 'Amara Holdings Ltd',
    tin: '24102938-0001',
    industry: 'Logistics & Distribution',
    status: 'active',
    registeredAddress: 'Plot 7 Ali Akilu Road, Kaduna Central',
    authorizedRepName: 'Dr. Aliyu Bello',
    authorizedRepNINMasked: '102•••••992',
    authorizedRepCitizenId: 'CIT-KAD-2024-00911',
    boundSince: '2024-01-15T10:00:00Z'
  },
  {
    id: 'corp-002',
    rcNumber: 'RC-8849201',
    companyName: 'Kaduna Prime Integrated Services Ltd',
    tin: '24884920-0001',
    industry: 'Commercial Construction & Real Estate',
    status: 'active',
    registeredAddress: 'Constitution Road, Kaduna',
    authorizedRepName: 'Malam Haruna Bello',
    authorizedRepNINMasked: '881•••••304',
    authorizedRepCitizenId: 'CIT-KAD-2024-01102',
    boundSince: '2024-02-20T08:30:00Z'
  },
  {
    id: 'corp-003',
    rcNumber: 'RC-4491023',
    companyName: 'Northern Grain Millers & Agro Ventures',
    tin: '24449102-0001',
    industry: 'Agriculture & Grain Processing',
    status: 'suspended',
    registeredAddress: 'Kachia Road Industrial Area, Kaduna',
    authorizedRepName: 'Alhaji Usman Liman',
    authorizedRepNINMasked: '401•••••129',
    authorizedRepCitizenId: 'CIT-KAD-2024-02841',
    boundSince: '2024-03-01T14:15:00Z'
  }
]

const INITIAL_AGENCY_ENTITIES: AgencyEntityRecord[] = [
  {
    id: 'agency-001',
    agencyName: 'Kaduna Geographic Information Service',
    acronym: 'KADGIS',
    gazetteRef: 'KDSG-VOL-46-NO-02',
    issuingMinistry: 'Ministry of Housing and Urban Development',
    authorizedOfficerName: 'Arch. Balarabe Abbas',
    authorizedOfficerEmail: 'director.gis@kadgis.gov.ng',
    status: 'active',
    requestedScopes: ['profile:read', 'property:read', 'c-of-o:verify'],
    approvedAt: '2024-01-10T12:00:00Z'
  },
  {
    id: 'agency-002',
    agencyName: 'State Transport Authority (Commercial Manifest)',
    acronym: 'KSTA',
    gazetteRef: 'KDSG-VOL-44-NO-19',
    issuingMinistry: 'Ministry of Public Works and Infrastructure',
    authorizedOfficerName: 'Engr. Daniel Danladi',
    authorizedOfficerEmail: 'manifests@ksta.gov.ng',
    status: 'active',
    requestedScopes: ['profile:read', 'transport:manifest'],
    approvedAt: '2024-02-04T09:00:00Z'
  },
  {
    id: 'agency-003',
    agencyName: 'Kaduna State Water Corporation',
    acronym: 'KADSWAC',
    gazetteRef: 'KDSG-VOL-47-NO-08',
    issuingMinistry: 'Ministry of Water Resources',
    authorizedOfficerName: 'Hajiya Maryam Sani',
    authorizedOfficerEmail: 'billing@kadswac.gov.ng',
    status: 'active',
    requestedScopes: ['profile:read', 'utilities:water:bill'],
    approvedAt: '2024-02-18T11:20:00Z'
  }
]

// Pre-seeded TSPs for OAuth Management
const INITIAL_TSP_CLIENTS: TspClientRecord[] = [
  {
    id: 'paykaduna',
    name: 'PayKaduna Central Revenue Gateway',
    audience: 'paykaduna',
    status: 'active',
    registeredAt: '2024-01-01T00:00:00Z',
    redirectUris: ['https://pay.kaduna.gov.ng/auth/callback', 'http://localhost:5173/paykaduna'],
    activeScopes: ['profile:read', 'services:access', 'receipts:view'],
    clientSecretMasked: 'sec_live_pk_••••••••9082',
    secretLastRotatedAt: '2024-08-15T00:00:00Z'
  },
  {
    id: 'kadvreg',
    name: 'KADVREG Vehicle Licensing & Fleet Platform',
    audience: 'kadvreg',
    status: 'active',
    registeredAt: '2024-01-15T00:00:00Z',
    redirectUris: ['https://kadvreg.kaduna.gov.ng/oauth/callback', 'http://localhost:5173/kadvreg'],
    activeScopes: ['profile:read', 'vehicles:manage', 'licensing:renew'],
    clientSecretMasked: 'sec_live_kv_••••••••4410',
    secretLastRotatedAt: '2024-07-20T00:00:00Z'
  },
  {
    id: 'pit',
    name: 'Personal Income Tax e-Tax Platform',
    audience: 'pit',
    status: 'active',
    registeredAt: '2024-02-01T00:00:00Z',
    redirectUris: ['https://pit.kadirs.gov.ng/callback', 'http://localhost:5173/pit'],
    activeScopes: ['profile:read', 'tax:read', 'tax:file', 'tcc:generate'],
    clientSecretMasked: 'sec_live_pt_••••••••1129',
    secretLastRotatedAt: '2024-09-01T00:00:00Z'
  },
  {
    id: 'kadgis',
    name: 'Kaduna Geographic Information Service (KADGIS)',
    audience: 'kadgis',
    status: 'active',
    registeredAt: '2024-03-01T00:00:00Z',
    redirectUris: ['https://lands.kadgis.gov.ng/oauth/callback'],
    activeScopes: ['profile:read', 'property:read', 'c-of-o:verify'],
    clientSecretMasked: 'sec_live_kg_••••••••7812',
    secretLastRotatedAt: '2024-06-10T00:00:00Z'
  }
]

interface AdminEngineState {
  currentAdmin: AdminUser | null
  makerCheckerItems: MakerCheckerItem[]
  citizens: CitizenAccountSummary[]
  corporates: CorporateEntityRecord[]
  agencies: AgencyEntityRecord[]
  tspClients: TspClientRecord[]
  isBreakGlassActive: boolean
  breakGlassSessionReason?: string

  // Authentication & Session
  loginAdminWithFido2: (staffId: string, fido2Signature: string) => Promise<boolean>
  logoutAdmin: () => void
  activateBreakGlass: (keyInput: string, reason: string) => boolean
  deactivateBreakGlass: () => void

  // Module 1: Maker/Checker Queue
  approveItem: (id: string, notes?: string) => void
  rejectItem: (id: string, reasonCode: string, notes?: string) => void
  requestMoreInfo: (id: string, requisitionNotes: string) => void

  // Module 2: Citizen Account Management
  toggleCitizenSuspension: (citizenId: string, reason?: string) => void
  forcePasswordReset: (citizenId: string) => void
  force2faReset: (citizenId: string) => void

  // Module 3: Entity Management
  toggleCorporateStatus: (id: string) => void
  toggleAgencyStatus: (id: string) => void
  transferCorporateRep: (
    entityId: string,
    newRepName: string,
    newRepNINMasked: string,
    newRepCitizenId: string,
    justification: string
  ) => void

  // Module 4: TSP Management
  registerTspClient: (client: Omit<TspClientRecord, 'clientSecretMasked' | 'secretLastRotatedAt'>) => void
  rotateClientSecret: (tspId: string) => string
  updateTspScopes: (tspId: string, scopes: string[]) => void

  // Module 5: Telemetry
  getTelemetryMetrics: () => SystemTelemetryMetrics

  // Module 6: Reporting & NDPA CAR Export
  generateNdpaCarExport: () => NdpaCarExportData
  exportNdpaCarCsv: () => string
  generateDsrReport: () => Record<string, unknown>[]
}

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveState<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Ignore quota issues in demo
  }
}

export const useAdminEngine = create<AdminEngineState>((set, get) => {
  const persistedState = loadState<{
    currentAdmin?: AdminUser | null
    makerCheckerItems?: MakerCheckerItem[]
    citizens?: CitizenAccountSummary[]
    corporates?: CorporateEntityRecord[]
    agencies?: AgencyEntityRecord[]
    tspClients?: TspClientRecord[]
    isBreakGlassActive?: boolean
  }>(STORAGE_KEY_ADMIN, {})

  const persist = () => {
    const s = get()
    saveState(STORAGE_KEY_ADMIN, {
      currentAdmin: s.currentAdmin,
      makerCheckerItems: s.makerCheckerItems,
      citizens: s.citizens,
      corporates: s.corporates,
      agencies: s.agencies,
      tspClients: s.tspClients,
      isBreakGlassActive: s.isBreakGlassActive
    })
  }

  return {
    currentAdmin: persistedState.currentAdmin || null,
    makerCheckerItems: persistedState.makerCheckerItems || INITIAL_MAKER_CHECKER_ITEMS,
    citizens: persistedState.citizens || INITIAL_CITIZENS,
    corporates: persistedState.corporates || INITIAL_CORPORATE_ENTITIES,
    agencies: persistedState.agencies || INITIAL_AGENCY_ENTITIES,
    tspClients: persistedState.tspClients || INITIAL_TSP_CLIENTS,
    isBreakGlassActive: persistedState.isBreakGlassActive || false,

    // =========================================================================
    // ADMIN AUTHENTICATION (FIDO2 WebAuthn Hardware Key Simulation)
    // =========================================================================
    loginAdminWithFido2: async (staffId: string, fido2Signature: string) => {
      // Simulate WebAuthn CTAP2 challenge verification latency (800ms)
      await new Promise((r) => setTimeout(r, 800))

      const officer = DEMO_ADMIN_STAFF.find((s) => s.staffId === staffId)
      if (!officer) return false

      const adminUser: AdminUser = {
        ...officer,
        lastLogin: new Date().toISOString(),
        assuranceLevel: 'AAL3',
        isBreakGlass: false
      }

      set({ currentAdmin: adminUser, isBreakGlassActive: false })
      persist()

      useEventLogger.getState().logEvent({
        category: 'security',
        action: 'ADMIN_FIDO2_LOGIN_SUCCESS',
        actor: adminUser.email,
        details: {
          staffId: adminUser.staffId,
          role: adminUser.role,
          fido2Key: adminUser.fido2KeyName,
          assuranceLevel: 'AAL3_HIGH',
          signaturePreview: fido2Signature.slice(0, 16) + '...'
        }
      })

      return true
    },

    logoutAdmin: () => {
      const current = get().currentAdmin
      if (current) {
        useEventLogger.getState().logEvent({
          category: 'security',
          action: 'ADMIN_SESSION_TERMINATED',
          actor: current.email,
          details: {
            staffId: current.staffId,
            durationReason: 'User initiated sign-out'
          }
        })
      }
      set({ currentAdmin: null, isBreakGlassActive: false })
      persist()
    },

    activateBreakGlass: (keyInput: string, reason: string) => {
      if (keyInput !== 'EMERGENCY-KD-IT-HEAD-KEY') {
        useEventLogger.getState().logEvent({
          category: 'security',
          action: 'BREAK_GLASS_INVALID_KEY_ATTEMPT',
          actor: 'unknown',
          details: { keyInputAttempted: keyInput.slice(0, 6) + '***', reason }
        })
        return false
      }

      const breakGlassAdmin: AdminUser = {
        id: 'adm-break-glass',
        name: 'EMERGENCY BREAK-GLASS OFFICER',
        email: 'emergency.it.head@kadirs.gov.ng',
        role: 'super_admin',
        department: 'Physical Envelope Protocol #KD-BG-01 (KADIRS IT Unit)',
        staffId: 'KAD-EMERG-001',
        fido2KeyName: 'Master Physical Key (Sealed Vault)',
        lastLogin: new Date().toISOString(),
        assuranceLevel: 'AAL3',
        isBreakGlass: true
      }

      set({
        currentAdmin: breakGlassAdmin,
        isBreakGlassActive: true,
        breakGlassSessionReason: reason
      })
      persist()

      useEventLogger.getState().logEvent({
        category: 'security',
        action: 'BREAK_GLASS_EMERGENCY_ACCESS_ACTIVATED',
        actor: breakGlassAdmin.email,
        details: {
          protocolRef: 'Physical Envelope Protocol #KD-BG-01',
          justification: reason,
          severity: 'CRITICAL_HIGH',
          authorizedBy: 'KADIRS Executive Chairman Notification Sent'
        }
      })

      return true
    },

    deactivateBreakGlass: () => {
      set({ isBreakGlassActive: false, currentAdmin: null })
      persist()
      useEventLogger.getState().logEvent({
        category: 'security',
        action: 'BREAK_GLASS_EMERGENCY_ACCESS_CLOSED',
        actor: 'emergency.it.head@kadirs.gov.ng',
        details: { status: 'Vault re-sealed' }
      })
    },

    // =========================================================================
    // MODULE 1: MAKER/CHECKER APPROVAL QUEUE
    // =========================================================================
    approveItem: (id: string, notes = 'Approved in accordance with KADIRS statutory mandate') => {
      const admin = get().currentAdmin
      const items = get().makerCheckerItems
      const item = items.find((i) => i.id === id)
      if (!item) return

      // Self-Auditing Hard Prohibition: Officer cannot approve their own submission
      if (admin && item.applicantName.toLowerCase().includes(admin.name.toLowerCase())) {
        alert('Hard Prohibition Enforced: An officer cannot adjudicate or approve an item they submitted (Self-Auditing Rule).')
        return
      }

      const updated = items.map((i) =>
        i.id === id
          ? {
              ...i,
              status: 'approved' as const,
              decisionReason: 'Statutory Verification Complete',
              decisionNotes: notes,
              decidedBy: admin?.name || 'Authorized Checker Officer',
              decidedAt: new Date().toISOString()
            }
          : i
      )

      set({ makerCheckerItems: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: `MAKER_CHECKER_${item.category.toUpperCase()}_APPROVED`,
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: {
          caseNumber: item.caseNumber,
          category: item.category,
          entityName: item.entityName,
          decidedBy: admin?.name,
          decisionNotes: notes
        }
      })
    },

    rejectItem: (id: string, reasonCode: string, notes = 'Does not satisfy legal criteria') => {
      const admin = get().currentAdmin
      const items = get().makerCheckerItems
      const item = items.find((i) => i.id === id)
      if (!item) return

      const updated = items.map((i) =>
        i.id === id
          ? {
              ...i,
              status: 'rejected' as const,
              decisionReason: reasonCode,
              decisionNotes: notes,
              decidedBy: admin?.name || 'Authorized Checker Officer',
              decidedAt: new Date().toISOString()
            }
          : i
      )

      set({ makerCheckerItems: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: `MAKER_CHECKER_${item.category.toUpperCase()}_REJECTED`,
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: {
          caseNumber: item.caseNumber,
          category: item.category,
          entityName: item.entityName,
          reasonCode,
          decisionNotes: notes,
          decidedBy: admin?.name
        }
      })
    },

    requestMoreInfo: (id: string, requisitionNotes: string) => {
      const admin = get().currentAdmin
      const items = get().makerCheckerItems
      const updated = items.map((i) =>
        i.id === id
          ? {
              ...i,
              status: 'more_info_requested' as const,
              decisionNotes: requisitionNotes,
              decidedBy: admin?.name || 'Authorized Checker Officer',
              decidedAt: new Date().toISOString()
            }
          : i
      )

      set({ makerCheckerItems: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: 'MAKER_CHECKER_MORE_INFO_REQUISITIONED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: { itemId: id, requisitionNotes }
      })
    },

    // =========================================================================
    // MODULE 2: CITIZEN ACCOUNT MANAGEMENT
    // =========================================================================
    toggleCitizenSuspension: (citizenId: string, reason = 'Administrative compliance inquiry') => {
      const admin = get().currentAdmin
      const citizens = get().citizens
      const target = citizens.find((c) => c.citizenId === citizenId)
      if (!target) return

      const willBeSuspended = !target.isSuspended
      const updated = citizens.map((c) =>
        c.citizenId === citizenId
          ? {
              ...c,
              isSuspended: willBeSuspended,
              suspensionReason: willBeSuspended ? reason : undefined,
              suspendedAt: willBeSuspended ? new Date().toISOString() : undefined
            }
          : c
      )

      set({ citizens: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: willBeSuspended ? 'CITIZEN_ACCOUNT_SUSPENDED' : 'CITIZEN_ACCOUNT_UNSUSPENDED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: {
          targetCitizenId: citizenId,
          targetLegalName: target.legalName,
          reason: willBeSuspended ? reason : 'Reinstated by KADIRS Admin',
          blockingScope: willBeSuspended ? 'ALL_14_TSPS_SELF_SERVICE_LOCKED' : 'NORMAL'
        }
      })
    },

    forcePasswordReset: (citizenId: string) => {
      const admin = get().currentAdmin
      const citizens = get().citizens
      const updated = citizens.map((c) =>
        c.citizenId === citizenId ? { ...c, forcePasswordReset: true } : c
      )
      set({ citizens: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'security',
        action: 'CITIZEN_FORCE_PASSWORD_RESET_FLAGGED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: { targetCitizenId: citizenId }
      })
    },

    force2faReset: (citizenId: string) => {
      const admin = get().currentAdmin
      const citizens = get().citizens
      const updated = citizens.map((c) =>
        c.citizenId === citizenId ? { ...c, force2faReset: true } : c
      )
      set({ citizens: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'security',
        action: 'CITIZEN_FORCE_2FA_RESET_FLAGGED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: { targetCitizenId: citizenId }
      })
    },

    // =========================================================================
    // MODULE 3: ENTITY MANAGEMENT
    // =========================================================================
    toggleCorporateStatus: (id: string) => {
      const admin = get().currentAdmin
      const corporates = get().corporates
      const updated = corporates.map((c) => {
        if (c.id === id) {
          const next = c.status === 'active' ? 'suspended' : 'active'
          return { ...c, status: next as 'active' | 'suspended' }
        }
        return c
      })
      set({ corporates: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: 'CORPORATE_ENTITY_STATUS_TOGGLED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: { entityId: id }
      })
    },

    toggleAgencyStatus: (id: string) => {
      const admin = get().currentAdmin
      const agencies = get().agencies
      const updated = agencies.map((a) => {
        if (a.id === id) {
          const next = a.status === 'active' ? 'suspended' : 'active'
          return { ...a, status: next as 'active' | 'suspended' }
        }
        return a
      })
      set({ agencies: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: 'AGENCY_ENTITY_STATUS_TOGGLED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: { agencyId: id }
      })
    },

    transferCorporateRep: (
      entityId: string,
      newRepName: string,
      newRepNINMasked: string,
      newRepCitizenId: string,
      justification: string
    ) => {
      const admin = get().currentAdmin
      const corporates = get().corporates
      const target = corporates.find((c) => c.id === entityId)
      if (!target) return

      const oldRepName = target.authorizedRepName
      const oldRepCitizenId = target.authorizedRepCitizenId

      const updated = corporates.map((c) =>
        c.id === entityId
          ? {
              ...c,
              authorizedRepName: newRepName,
              authorizedRepNINMasked: newRepNINMasked,
              authorizedRepCitizenId: newRepCitizenId,
              boundSince: new Date().toISOString()
            }
          : c
      )
      set({ corporates: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: 'CORPORATE_REPRESENTATIVE_TRANSFERRED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        details: {
          entityId,
          rcNumber: target.rcNumber,
          oldRepresentative: { name: oldRepName, citizenId: oldRepCitizenId },
          newRepresentative: { name: newRepName, citizenId: newRepCitizenId },
          justification,
          bindingNotice: 'Old NIN binding revoked; new Citizen ID binding active.'
        }
      })
    },

    // =========================================================================
    // MODULE 4: TSP MANAGEMENT & SECRET ROTATION
    // =========================================================================
    registerTspClient: (client) => {
      const admin = get().currentAdmin
      const clients = get().tspClients
      const newSecret = `sec_live_${client.audience.slice(0, 2)}_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`
      const newRecord: TspClientRecord = {
        ...client,
        clientSecretMasked: `${newSecret.slice(0, 12)}••••••••${newSecret.slice(-4)}`,
        secretLastRotatedAt: new Date().toISOString()
      }
      const updated = [newRecord, ...clients]
      set({ tspClients: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: 'TSP_OAUTH_CLIENT_REGISTERED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        tspId: client.audience,
        details: {
          name: client.name,
          audience: client.audience,
          permittedScopes: client.activeScopes
        }
      })
    },

    rotateClientSecret: (tspId: string) => {
      const admin = get().currentAdmin
      const clients = get().tspClients
      const newSecret = `sec_live_${tspId.slice(0, 2)}_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`
      const graceExpires = new Date(Date.now() + 24 * 3600000).toISOString() // 24h grace

      const updated = clients.map((c) =>
        c.id === tspId
          ? {
              ...c,
              clientSecretMasked: `${newSecret.slice(0, 12)}••••••••${newSecret.slice(-4)}`,
              secretLastRotatedAt: new Date().toISOString(),
              previousSecretExpiresAt: graceExpires
            }
          : c
      )

      set({ tspClients: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'security',
        action: 'TSP_CLIENT_SECRET_ROTATED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        tspId,
        details: {
          dualSecretGracePeriod: '24 Hours Dual Active',
          graceExpiresAt: graceExpires,
          rotationPolicy: '90-day automatic requirement'
        }
      })

      return newSecret
    },

    updateTspScopes: (tspId: string, scopes: string[]) => {
      const admin = get().currentAdmin
      const clients = get().tspClients
      const updated = clients.map((c) => (c.id === tspId ? { ...c, activeScopes: scopes } : c))
      set({ tspClients: updated })
      persist()

      useEventLogger.getState().logEvent({
        category: 'admin',
        action: 'TSP_DATA_SCOPES_UPDATED',
        actor: admin?.email || 'admin@kadirs.gov.ng',
        tspId,
        details: { updatedScopes: scopes }
      })
    },

    // =========================================================================
    // MODULE 5: SYSTEM HEALTH & TELEMETRY
    // =========================================================================
    getTelemetryMetrics: () => {
      const allEvents = useEventLogger.getState().events
      return {
        authSuccessRate: 99.4,
        otpDeliveryRate: 98.8,
        nimcDojahLatencyMs: 1420,
        kafkaConsumerLagSeconds: 0.02,
        ndpaComplianceScore: 100,
        thirtyDayUptimePercentage: 99.98,
        totalEventsLogged24h: allEvents.length + 142
      }
    },

    // =========================================================================
    // MODULE 6: REPORTING & STATUTORY NDPA CAR EXPORT
    // =========================================================================
    generateNdpaCarExport: (): NdpaCarExportData => {
      const citizens = get().citizens
      return {
        reportId: `CAR-KAD-NDPC-2024-${Date.now().toString(36).toUpperCase()}`,
        periodYear: 2024,
        generatedAt: new Date().toISOString(),
        controllerName: 'Kaduna State Internal Revenue Service (KADIRS)',
        dpoContact: 'dpo@kadirs.gov.ng / +234 62 291 002',
        totalDataSubjects: citizens.length * 125000 + 482190,
        consentCaptureRate: 100.0,
        erasureRequestsCount: 4,
        crossBorderTransfersCount: 0,
        securityAuditStatus: 'VERIFIED_AAL3'
      }
    },

    exportNdpaCarCsv: () => {
      const data = get().generateNdpaCarExport()
      const rows = [
        ['NDPC Statutory Compliance Audit Report (CAR)', 'Year 2024'],
        ['Report Identifier', data.reportId],
        ['Data Controller', data.controllerName],
        ['Statutory DPO Contact', data.dpoContact],
        ['Estimated Registered Citizens (Data Subjects)', String(data.totalDataSubjects)],
        ['Statutory Consent Compliance Rate', `${data.consentCaptureRate}%`],
        ['Total Erasure Requests Handled (NDPA Sec 36)', String(data.erasureRequestsCount)],
        ['Cross-Border PII Transfers', String(data.crossBorderTransfersCount)],
        ['Authentication Security Baseline', data.securityAuditStatus],
        ['Timestamp of Generation', data.generatedAt]
      ]

      return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    },

    generateDsrReport: () => {
      return [
        {
          requestRef: 'DSR-KAD-2024-001',
          citizenId: 'CIT-KAD-2024-00847',
          rightType: 'NDPA Sec. 36 (Right to Erasure)',
          status: '30-Day Cooling-off Period Active',
          coolingExpires: '2024-10-22T00:00:00Z',
          disposition: 'PII nulling scheduled; receipts retained per Public Finance Law'
        },
        {
          requestRef: 'DSR-KAD-2024-002',
          citizenId: 'CIT-KAD-2024-01982',
          rightType: 'NDPA Sec. 34 (Right of Access)',
          status: 'Fulfilled',
          coolingExpires: 'N/A',
          disposition: 'Audited portable JSON export downloaded'
        }
      ]
    }
  }
})

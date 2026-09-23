// Identity & Persona Types
export type PersonaType = 'individual' | 'corporate' | 'agency' | 'informal'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed'
export type AccountStatus = 'active' | 'suspended' | 'pending_approval' | 'deleted'

// Layer 1: Immutable identity (from NIMC or CAC)
export interface IdentityRecord {
  nin: string              // Stored encrypted/masked in UI
  legalName: string
  dateOfBirth: string
  gender: 'male' | 'female'
  photoUrl: string         // Avatar URL or placeholder
  verificationProvider: 'nimc' | 'cac'
  verifiedAt: string
}

// Layer 2: Citizen profile (Unified Personal Record)
export interface CitizenProfile {
  citizenId: string        // e.g. "CIT-2024-00847" (NIN is NEVER the subject ID)
  email: string
  phone: string
  lga: string
  taxOffice: string
  address?: string
  personas: PersonaType[]
  profileCompleteness: number  // 0-100%
  createdAt: string

  // Progressive profiling fields (added as needed by TSPs like PIT)
  employmentType?: 'employed' | 'self_employed' | 'contractor' | 'unemployed'
  employerName?: string
  tin?: string
  occupation?: string
  sector?: string
  incomeBand?: string
}

// Corporate Entity (CAC-verified)
export interface CorporateEntity {
  rcNumber: string
  companyName: string
  tin: string
  status: 'active' | 'inactive' | 'dissolved'
  industry?: string
  directors: string[]
  representatives: string[]  // citizenIds of authorized human representatives
}

// Government Agency
export interface GovernmentAgency {
  tin: string
  agencyName: string
  agencyType: 'state' | 'federal' | 'lga'
  email: string            // Must be .gov.ng
  mandateDocName?: string
  status: 'pending_approval' | 'approved' | 'rejected' | 'pending_documents'
  representativeCitizenId?: string
  representativeRole?: string
  reviewNotes?: string
  submittedAt: string
}

// TSP Legacy Record (pre-migration for reconciliation)
export interface LegacyTspRecord {
  id: string
  tspId: 'paykaduna' | 'kadvreg' | 'pit'
  name: string
  email: string
  phone: string
  nin?: string             // Some records have NIN, some don't, some might conflict
  lastActivity: string
  lastActivityDate: string
  accountCreated: string
}

// NDPA Consent Event (Immutable append-only record)
export interface ConsentEvent {
  id: string
  citizenId: string
  type: 'registration' | 'tsp_data_sharing' | 'legacy_link_accept' | 'nin_conflict_resolve' | 'consent_withdrawal'
  tspId?: string
  timestamp: string
  ipAddress: string        // Simulated Nigerian IP e.g. 102.89.x.x
  deviceInfo: string       // Simulated user agent
  policyVersion: string    // e.g. "v2.0-2024"
  granted: boolean
  consentedFields?: string[]
}

// Auth Token (RS256 JWT representation)
export interface TokenPayload {
  sub: string              // citizenId — NEVER THE RAW NIN
  aud: string              // tspId e.g. 'paykaduna' | 'kadvreg' | 'pit'
  scope: string            // Consented scopes e.g. 'profile:read vehicle:write'
  persona_type: PersonaType
  acr: '1' | '2' | '3'     // Authentication Assurance Level (AAL)
  amr: string[]            // Authentication methods: ['pwd', 'sms_otp', 'totp', 'biometric']
  jti: string              // Unique token identifier for revocation
  iat: number
  exp: number
  consent_ref: string      // Reference to immutable consent event
}

// Reconciliation Match
export interface ReconciliationMatch {
  id: string
  legacyRecord: LegacyTspRecord
  matchType: 'exact_nin' | 'strong_fuzzy' | 'weak_fuzzy'
  confidence: number       // 0-100%
  status: 'pending' | 'accepted' | 'declined' | 'disputed'
  maskedEmail: string
  maskedPhone: string
  memoryTrigger: string
  conflictNote?: string
}

// System Audit / Event Stream
export interface SystemEvent {
  id: string
  timestamp: string
  category: 'auth' | 'kyc' | 'consent' | 'reconciliation' | 'profile' | 'admin' | 'webhook' | 'security'
  action: string          // e.g. 'NIN_VERIFIED', 'TOKEN_ISSUED', 'CONSENT_GRANTED'
  actor: string           // citizenId or 'admin' or 'system'
  details: Record<string, unknown>
  tspId?: string
}

// =========================================================================
// PHASE 10: ADMINISTRATIVE TYPES & ENTERPRISE GOVERNANCE
// =========================================================================

export type AdminRole =
  | 'super_admin'
  | 'checker_officer'
  | 'dispute_officer'
  | 'compliance_auditor'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  department: string
  staffId: string
  fido2KeyName: string
  lastLogin: string
  assuranceLevel: 'AAL3'
  isBreakGlass?: boolean
}

export type MakerCheckerCategory =
  | 'agency_reg'
  | 'officer_add'
  | 'rep_transfer'
  | 'disputed_account'
  | 'identity_conflict'
  | 'fraud_flag'

export type MakerCheckerStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'more_info_requested'

export interface MakerCheckerItem {
  id: string
  caseNumber: string
  category: MakerCheckerCategory
  title: string
  entityName: string
  applicantName: string
  applicantNINMasked: string // The Golden Rule: Strictly masked (123•••••901)
  submittedAt: string
  details: Record<string, unknown>
  status: MakerCheckerStatus
  decisionReason?: string
  decisionNotes?: string
  decidedBy?: string
  decidedAt?: string
}

export interface CitizenAccountSummary {
  citizenId: string
  legalName: string
  maskedNIN: string          // The Golden Rule: Strictly masked
  email: string
  phone: string
  taxOffice: string
  lga: string
  profileCompleteness: number
  isSuspended: boolean
  suspensionReason?: string
  suspendedAt?: string
  forcePasswordReset: boolean
  force2faReset: boolean
  lastLogin: string
}

export interface CorporateEntityRecord {
  id: string
  rcNumber: string
  companyName: string
  tin: string
  industry: string
  status: 'active' | 'suspended' | 'dormant'
  registeredAddress: string
  authorizedRepName: string
  authorizedRepNINMasked: string
  authorizedRepCitizenId: string
  boundSince: string
}

export interface AgencyEntityRecord {
  id: string
  agencyName: string
  acronym: string
  gazetteRef: string
  issuingMinistry: string
  authorizedOfficerName: string
  authorizedOfficerEmail: string
  status: 'active' | 'pending_gazette' | 'suspended'
  requestedScopes: string[]
  approvedAt?: string
}

export interface TspClientRecord {
  id: string
  name: string
  audience: string
  status: 'active' | 'degraded' | 'offline'
  registeredAt: string
  redirectUris: string[]
  activeScopes: string[]
  clientSecretMasked: string
  secretLastRotatedAt: string
  previousSecretExpiresAt?: string
}

export interface SystemTelemetryMetrics {
  authSuccessRate: number         // e.g. 99.4%
  otpDeliveryRate: number         // e.g. 98.8%
  nimcDojahLatencyMs: number      // e.g. 1420ms
  kafkaConsumerLagSeconds: number // e.g. 0.02s
  ndpaComplianceScore: number     // e.g. 100%
  thirtyDayUptimePercentage: number // e.g. 99.98%
  totalEventsLogged24h: number
}

export interface NdpaCarExportData {
  reportId: string
  periodYear: number
  generatedAt: string
  controllerName: string
  dpoContact: string
  totalDataSubjects: number
  consentCaptureRate: number
  erasureRequestsCount: number
  crossBorderTransfersCount: number
  securityAuditStatus: 'VERIFIED_AAL3' | 'COMPLIANT'
}

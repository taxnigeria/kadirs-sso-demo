import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Info,
  MapPin,
  Building2,
  KeyRound,
  Smartphone,
  FileText,
  Check,
  RefreshCw,
  UserCheck,
  Clock,
  Sparkles,
  Mail
} from 'lucide-react'
import { lookupCAC, verifyNINWithNIMC, type CACLookupResponse } from '@/engine/kyc-simulator'
import { useAuthEngine, checkRCRegistered, checkEmailRegistered } from '@/engine/auth-engine'
import { useEventLogger } from '@/engine/event-logger'
import { sendSimulatedOTP, verifySimulatedOTP } from '@/engine/otp-simulator'
import { KADUNA_LGAS, LGA_TAX_OFFICES } from '@/data/lga-tax-offices'
import type { CorporateEntity, CorporateBranch, EntityRole } from '@/types'

interface CorporateFlowProps {
  onBackToSelection: () => void
  onStepChange?: (step: number) => void
}

// Password strength evaluator
function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  let score = 0
  if (pass.length >= 8) score++
  if (/[A-Z]/.test(pass)) score++
  if (/[a-z]/.test(pass)) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++

  if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500' }
  if (score === 3) return { score, label: 'Fair', color: 'bg-amber-500' }
  if (score === 4) return { score, label: 'Good', color: 'bg-emerald-500' }
  return { score: 5, label: 'Strong', color: 'bg-[#1AA260]' }
}

export function CorporateFlow({ onBackToSelection, onStepChange }: CorporateFlowProps) {
  const navigate = useNavigate()
  const registerCorporateWithBranch = useAuthEngine((s) => s.registerCorporateWithBranch)
  const requestEntityAccess = useAuthEngine((s) => s.requestEntityAccess)
  const corporateEntities = useAuthEngine((s) => s.corporateEntities)
  const logConsent = useEventLogger((s) => s.logConsent)
  const logEvent = useEventLogger((s) => s.logEvent)

  // Step state: 0 = CAC Lookup, 1 = Company, 2 = Representative, 3 = Consent, 4 = Security & 2FA
  const [step, setStepState] = useState<0 | 1 | 2 | 3 | 4>(0)

  const changeStep = (next: 0 | 1 | 2 | 3 | 4) => {
    setStepState(next)
    onStepChange?.(next)
  }

  // ==========================================
  // Step 0: CAC RC Lookup & Duplicate Handling
  // ==========================================
  const [rcNumber, setRcNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [cacData, setCacData] = useState<CACLookupResponse | null>(null)
  const [rcError, setRcError] = useState<string | null>(null)
  const [duplicateRCBlocked, setDuplicateRCBlocked] = useState<{
    rc: string
    companyName?: string
    entity?: CorporateEntity
  } | null>(null)

  // Task B: Access Request Sub-flow for duplicate RC
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false)
  const [accessVnin, setAccessVnin] = useState('')
  const [isVerifyingAccessVnin, setIsVerifyingAccessVnin] = useState(false)
  const [accessRequesterName, setAccessRequesterName] = useState('')
  const [accessRequesterCitizenId, setAccessRequesterCitizenId] = useState('')
  const [accessVninVerified, setAccessVninVerified] = useState(false)
  const [accessVninError, setAccessVninError] = useState<string | null>(null)
  const [accessRequestedRole, setAccessRequestedRole] = useState<EntityRole>('BRANCH_OFFICER')
  const [accessBranchTarget, setAccessBranchTarget] = useState<string>('HQ')
  const [accessCorporateEmail, setAccessCorporateEmail] = useState('')
  const [accessJustification, setAccessJustification] = useState('')
  const [accessSubmitted, setAccessSubmitted] = useState(false)
  const [accessRequestId, setAccessRequestId] = useState<string | null>(null)

  // ==========================================
  // Step 1: Company Profile & Verified Channels
  // ==========================================
  const [selectedLga, setSelectedLga] = useState('Kaduna North')
  const [staffCount, setStaffCount] = useState('11 - 50 employees')

  // Company Email + Inline Verification
  const [corporateEmail, setCorporateEmail] = useState('')
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const [emailDuplicateError, setEmailDuplicateError] = useState<string | null>(null)
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailOtpInput, setEmailOtpInput] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null)
  const [emailCooldown, setEmailCooldown] = useState(0)

  // Company Phone + Inline Verification
  const [corporatePhone, setCorporatePhone] = useState('')
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtpInput, setPhoneOtpInput] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null)
  const [phoneCooldown, setPhoneCooldown] = useState(0)

  // Resend cooldown timer for email and phone OTPs
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (emailCooldown > 0) {
      timer = setTimeout(() => setEmailCooldown((p) => p - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [emailCooldown])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (phoneCooldown > 0) {
      timer = setTimeout(() => setPhoneCooldown((p) => p - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [phoneCooldown])

  // ==========================================
  // Step 2: Representative Signatory (vNIN & Director Match)
  // ==========================================
  const [vninInput, setVninInput] = useState('')
  const [isVerifyingVnin, setIsVerifyingVnin] = useState(false)
  const [vninVerified, setVninVerified] = useState(false)
  const [vninError, setVninError] = useState<string | null>(null)
  const [repCitizenId, setRepCitizenId] = useState('')
  const [repLegalName, setRepLegalName] = useState('')
  const [isDirectorMatch, setIsDirectorMatch] = useState<boolean | null>(null)
  const [matchedDirectorName, setMatchedDirectorName] = useState<string | null>(null)
  const [repRole, setRepRole] = useState('Managing Director')
  const mandateDocRef = 'Corporate-Board-Resolution.pdf'

  // ==========================================
  // Step 3 (Statutory Consent) & Step 4 (Security & 2FA) State
  // ==========================================
  // 3 Independent Statutory Consent Checkboxes (Step 3)
  const [consentAuthorized, setConsentAuthorized] = useState(false)
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentReview, setConsentReview] = useState(false)

  // Account Security & 2FA (Step 4, Staged: password -> two_factor)
  const [passwordStage, setPasswordStage] = useState<'password' | 'two_factor'>('password')
  const [corporatePassword, setCorporatePassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'sms'>('totp')

  // Final submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewRequiredSubmitted, setReviewRequiredSubmitted] = useState(false)

  // Assigned tax office derived from selected LGA
  const assignedCorporateTaxOffice = LGA_TAX_OFFICES[selectedLga] || 'Kaduna North Tax Office — Kawo, Kaduna'

  // ==========================================
  // HANDLERS: Step 0 (CAC Lookup & Duplicate)
  // ==========================================
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setRcError(null)
    setDuplicateRCBlocked(null)
    const clean = rcNumber.trim().toUpperCase()

    if (!clean) {
      setRcError('Please enter a valid CAC Registration Number.')
      return
    }

    // Check duplicate RC against registered entities
    const dupCheck = checkRCRegistered(clean, corporateEntities)
    if (dupCheck.registered) {
      setDuplicateRCBlocked({
        rc: clean,
        companyName: dupCheck.companyName,
        entity: dupCheck.entity
      })
      return
    }

    try {
      setIsSearching(true)
      const res = await lookupCAC(clean)

      if (res.status !== 'active') {
        setRcError(
          `CAC Status Check Failed: Entity status is "${res.status}". Only active companies in good standing with CAC may register for Kaduna State corporate revenue services.`
        )
        return
      }

      setCacData(res)

      // Initialize default contact values based on company name
      const domainName = res.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
      setCorporateEmail(`tax@${domainName}.ng`)
      setCorporatePhone('+234 812 987 6543')

      changeStep(1)
    } catch (err: unknown) {
      setRcError(err instanceof Error ? err.message : 'CAC registry query failed. Please verify the registration number.')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle Access Request submission for duplicate RC
  const handleVerifyAccessVnin = async () => {
    setAccessVninError(null)
    const clean = accessVnin.trim()
    if (!clean || clean.length < 11) {
      setAccessVninError('Please enter a valid 16-character vNIN or 11-digit NIN.')
      return
    }

    try {
      setIsVerifyingAccessVnin(true)
      const res = await verifyNINWithNIMC(clean)
      setAccessRequesterName(res.legalName)
      setAccessRequesterCitizenId(`CIT-KAD-${Math.floor(10000 + Math.random() * 90000)}`)
      setAccessVninVerified(true)
      if (!accessCorporateEmail) {
        setAccessCorporateEmail(`officer@${duplicateRCBlocked?.rc.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.ng`)
      }
    } catch (err: unknown) {
      setAccessVninError(err instanceof Error ? err.message : 'Could not verify identity.')
    } finally {
      setIsVerifyingAccessVnin(false)
    }
  }

  const handleSubmitAccessRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!duplicateRCBlocked || !accessVninVerified || !accessJustification.trim()) return

    const req = requestEntityAccess({
      entityId: duplicateRCBlocked.rc,
      entityName: duplicateRCBlocked.companyName || 'Registered Enterprise',
      requesterCitizenId: accessRequesterCitizenId,
      requesterName: accessRequesterName,
      requestedRole: accessRequestedRole,
      requestedBranchId: accessBranchTarget === 'HQ' ? null : accessBranchTarget,
      justification: accessJustification.trim(),
      mandateDocRef: 'Letter-of-Authority-Branch.pdf'
    })

    setAccessRequestId(req.id)
    setAccessSubmitted(true)
  }

  // ==========================================
  // HANDLERS: Step 1 (Company Contact & Inline OTP)
  // ==========================================
  const handleEmailChange = (val: string) => {
    setCorporateEmail(val)
    setEmailVerified(false)
    setEmailOtpSent(false)
    setEmailOtpError(null)

    if (!val.trim()) {
      setEmailDuplicateError(null)
      setEmailWarning(null)
      return
    }

    const check = checkEmailRegistered(val)
    if (check.registered) {
      if (check.isPersonal) {
        setEmailDuplicateError(null)
        setEmailWarning(
          `Advisory Notice: "${val}" is currently registered as a personal citizen account (${check.ownerName || 'Citizen'}). It is strongly recommended to use a dedicated corporate address (e.g. tax@company.ng) to cleanly isolate liabilities. Proceeding will be recorded in the KADIRS audit trail.`
        )
      } else {
        setEmailDuplicateError(
          `Hard Block: This email is already registered to another corporate entity (${check.ownerName || 'Corporate Entity'}). Duplicate corporate emails are strictly prohibited.`
        )
        setEmailWarning(null)
      }
    } else {
      setEmailDuplicateError(null)
      setEmailWarning(null)
    }
  }

  const handleSendEmailOtp = () => {
    if (!corporateEmail.trim() || emailDuplicateError) return
    setEmailOtpError(null)
    sendSimulatedOTP(corporateEmail, 'email')
    setEmailOtpSent(true)
    setEmailCooldown(30)
  }

  const handleVerifyEmailOtp = () => {
    if (emailOtpInput.trim().length < 6) {
      setEmailOtpError('Please enter the 6-digit code sent to your corporate email.')
      return
    }
    const res = verifySimulatedOTP(emailOtpInput)
    if (res.valid) {
      setEmailVerified(true)
      setEmailOtpError(null)
    } else {
      setEmailOtpError(res.message)
    }
  }

  const handleSendPhoneOtp = () => {
    if (!corporatePhone.trim()) return
    setPhoneOtpError(null)
    sendSimulatedOTP(corporatePhone, 'termii_sms_dnd')
    setPhoneOtpSent(true)
    setPhoneCooldown(30)
  }

  const handleVerifyPhoneOtp = () => {
    if (phoneOtpInput.trim().length < 6) {
      setPhoneOtpError('Please enter the 6-digit SMS verification code.')
      return
    }
    const res = verifySimulatedOTP(phoneOtpInput)
    if (res.valid) {
      setPhoneVerified(true)
      setPhoneOtpError(null)
    } else {
      setPhoneOtpError(res.message)
    }
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailVerified || !phoneVerified || emailDuplicateError) return

    if (emailWarning) {
      logEvent({
        category: 'auth',
        action: 'CORPORATE_PERSONAL_EMAIL_OVERLAP_ACCEPTED',
        actor: corporateEmail,
        details: { email: corporateEmail, companyName: cacData?.companyName }
      })
    }

    changeStep(2)
  }

  // ==========================================
  // HANDLERS: Step 2 (Representative Signatory & Director Match)
  // ==========================================
  const handleVerifyRepresentativeVnin = async (e: React.FormEvent) => {
    e.preventDefault()
    setVninError(null)
    const clean = vninInput.trim()

    // Validate 16-char vNIN or standard demo test input
    if (clean.length !== 16 && clean.length !== 11) {
      setVninError('Virtual NIN must be 16 characters (or 11 digits for demo verification).')
      return
    }

    try {
      setIsVerifyingVnin(true)
      const res = await verifyNINWithNIMC(clean)

      setRepLegalName(res.legalName)
      const citId = `CIT-KAD-${Math.floor(10000 + Math.random() * 90000)}`
      setRepCitizenId(citId)
      setVninVerified(true)

      // Compare verified legal name against CAC director registry
      if (cacData && cacData.directors.length > 0) {
        const normalizedRep = res.legalName.toLowerCase().replace(/[^a-z]/g, '')
        const match = cacData.directors.find((dir) => {
          const normalizedDir = dir.toLowerCase().replace(/[^a-z]/g, '')
          return normalizedDir.includes(normalizedRep) || normalizedRep.includes(normalizedDir)
        })

        if (match) {
          setIsDirectorMatch(true)
          setMatchedDirectorName(match)
          setRepRole('Managing Director')
        } else {
          setIsDirectorMatch(false)
          setMatchedDirectorName(null)
          setRepRole('Tax Consultant / Manager')
        }
      }
    } catch (err: unknown) {
      setVninError(err instanceof Error ? err.message : 'NIMC identity verification failed.')
    } finally {
      setIsVerifyingVnin(false)
    }
  }

  // ==========================================
  // HANDLERS: Step 3 (Secure & Confirm)
  // ==========================================
  const passLength = corporatePassword.length >= 8
  const passUpper = /[A-Z]/.test(corporatePassword)
  const passLower = /[a-z]/.test(corporatePassword)
  const passNumber = /[0-9]/.test(corporatePassword)
  const passSpecial = /[^A-Za-z0-9]/.test(corporatePassword)
  const passNotNin =
    !vninInput || (!corporatePassword.includes(vninInput.replace(/\D/g, '')) && corporatePassword !== vninInput)

  const isPasswordValid = passLength && passUpper && passLower && passNumber && passSpecial && passNotNin
  const passwordStrength = calculatePasswordStrength(corporatePassword)

  const isStep3Valid = consentAuthorized && consentPrivacy && consentReview
  const isStep4Valid = isPasswordValid && Boolean(twoFactorMethod) && isStep3Valid

  const handleActivateAccount = () => {
    if (!cacData || !isStep4Valid || !repCitizenId) return
    setIsSubmitting(true)

    const needsReview = isDirectorMatch === false

    const newCorp: CorporateEntity = {
      rcNumber: cacData.rcNumber,
      companyName: cacData.companyName,
      tin: cacData.tin,
      status: needsReview ? 'inactive' : 'active',
      industry: cacData.industry,
      directors: cacData.directors,
      representatives: [repCitizenId]
    }

    const initialBranch: Omit<CorporateBranch, 'id' | 'entityId' | 'createdAt'> = {
      branchCode: 'HQ',
      name: `${cacData.companyName} (Head Office)`,
      address: cacData.registeredAddress || 'Kaduna State',
      lga: selectedLga,
      taxOffice: assignedCorporateTaxOffice,
      contactEmail: corporateEmail,
      contactPhone: corporatePhone,
      status: 'active'
    }

    // Register entity + initial branch + binding in auth engine
    registerCorporateWithBranch({
      corporate: newCorp,
      initialBranch,
      repCitizenId,
      repLegalName,
      corporateEmail,
      role: 'ENTITY_ADMIN',
      isDirectorMatch: Boolean(isDirectorMatch)
    })

    // Log 3 separate statutory consent records under NDPA 2023
    const ipAddress = '102.89.12.88'
    const deviceInfo = navigator.userAgent
    const policyVersion = 'v2.0-2024'

    logConsent({
      citizenId: repCitizenId,
      type: 'registration',
      policyVersion,
      granted: true,
      ipAddress,
      deviceInfo,
      consentedFields: ['rcNumber', 'companyName', 'tin', 'authority_declaration']
    })

    logConsent({
      citizenId: repCitizenId,
      type: 'registration',
      policyVersion,
      granted: true,
      ipAddress,
      deviceInfo,
      consentedFields: ['corporateEmail', 'corporatePhone', 'lga', 'taxOffice', 'ndpa_data_storage']
    })

    logConsent({
      citizenId: repCitizenId,
      type: 'registration',
      policyVersion,
      granted: true,
      ipAddress,
      deviceInfo,
      consentedFields: ['statutory_audit_understanding', 'kyc_compliance_verification']
    })

    setIsSubmitting(false)

    if (needsReview) {
      setReviewRequiredSubmitted(true)
    } else {
      navigate('/paykaduna')
    }
  }

  // ==========================================
  // RENDER: PENDING REVIEW CONFIRMATION
  // ==========================================
  if (reviewRequiredSubmitted && cacData) {
    return (
      <div className="bg-[var(--card-bg)] text-[var(--ink)] shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 max-w-xl mx-auto border border-amber-300 dark:border-amber-900/60">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 font-mono">
            Status: Pending Administrative Review
          </span>
          <h2 className="font-display font-bold text-2xl text-[var(--ink)] mt-1">
            Registration Submitted for Verification
          </h2>
          <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-2 leading-relaxed">
            Your corporate registration for <strong className="text-[var(--ink)]">{cacData.companyName}</strong> ({cacData.rcNumber}) has been securely logged. Because representative{' '}
            <strong className="text-[var(--ink)]">{repLegalName}</strong> is not listed on the CAC director registry, KADIRS governance officers will verify your mandate authorization letter.
          </p>
        </div>

        <div className="border border-[var(--line)] bg-black/[0.02] dark:bg-white/[0.03] p-4 rounded-2xl text-xs space-y-2">
          <div className="flex justify-between text-[var(--gray-700)]">
            <span>Enterprise:</span>
            <span className="font-semibold text-[var(--ink)]">{cacData.companyName}</span>
          </div>
          <div className="flex justify-between text-[var(--gray-700)]">
            <span>Signatory Officer:</span>
            <span className="font-semibold text-[var(--ink)]">{repLegalName}</span>
          </div>
          <div className="flex justify-between text-[var(--gray-700)]">
            <span>Mandate Document:</span>
            <span className="font-mono text-[#1AA260]">{mandateDocRef}</span>
          </div>
          <div className="flex justify-between text-[var(--gray-700)]">
            <span>Review SLA:</span>
            <span className="font-semibold text-[var(--ink)]">Within 24 business hours</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto text-center px-6 py-3 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs sm:text-sm font-semibold transition-all"
          >
            Return to Homepage
          </Link>
          <Link
            to="/auth/login"
            className="w-full sm:w-auto text-center px-5 py-3 rounded-full border border-[var(--line)] hover:bg-[var(--line-soft)] text-xs sm:text-sm font-medium transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* STEP 0: CAC RC Lookup & Duplicate RC "Request Access" Flow        */}
      {/* ================================================================ */}
      {step === 0 && (
        <form
          className="bg-[var(--card-bg)] text-[var(--ink)] shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200"
          onSubmit={handleLookup}
        >
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Corporate Affairs Commission (CAC) Verification
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              Enter your registered corporate number (RC or BN) to verify your enterprise against active commercial registry records.
            </p>
          </div>

          {/* Quick-Fill Evaluator Chips — Gated behind DEV environment */}
          {import.meta.env.DEV && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-[var(--gray-500)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Dev quick fill:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setDuplicateRCBlocked(null)
                  setRcError(null)
                  setRcNumber('RC-1849204')
                }}
                className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-[#1AA260] border border-emerald-500/25 transition-colors font-mono font-medium cursor-pointer"
              >
                RC-1849204 (Registered Bank / Entity)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicateRCBlocked(null)
                  setRcError(null)
                  setRcNumber('RC-9021844')
                }}
                className="text-xs px-3 py-1 rounded-full bg-[var(--input-bg)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[var(--ink)] border border-[var(--input-border)] transition-colors font-mono font-medium cursor-pointer"
              >
                RC-9021844 (New Business)
              </button>
            </div>
          )}

          {/* Task B: "Request Access to this Entity" Flow when RC is already registered */}
          {duplicateRCBlocked && (
            <div className="border border-emerald-500/30 bg-emerald-500/10 p-5 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-[#1AA260] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-[var(--ink)]">
                    Corporate Entity Already Registered
                  </h4>
                  <p className="text-xs text-[var(--gray-700)] mt-1 leading-relaxed">
                    Corporate registration <span className="font-mono font-bold text-[#1AA260]">{duplicateRCBlocked.rc}</span> ({duplicateRCBlocked.companyName || 'Registered Enterprise'}) is an active legal entity on KADIRS services. Under state revenue rules, duplicate legal entities are not permitted, but authorized officers and branches may request scoped access.
                  </p>
                </div>
              </div>

              {!showAccessRequestModal ? (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAccessRequestModal(true)}
                    className="bg-[#1AA260] hover:bg-[#158A52] text-white px-5 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Request Branch / Officer Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to={`/auth/login?identifier=${duplicateRCBlocked.rc}&type=corporate`}
                    className="px-4 py-2.5 rounded-full border border-[var(--input-border)] bg-[var(--card-bg)] hover:bg-black/[0.03] text-xs font-semibold text-[var(--ink)] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Sign In to Existing Account</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateRCBlocked(null)
                      setRcNumber('')
                    }}
                    className="text-xs text-[var(--gray-500)] hover:text-[var(--ink)] underline cursor-pointer ml-auto"
                  >
                    Enter different RC number
                  </button>
                </div>
              ) : (
                /* Inline Request Access Form */
                <div className="pt-3 border-t border-emerald-500/20 space-y-4 animate-in fade-in">
                  {!accessSubmitted ? (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--ink)]">
                          Request Authorization for {duplicateRCBlocked.companyName || duplicateRCBlocked.rc}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAccessRequestModal(false)}
                          className="text-xs text-[var(--gray-500)] hover:text-[var(--ink)] underline"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Requester Identity Verification */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
                            Your Virtual NIN (vNIN) <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={accessVnin}
                              onChange={(e) => {
                                setAccessVnin(e.target.value)
                                setAccessVninVerified(false)
                              }}
                              placeholder="16-character vNIN"
                              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyAccessVnin}
                              disabled={isVerifyingAccessVnin || accessVnin.length < 11}
                              className="px-3 py-2 bg-[#1AA260] text-white rounded-lg text-xs font-semibold disabled:opacity-50 shrink-0 cursor-pointer"
                            >
                              {isVerifyingAccessVnin ? '...' : 'Verify'}
                            </button>
                          </div>
                          {accessVninError && (
                            <p className="text-[11px] text-rose-600 mt-1">{accessVninError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
                            Full Legal Name (NIMC Verified)
                          </label>
                          <input
                            value={accessRequesterName}
                            readOnly
                            placeholder="Auto-populated upon verification"
                            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-black/[0.03] dark:bg-white/[0.05] text-xs font-medium cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
                            Requested Role
                          </label>
                          <select
                            value={accessRequestedRole}
                            onChange={(e) => setAccessRequestedRole(e.target.value as EntityRole)}
                            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-xs"
                          >
                            <option value="BRANCH_OFFICER">Branch Officer (Scoped to specific branch)</option>
                            <option value="ENTITY_ADMIN">Entity Administrator (Full Parent Scope)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
                            Target Branch
                          </label>
                          <select
                            value={accessBranchTarget}
                            onChange={(e) => setAccessBranchTarget(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-xs"
                          >
                            <option value="HQ">Head Office / Primary Branch</option>
                            <option value="NEW_BRANCH">+ Request New Branch Creation</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
                          Official Corporate Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={accessCorporateEmail}
                          onChange={(e) => setAccessCorporateEmail(e.target.value)}
                          placeholder="e.g. officer@bank.ng"
                          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
                          Statutory Mandate &amp; Justification <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={accessJustification}
                          onChange={(e) => setAccessJustification(e.target.value)}
                          placeholder="Explain your authority and operational purpose (e.g. Appointed Branch Tax Officer per Board Resolution)..."
                          rows={2}
                          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-xs"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleSubmitAccessRequest}
                          disabled={!accessVninVerified || !accessJustification.trim() || !accessCorporateEmail.trim()}
                          className="px-6 py-2 bg-[#1AA260] hover:bg-[#158A52] text-white rounded-full text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          Submit Access Request
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Request Submitted Success Confirmation */
                    <div className="p-4 bg-emerald-500/15 rounded-xl text-xs space-y-2">
                      <div className="flex items-center gap-2 text-[#1AA260] font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Access Request Submitted — Ref #{accessRequestId}</span>
                      </div>
                      <p className="text-[var(--gray-700)] leading-relaxed">
                        Your request has been routed to the Entity Administrator for <strong className="text-[var(--ink)]">{duplicateRCBlocked.companyName}</strong>. If no administrator is reachable, this request will automatically escalate to the KADIRS Governance Maker/Checker queue.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDuplicateRCBlocked(null)
                            setShowAccessRequestModal(false)
                            setAccessSubmitted(false)
                            setRcNumber('')
                          }}
                          className="text-xs text-[#1AA260] font-semibold hover:underline"
                        >
                          &larr; Return to RC Lookup
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {rcError && !duplicateRCBlocked && (
            <div className="p-4 border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{rcError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              CAC Registration Number <span className="text-rose-500">*</span>
            </label>
            <input
              value={rcNumber}
              onChange={(e) => {
                setDuplicateRCBlocked(null)
                setRcError(null)
                setRcNumber(e.target.value)
              }}
              placeholder="e.g. RC-1849204 or BN-123456"
              className="w-full px-4 py-3 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--ink)] font-mono text-base uppercase focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 tracking-wider"
              required
            />
          </div>

          <div className="border border-emerald-500/20 bg-emerald-500/10 p-4 rounded-2xl text-xs text-[var(--gray-700)] leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#1AA260] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[var(--ink)] block mb-0.5">CAC Interoperability</span>
              Your business registration number is verified directly against the federal registry to confirm active corporate standing with KADIRS.
            </div>
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={onBackToSelection}
              className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="submit"
              disabled={isSearching || Boolean(duplicateRCBlocked)}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Querying CAC Registry...</span>
                </>
              ) : (
                <>
                  <span>Lookup Enterprise</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* STEP 1: Company Profile, Derivation & Inline Verified Channels     */}
      {/* ================================================================ */}
      {step === 1 && cacData && (
        <form
          className="bg-[var(--card-bg)] text-[var(--ink)] shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200"
          onSubmit={handleStep1Submit}
        >
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Confirm Company Details &amp; Contact Channels
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              Verify your official CAC registry record and validate your primary corporate contact channels before adding authorized representatives.
            </p>
          </div>

          {/* Compact Locked CAC Summary Card */}
          <div className="border border-emerald-500/25 bg-emerald-500/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1AA260] block">
                  Registered Enterprise
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-[var(--ink)] mt-0.5">
                  {cacData.companyName}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-[#1AA260] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Standing</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-emerald-500/20">
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] mb-0.5">
                  CAC RC Number
                </span>
                <span className="text-sm font-mono font-bold text-[var(--ink)]">
                  {cacData.rcNumber}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] mb-0.5">
                  Kaduna State TIN
                </span>
                <span className="text-sm font-mono font-bold text-[var(--ink)]">
                  {cacData.tin}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] mb-0.5">
                  Industry Classification
                </span>
                <span className="text-sm font-medium text-[var(--ink)] capitalize">
                  {cacData.industry}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/20">
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] mb-1.5">
                CAC Registered Directors
              </span>
              <div className="flex flex-wrap gap-2">
                {cacData.directors.map((director) => (
                  <span
                    key={director}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--card-bg)] text-xs font-medium text-[var(--ink)] border border-emerald-500/30"
                  >
                    <UserCheck className="w-3 h-3 text-[#1AA260]" />
                    <span>{director}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Operational Parameters: LGA & Staff Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Principal Business LGA <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 cursor-pointer"
              >
                {KADUNA_LGAS.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Staff Size Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={staffCount}
                onChange={(e) => setStaffCount(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 cursor-pointer"
              >
                <option value="1 - 10 employees">1 - 10 employees (Micro enterprise)</option>
                <option value="11 - 50 employees">11 - 50 employees (Small enterprise)</option>
                <option value="51 - 250 employees">51 - 250 employees (Medium enterprise)</option>
                <option value="250+ employees">250+ employees (Large enterprise)</option>
              </select>
            </div>
          </div>

          {/* Designated Corporate Tax Office (Derived automatically from LGA) */}
          <div className="border border-emerald-500/20 bg-emerald-500/10 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5 text-[#1AA260]">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] uppercase font-semibold text-[#1AA260] tracking-wider block">
                Designated KADIRS Corporate Tax Office
              </span>
              <div className="text-sm font-bold text-[var(--ink)] mt-0.5">
                {assignedCorporateTaxOffice}
              </div>
              <p className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">
                Corporate PAYE filings, withholding tax remittances, and business premises licensing in {selectedLga} route through this office.
              </p>
            </div>
          </div>

          {/* Corporate Contact Channels with Inline Verification */}
          <div className="space-y-5 pt-3 border-t border-[var(--gray-200)]">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink)] tracking-tight">
                Corporate Contact Channels &amp; Verification
              </h3>
              <p className="text-xs text-[var(--gray-700)] mt-0.5">
                Both company email and phone must be verified inline before proceeding.
              </p>
            </div>

            {/* Field 1: Corporate Official Email */}
            <div className="p-4 border border-[var(--input-border)] rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-[var(--ink)]">
                  Corporate Official Email <span className="text-rose-500">*</span>
                </label>
                {emailVerified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-[#1AA260] text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Email Verified</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  value={corporateEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. tax@company.ng"
                  disabled={emailVerified}
                  className={`flex-1 px-4 py-2.5 border rounded-xl bg-[var(--input-bg)] text-[var(--ink)] text-sm focus:outline-none ${
                    emailDuplicateError
                      ? 'border-rose-400'
                      : 'border-[var(--input-border)] focus:border-[#1AA260]'
                  }`}
                  required
                />
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={!corporateEmail.trim() || Boolean(emailDuplicateError) || emailCooldown > 0}
                    className="px-5 py-2.5 bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-semibold rounded-xl disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {emailCooldown > 0 ? `Resend (${emailCooldown}s)` : emailOtpSent ? 'Resend code' : 'Verify email'}
                  </button>
                )}
              </div>

              {emailDuplicateError && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailDuplicateError}</span>
                </p>
              )}

              {emailWarning && (
                <div className="p-3 border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{emailWarning}</span>
                </div>
              )}

              {/* Inline Email Code Input */}
              {emailOtpSent && !emailVerified && (
                <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 rounded-xl space-y-2 animate-in fade-in">
                  <span className="text-xs text-[var(--gray-700)] block">
                    Enter the 6-digit code sent to <strong className="text-[var(--ink)]">{corporateEmail}</strong> (Demo code: <code className="font-mono text-[#1AA260]">123456</code>):
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emailOtpInput}
                      onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-36 px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-center font-mono tracking-widest text-sm font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailOtp}
                      disabled={emailOtpInput.length < 6}
                      className="px-4 py-2 bg-[#1AA260] text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      Confirm code
                    </button>
                  </div>
                  {emailOtpError && (
                    <p className="text-xs text-rose-600">{emailOtpError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Field 2: Corporate Official Phone */}
            <div className="p-4 border border-[var(--input-border)] rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-[var(--ink)]">
                  Corporate Official Phone <span className="text-rose-500">*</span>
                </label>
                {phoneVerified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-[#1AA260] text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Phone Verified</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="tel"
                  value={corporatePhone}
                  onChange={(e) => {
                    setCorporatePhone(e.target.value)
                    setPhoneVerified(false)
                    setPhoneOtpSent(false)
                  }}
                  placeholder="e.g. +234 812 987 6543"
                  disabled={phoneVerified}
                  className="flex-1 px-4 py-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260]"
                  required
                />
                {!phoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={!corporatePhone.trim() || phoneCooldown > 0}
                    className="px-5 py-2.5 bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-semibold rounded-xl disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {phoneCooldown > 0 ? `Resend (${phoneCooldown}s)` : phoneOtpSent ? 'Resend code' : 'Verify phone'}
                  </button>
                )}
              </div>

              {/* Inline Phone Code Input */}
              {phoneOtpSent && !phoneVerified && (
                <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 rounded-xl space-y-2 animate-in fade-in">
                  <span className="text-xs text-[var(--gray-700)] block">
                    Enter the 6-digit SMS code sent to <strong className="text-[var(--ink)]">{corporatePhone}</strong> (Demo code: <code className="font-mono text-[#1AA260]">123456</code>):
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={phoneOtpInput}
                      onChange={(e) => setPhoneOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-36 px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-center font-mono tracking-widest text-sm font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      disabled={phoneOtpInput.length < 6}
                      className="px-4 py-2 bg-[#1AA260] text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      Confirm code
                    </button>
                  </div>
                  {phoneOtpError && (
                    <p className="text-xs text-rose-600">{phoneOtpError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="flex justify-between items-center pt-5 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={() => changeStep(0)}
              className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="submit"
              disabled={!emailVerified || !phoneVerified || Boolean(emailDuplicateError)}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>Continue to Representative</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* STEP 2: Representative Signatory (vNIN & CAC Director Matching)   */}
      {/* ================================================================ */}
      {step === 2 && cacData && (
        <div className="bg-[var(--card-bg)] text-[var(--ink)] shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Designate Authorized Representative
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              Verify your personal identity using your Virtual National Identification Number (vNIN). KADIRS cross-references your identity with CAC records.
            </p>
          </div>

          {/* Quick-Fill Evaluator Chips for Representative vNIN in DEV */}
          {import.meta.env.DEV && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-[var(--gray-500)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Dev quick fill:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setVninInput('12345678901')
                  setVninError(null)
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-[#1AA260] border border-emerald-500/25 transition-colors font-medium cursor-pointer"
              >
                Director: Fatima Aliyu (Listed in CAC)
              </button>
              <button
                type="button"
                onClick={() => {
                  setVninInput('98765432101')
                  setVninError(null)
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border border-amber-500/25 transition-colors font-medium cursor-pointer"
              >
                Non-Director: Emeka Obi (Mandate Letter Path)
              </button>
            </div>
          )}

          {/* vNIN Verification Card */}
          <form onSubmit={handleVerifyRepresentativeVnin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Virtual National Identification Number (vNIN) <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={vninInput}
                  onChange={(e) => {
                    setVninInput(e.target.value.trim())
                    setVninVerified(false)
                    setIsDirectorMatch(null)
                  }}
                  placeholder="e.g. VN12345678901234 or 11-digit NIN"
                  className="flex-1 px-4 py-3 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--ink)] font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-[#1AA260]"
                  required
                />
                <button
                  type="submit"
                  disabled={isVerifyingVnin || !vninInput.trim()}
                  className="bg-[#1AA260] hover:bg-[#158A52] text-white px-6 py-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center gap-2"
                >
                  {isVerifyingVnin ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying NIMC...</span>
                    </>
                  ) : (
                    <span>Verify identity</span>
                  )}
                </button>
              </div>
              <span className="text-[11px] text-[var(--gray-500)] mt-1.5 block">
                Generate a vNIN in the NIMC MWS app or dial <code className="font-mono text-[#1AA260]">*346*3*NIN*EnterpriseCode#</code>. Raw 11-digit NINs are never stored.
              </span>
            </div>

            {vninError && (
              <div className="p-3 border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{vninError}</span>
              </div>
            )}
          </form>

          {/* Verified Representative Details (Auto-filled & Strictly Read-Only) */}
          {vninVerified && (
            <div className="space-y-4 pt-2 border-t border-[var(--gray-200)] animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Representative Full Legal Name (NIMC Verified)
                  </label>
                  <input
                    value={repLegalName}
                    readOnly
                    className="w-full px-4 py-3 border border-emerald-500/30 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] text-[var(--ink)] font-bold text-sm cursor-not-allowed"
                  />
                  <span className="text-[11px] text-[#1AA260] mt-1 block">
                    ✓ Grounded in federal identity register — non-editable
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Representative Official Role / Designation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={repRole}
                    onChange={(e) => setRepRole(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260]"
                  >
                    <option value="Managing Director">Managing Director</option>
                    <option value="Director">Director</option>
                    <option value="Company Secretary">Company Secretary</option>
                    <option value="Chief Financial Officer">Chief Financial Officer (CFO)</option>
                    <option value="Tax Consultant / Manager">Tax Consultant / Revenue Manager</option>
                    <option value="Authorized Corporate Officer">Authorized Corporate Officer</option>
                  </select>
                </div>
              </div>

              {/* CAC Director Matching Decision Banner */}
              {isDirectorMatch ? (
                <div className="border border-emerald-500/30 bg-emerald-500/10 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1AA260] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-[#1AA260] block">
                      CAC Director Match Confirmed
                    </span>
                    <p className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">
                      <strong className="text-[var(--ink)]">{repLegalName}</strong> matches listed director{' '}
                      <strong className="text-[#1AA260]">{matchedDirectorName || repLegalName}</strong> on file with the Corporate Affairs Commission. Instant activation granted upon security confirmation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block">
                        Non-Director Representative (Mandate Letter Path)
                      </span>
                      <p className="text-xs text-amber-900/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                        Representative <strong className="text-[var(--ink)]">{repLegalName}</strong> is not listed on the CAC director registry for {cacData.companyName}. An official corporate mandate or board authorization letter is required. Registration will be routed to KADIRS administrative review before activation.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs">
                    <span className="text-[var(--gray-700)] font-medium flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>Authorization Document:</span>
                    </span>
                    <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                      {mandateDocRef}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sticky Action Footer */}
          <div className="flex justify-between items-center pt-5 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!vninVerified}
              onClick={() => changeStep(3)}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>Continue to Consent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 3: Statutory Consents & Declarations (NDPA 2023)              */}
      {/* ================================================================ */}
      {step === 3 && cacData && (
        <div className="bg-[var(--card-bg)] text-[var(--ink)] shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#1AA260] text-[11px] font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Step 5 &bull; NDPA 2023 Statutory Consents</span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Statutory Consents &amp; Authority Declarations
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              In compliance with the Nigeria Data Protection Act (NDPA) 2023, provide the mandatory statutory declarations for this corporate entity before setting up login credentials.
            </p>
          </div>

          {/* Compact Entity & Representative Summary Card */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-[var(--gray-200)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-[var(--ink)] block">
                  {cacData.companyName}
                </span>
                <span className="text-xs text-[var(--gray-500)] font-mono">
                  RC: {cacData.rcNumber} &bull; State TIN: {cacData.tin}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-[var(--gray-500)] block">Authorized Representative</span>
              <span className="text-xs font-semibold text-[var(--ink)]">
                {repLegalName} ({repRole})
              </span>
            </div>
          </div>

          {/* Three Statutory Consent Checkboxes */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--ink)]">
              Mandatory Statutory Declarations <span className="text-rose-500">*</span>
            </h3>

            <div className="space-y-3">
              {/* Checkbox 1: Authority */}
              <label className="flex items-start gap-3.5 p-4 border border-[var(--input-border)] rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={consentAuthorized}
                  onChange={(e) => setConsentAuthorized(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#1AA260] focus:ring-[#1AA260] accent-[#1AA260] cursor-pointer shrink-0"
                />
                <div className="text-xs sm:text-sm">
                  <strong className="text-[var(--ink)] block font-semibold">1. Declaration of Authority</strong>
                  <span className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed block">
                    I solemnly declare that I am legally authorized to register, bind, and manage statutory tax affairs for <strong>{cacData.companyName}</strong>.
                  </span>
                </div>
              </label>

              {/* Checkbox 2: NDPA Data Storage */}
              <label className="flex items-start gap-3.5 p-4 border border-[var(--input-border)] rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={consentPrivacy}
                  onChange={(e) => setConsentPrivacy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#1AA260] focus:ring-[#1AA260] accent-[#1AA260] cursor-pointer shrink-0"
                />
                <div className="text-xs sm:text-sm">
                  <strong className="text-[var(--ink)] block font-semibold">2. Privacy &amp; Data Policy (NDPA 2023)</strong>
                  <span className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed block">
                    I consent to KADIRS storing and processing enterprise identification and tax records in compliance with the Nigeria Data Protection Act (NDPA) 2023.
                  </span>
                </div>
              </label>

              {/* Checkbox 3: Regulatory Review Understanding */}
              <label className="flex items-start gap-3.5 p-4 border border-[var(--input-border)] rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={consentReview}
                  onChange={(e) => setConsentReview(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#1AA260] focus:ring-[#1AA260] accent-[#1AA260] cursor-pointer shrink-0"
                />
                <div className="text-xs sm:text-sm">
                  <strong className="text-[var(--ink)] block font-semibold">3. Regulatory Compliance &amp; Audit Trail</strong>
                  <span className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed block">
                    I understand that KADIRS reserves statutory authority to audit registrations and verify representative credentials with relevant state authorities.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-between items-center pt-5 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={() => changeStep(2)}
              className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back to Representative
            </button>
            <button
              type="button"
              disabled={!isStep3Valid}
              onClick={() => changeStep(4)}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-8 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <span>Accept &amp; Continue to Security</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 4: Security & 2FA (Staged: Password -> 2FA)                  */}
      {/* ================================================================ */}
      {step === 4 && cacData && (
        <div className="bg-[var(--card-bg)] text-[var(--ink)] shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#1AA260] text-[11px] font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Step 6 &bull; Account Security</span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              {passwordStage === 'password' ? 'Corporate Account Password' : 'Secondary Verification (2FA)'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              {passwordStage === 'password'
                ? `Establish a dedicated enterprise password strictly isolated for managing ${cacData.companyName}.`
                : 'Configure two-factor authentication to protect corporate tax filings and statutory submissions.'}
            </p>
          </div>

          <div className="space-y-5">
            {/* Corporate Login Identity (Email) Confirmation */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-[var(--gray-200)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gray-500)] block">
                    Corporate Login Email / Username
                  </span>
                  <span className="font-bold text-sm text-[var(--ink)] truncate block mt-0.5">
                    {corporateEmail}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800">
                  Verified Sign-In ID
                </span>
                <button
                  type="button"
                  onClick={() => changeStep(1)}
                  className="block text-[11px] text-[var(--gray-500)] hover:text-[#1AA260] hover:underline mt-1 cursor-pointer ml-auto"
                >
                  Edit email &rarr;
                </button>
              </div>
            </div>

            {/* Stage 1: Password Input and Live Requirements (2FA is hidden) */}
            {passwordStage === 'password' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-3 p-5 border border-[var(--input-border)] rounded-2xl bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                        Corporate Login Password <span className="text-rose-500">*</span>
                      </h3>
                      <span className="text-xs text-[var(--gray-700)]">
                        Isolated strictly for managing {cacData.companyName}.
                      </span>
                    </div>
                    {corporatePassword && (
                      <span className="text-xs font-semibold text-[var(--gray-700)] flex items-center gap-1.5">
                        <span>Strength:</span>
                        <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={corporatePassword}
                      onChange={(e) => setCorporatePassword(e.target.value)}
                      placeholder="Create enterprise password"
                      className="w-full px-4 py-3 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 pr-11"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[var(--gray-500)] hover:text-[var(--ink)] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Validation Checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        passLength
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-[#1AA260]'
                          : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--gray-500)]'
                      }`}
                    >
                      <span>{passLength ? '✓' : '○'}</span>
                      <span>8+ chars</span>
                    </div>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        passUpper
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-[#1AA260]'
                          : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--gray-500)]'
                      }`}
                    >
                      <span>{passUpper ? '✓' : '○'}</span>
                      <span>Uppercase</span>
                    </div>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        passLower
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-[#1AA260]'
                          : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--gray-500)]'
                      }`}
                    >
                      <span>{passLower ? '✓' : '○'}</span>
                      <span>Lowercase</span>
                    </div>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        passNumber
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-[#1AA260]'
                          : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--gray-500)]'
                      }`}
                    >
                      <span>{passNumber ? '✓' : '○'}</span>
                      <span>Number</span>
                    </div>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        passSpecial
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-[#1AA260]'
                          : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--gray-500)]'
                      }`}
                    >
                      <span>{passSpecial ? '✓' : '○'}</span>
                      <span>Special char</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Stage 2: Password Confirmed Badge + 2FA Selection (Password input is hidden) */
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Confirmed Password Card */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-[var(--gray-200)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gray-500)] block">
                        Corporate Password Established
                      </span>
                      <span className="font-mono text-sm tracking-widest text-[var(--ink)] block mt-0.5">
                        ••••••••••••
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordStage('password')}
                    className="text-xs font-semibold text-[#1AA260] hover:text-[#158A52] hover:underline cursor-pointer shrink-0"
                  >
                    Change password &rarr;
                  </button>
                </div>

                {/* Secondary Verification (2FA Setup) */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                      Secondary Verification (2FA) <span className="text-rose-500">*</span>
                    </h3>
                    <p className="text-xs text-[var(--gray-700)] mt-0.5">
                      Protect corporate tax filings with mandated two-factor authentication.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setTwoFactorMethod('totp')}
                      className={`p-4 border rounded-2xl text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                        twoFactorMethod === 'totp'
                          ? 'border-[#1AA260] bg-emerald-500/10 ring-2 ring-[#1AA260]/20'
                          : 'border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-black/[0.02]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          twoFactorMethod === 'totp' ? 'bg-[#1AA260] text-white' : 'bg-black/[0.05] text-[var(--gray-500)]'
                        }`}
                      >
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--ink)]">Authenticator App</div>
                        <div className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">
                          Works with Google Authenticator, Microsoft Authenticator, or Apple Keychain.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTwoFactorMethod('sms')}
                      className={`p-4 border rounded-2xl text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                        twoFactorMethod === 'sms'
                          ? 'border-[#1AA260] bg-emerald-500/10 ring-2 ring-[#1AA260]/20'
                          : 'border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-black/[0.02]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          twoFactorMethod === 'sms' ? 'bg-[#1AA260] text-white' : 'bg-black/[0.05] text-[var(--gray-500)]'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--ink)]">Corporate SMS OTP</div>
                        <div className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">
                          Instant verification codes dispatched to verified corporate phone ({corporatePhone}).
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Action Footer */}
          <div className="flex justify-between items-center pt-5 border-t border-[var(--gray-200)]">
            {passwordStage === 'password' ? (
              <>
                <button
                  type="button"
                  onClick={() => changeStep(3)}
                  className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
                >
                  &larr; Back to Consent
                </button>
                <button
                  type="button"
                  disabled={!isPasswordValid}
                  onClick={() => setPasswordStage('two_factor')}
                  className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  Set Password &amp; Continue &nbsp;&rarr;
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPasswordStage('password')}
                  className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  disabled={!isStep4Valid || isSubmitting}
                  onClick={handleActivateAccount}
                  className="bg-[#1AA260] hover:bg-[#158A52] text-white px-8 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Activating enterprise...</span>
                    </>
                  ) : isDirectorMatch ? (
                    <>
                      <span>Activate Corporate Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Submit for Administrative Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

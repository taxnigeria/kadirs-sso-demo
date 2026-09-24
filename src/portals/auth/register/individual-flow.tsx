import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Send,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Smartphone,
  KeyRound
} from 'lucide-react'
import { KADUNA_LGAS, LGA_TAX_OFFICES } from '@/data/lga-tax-offices'
import { verifyNINWithNIMC, maskNIMCPhone, type NIMCVerificationResponse } from '@/engine/kyc-simulator'
import { sendSimulatedOTP, verifySimulatedOTP } from '@/engine/otp-simulator'
import { useAuthEngine, checkNINRegistered, checkEmailRegistered } from '@/engine/auth-engine'
import { useEventLogger } from '@/engine/event-logger'
import { type IdentityRecord } from '@/types'

interface IndividualFlowProps {
  onBackToSelection?: () => void
  onStepChange?: (step: number) => void
  isHeadlessMode?: boolean
  onHeadlessComplete?: () => void
}

export function IndividualFlow({
  onBackToSelection,
  onStepChange,
  isHeadlessMode,
  onHeadlessComplete
}: IndividualFlowProps) {
  const navigate = useNavigate()
  const registerCitizen = useAuthEngine((s) => s.registerCitizen)
  const logConsent = useEventLogger((s) => s.logConsent)

  const [step, setStepState] = useState<0 | 1 | 2 | 3 | 4>(0)

  const changeStep = (nextStep: 0 | 1 | 2 | 3 | 4) => {
    setStepState(nextStep)
    onStepChange?.(nextStep)
  }

  // ==========================================
  // Step 0: National Identity (NIN) Verification
  // ==========================================
  const [ninInput, setNinInput] = useState('')
  const [showNIN, setShowNIN] = useState(false)
  const [isVerifyingNIN, setIsVerifyingNIN] = useState(false)
  const [ninError, setNinError] = useState<string | null>(null)
  const [duplicateNINBlocked, setDuplicateNINBlocked] = useState<string | null>(null)
  const [nimcData, setNimcData] = useState<NIMCVerificationResponse | null>(null)
  const [isProvisionalNIMC, setIsProvisionalNIMC] = useState(false)

  // ==========================================
  // Step 1: Contact Information & OTP Verification
  // ==========================================
  const [nimcRegisteredPhone, setNimcRegisteredPhone] = useState('')
  const [email, setEmail] = useState('')
  const [initialEmail, setInitialEmail] = useState('')
  const [emailDuplicateError, setEmailDuplicateError] = useState<string | null>(null)

  const [phone, setPhone] = useState('')

  const [otpSent, setOtpSent] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpVerified, setOtpVerified] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(3)

  // ==========================================
  // Step 2: Location & Tax Jurisdiction
  // ==========================================
  const [selectedLga, setSelectedLga] = useState('Kaduna North')
  const [address, setAddress] = useState('')

  // ==========================================
  // Step 3: Security & 2FA Configuration
  // ==========================================
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'totp'>('sms')

  // ==========================================
  // Step 4: Statutory NDPA 2023 Consent
  // ==========================================
  const [consentStorage, setConsentStorage] = useState(false)
  const [consentSharing, setConsentSharing] = useState(false)
  const [consentPolicy, setConsentPolicy] = useState(false)

  // Resend cooldown countdown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Real-time email duplicate check
  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (!val.trim()) {
      setEmailDuplicateError(null)
      return
    }
    const check = checkEmailRegistered(val)
    if (check.registered) {
      setEmailDuplicateError(
        `Duplicate email blocked: "${val}" is already associated with an existing KADIRS account. Duplicate emails are prohibited.`
      )
    } else {
      setEmailDuplicateError(null)
    }
  }

  // Handle contact phone change (after OTP verification unlocks contact channels)
  const handlePhoneChange = (val: string) => {
    setPhone(val)
  }

  // Format masked NIN display (mask after 3 digits if showNIN is false)
  const getDisplayNIN = () => {
    if (showNIN) return ninInput
    if (ninInput.length <= 3) return ninInput
    return ninInput.slice(0, 3) + '•'.repeat(ninInput.length - 3)
  }

  // Step 0 Submission: Verify NIN with NIMC
  const handleVerifyNIN = async (e: React.FormEvent) => {
    e.preventDefault()
    setNinError(null)
    setDuplicateNINBlocked(null)
    const clean = ninInput.replace(/\s+/g, '')

    if (clean.length !== 11 && clean.length !== 16) {
      setNinError('Please enter a valid 11-digit NIN or 16-character virtual NIN (vNIN)')
      return
    }

    // Spec Rule: Internal duplicate check — if NIN already registered → hard block
    if (checkNINRegistered(clean)) {
      setDuplicateNINBlocked(clean)
      return
    }

    try {
      setIsVerifyingNIN(true)
      const res = await verifyNINWithNIMC(clean)
      setNimcData(res)
      setIsProvisionalNIMC(false)
      const safePhone = res.registeredPhone.includes('NaN') ? '0803 456 7890' : res.registeredPhone
      setNimcRegisteredPhone(safePhone)

      // Seed initial contact info derived from NIMC carrier record
      const defaultEmail = `${res.legalName.toLowerCase().replace(/\s+/g, '.')}@outlook.com`
      setEmail(defaultEmail)
      setInitialEmail(defaultEmail)
      setPhone(safePhone)
      setAddress('42 Constitution Road, Kaduna')

      changeStep(1)
    } catch (err: unknown) {
      setNinError(err instanceof Error ? err.message : 'NIMC verification failed.')
    } finally {
      setIsVerifyingNIN(false)
    }
  }

  // Fallback: Provisional registration if NIMC is down/slow
  const handleProvisionalNIMC = () => {
    const clean = ninInput.replace(/\s+/g, '')
    if (clean.length !== 11) {
      setNinError('Please enter a valid 11-digit NIN for provisional registration.')
      return
    }
    if (checkNINRegistered(clean)) {
      setDuplicateNINBlocked(clean)
      return
    }

    const provPhone = '+234 803 000 1122'
    const provisionalResponse: NIMCVerificationResponse = {
      success: true,
      legalName: 'Provisional Registrant',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      photoUrl: '',
      vnin: `VNIN-PROV-${clean.slice(0, 4)}-KAD`,
      registeredPhone: provPhone,
      provider: 'Prembly (Fallback)',
      verifiedAt: new Date().toISOString()
    }
    setNimcData(provisionalResponse)
    setIsProvisionalNIMC(true)
    setNimcRegisteredPhone(provPhone)
    setEmail('provisional.citizen@kaduna.ng')
    setInitialEmail('provisional.citizen@kaduna.ng')
    setPhone(provPhone)
    changeStep(1)
  }

  // Step 1: Send OTP to Official NIN-Registered Phone
  const handleSendOTP = () => {
    const targetPhone = nimcRegisteredPhone || (nimcData?.registeredPhone ?? phone)
    if (!targetPhone) {
      setOtpError('NIN-registered mobile phone number not found.')
      return
    }

    setOtpError(null)
    sendSimulatedOTP(targetPhone, 'termii_sms_dnd')
    setOtpSent(true)
    setOtpInput('')
    setResendCooldown(30)
    setOtpAttemptsLeft(3)
  }

  // Step 1: Verify OTP
  const handleVerifyOTP = () => {
    setOtpError(null)
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      setOtpError('Please enter the complete 6-digit verification code.')
      return
    }

    const res = verifySimulatedOTP(otpInput)
    if (!res.valid) {
      const remaining = Math.max(0, otpAttemptsLeft - 1)
      setOtpAttemptsLeft(remaining)
      if (remaining === 0) {
        setOtpError('Maximum attempts exceeded (3). Please request a fresh verification code.')
        setOtpSent(false)
      } else {
        setOtpError(`${res.message} (${remaining} attempts remaining)`)
      }
      return
    }

    setOtpError(null)
    setOtpVerified(true)
  }

  // Password validation checks
  const isPasswordLongEnough = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const isPasswordValid = isPasswordLongEnough && hasUpper && hasLower && hasNumber

  // Complete Registration
  const handleComplete = () => {
    if (!nimcData) return

    const identity: IdentityRecord = {
      nin: ninInput.trim(),
      legalName: nimcData.legalName,
      dateOfBirth: nimcData.dateOfBirth,
      gender: nimcData.gender,
      photoUrl: nimcData.photoUrl,
      verificationProvider: 'nimc',
      verifiedAt: nimcData.verifiedAt
    }

    const assignedTaxOffice = LGA_TAX_OFFICES[selectedLga] || 'Kaduna North Tax Office'

    const profile = registerCitizen(identity, {
      email: email.trim(),
      phone: phone.trim(),
      lga: selectedLga,
      taxOffice: assignedTaxOffice,
      address,
      personas: ['individual']
    })

    logConsent({
      citizenId: profile.citizenId,
      type: 'registration',
      policyVersion: 'v2.0-2024',
      granted: true,
      ipAddress: '102.89.44.201',
      deviceInfo: navigator.userAgent,
      consentedFields: ['legalName', 'dateOfBirth', 'gender', 'email', 'phone', 'lga', 'taxOffice']
    })

    if (isHeadlessMode && onHeadlessComplete) {
      onHeadlessComplete()
    } else {
      if (identity.nin === '12345678901' || identity.nin === '11122233344') {
        navigate('/auth/reconciliation')
      } else {
        navigate('/paykaduna')
      }
    }
  }

  const taxOffice = LGA_TAX_OFFICES[selectedLga]

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* STEP 0: National Identity Verification (NIMC)                      */}
      {/* ================================================================ */}
      {step === 0 && (
        <form
          className="bg-white border border-[var(--gray-200)] p-7 sm:p-9 rounded-[28px] space-y-6"
          onSubmit={handleVerifyNIN}
        >
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight mb-1">
              National Identity Verification
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)]">
              Your official legal name, date of birth, and gender are verified directly with NIMC.
            </p>
          </div>

          {/* Evaluator Demo Quick Fill Bar */}
          <div className="p-3 rounded-2xl bg-[var(--paper)] border border-[var(--gray-200)] text-xs flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--gray-500)] uppercase tracking-wider">Demo Quick Fill:</span>
            <button
              type="button"
              onClick={() => {
                setDuplicateNINBlocked(null)
                setNinError(null)
                setNinInput('23456789012')
              }}
              className="px-3 py-1 rounded-full bg-[var(--white)] hover:bg-emerald-50 border border-[var(--gray-200)] text-xs font-semibold text-[#1AA260] cursor-pointer transition-colors"
            >
              Fill Sample NIN (23456789012)
            </button>
          </div>

          {/* Hard Block on Duplicate NIN */}
          {duplicateNINBlocked && (
            <div className="border border-rose-300 bg-rose-50 p-5 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-rose-800">
                    National ID Already Registered
                  </h4>
                  <p className="text-xs text-[var(--ink)] mt-1 leading-relaxed">
                    National Identity Number (<span className="font-mono font-bold">{duplicateNINBlocked.slice(0, 3)}••••{duplicateNINBlocked.slice(-3)}</span>) is already linked to an existing account. Duplicate registrations are not permitted.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-3">
                <Link
                  to={`/auth/login?identifier=${duplicateNINBlocked}`}
                  className="bg-[#1AA260] hover:bg-[#158A52] text-white px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Sign in to existing account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateNINBlocked(null)
                    setNinInput('')
                  }}
                  className="text-xs text-[var(--gray-500)] hover:text-[var(--ink)] underline cursor-pointer"
                >
                  Enter different NIN
                </button>
              </div>
            </div>
          )}

          {ninError && !duplicateNINBlocked && (
            <div className="p-3 border border-rose-300 bg-rose-50 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{ninError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center justify-between">
              <span>
                11-digit NIN or 16-character virtual NIN (vNIN) *
              </span>
              <span className="text-[11px] text-[var(--gray-500)]">Masks after 3 digits</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={getDisplayNIN()}
                onChange={(e) => {
                  setDuplicateNINBlocked(null)
                  setNinError(null)
                  const raw = e.target.value.replace(/\s+/g, '')
                  setNinInput(raw)
                }}
                placeholder="Enter 11-digit NIN"
                maxLength={16}
                className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] font-mono text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowNIN(!showNIN)}
                className="absolute right-3.5 top-3.5 text-[var(--gray-500)] hover:text-[var(--ink)] cursor-pointer"
                title={showNIN ? 'Mask digits' : 'Show digits'}
                tabIndex={-1}
              >
                {showNIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="border border-[var(--gray-200)] bg-[var(--paper)] p-4 rounded-2xl text-xs text-[var(--gray-700)] leading-relaxed">
            <span className="font-bold text-[var(--ink)] block mb-1">Strict Privacy &amp; Protection:</span>
            Your National ID (NIN) is kept strictly confidential. Kaduna State services only receive your verified citizen profile, never your raw identification number.
          </div>

          {/* NIMC Fallback Option */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleProvisionalNIMC}
              className="text-[var(--gray-500)] hover:text-[#1AA260] underline transition-colors cursor-pointer"
            >
              NIMC service slow? Request provisional registration &rarr;
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[var(--gray-200)]">
            {onBackToSelection && (
              <button
                type="button"
                onClick={onBackToSelection}
                className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
            )}
            <button
              type="submit"
              disabled={isVerifyingNIN || Boolean(duplicateNINBlocked)}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full font-semibold text-xs sm:text-sm transition-all ml-auto cursor-pointer disabled:opacity-50"
            >
              {isVerifyingNIN ? 'Verifying with NIMC...' : 'Verify Identity \u00a0\u2192'}
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* ================================================================ */}
      {/* ================================================================ */}
      {/* STEP 1: Phone Security Challenge & Contact Information              */}
      {/* ================================================================ */}
      {step === 1 && nimcData && (
        <div className="bg-white border border-[var(--gray-200)] p-7 sm:p-9 rounded-[28px] space-y-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight mb-1">
              Identity Verification &amp; Contact Setup
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)]">
              Confirm your verified national identity record using your registered mobile phone.
            </p>
          </div>

          {/* Verified Identity Record (NIMC) */}
          <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--gray-200)] space-y-3">
            <div className="text-[#1AA260] font-semibold text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Identity Record (NIMC)</span>
              {isProvisionalNIMC && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold uppercase">
                  Provisional
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[var(--ink)] pt-1">
              <div>
                <span className="text-[var(--gray-500)] block text-[11px] font-semibold uppercase tracking-wider">
                  Legal Name
                </span>
                <span className="font-bold text-sm mt-0.5 block">{nimcData.legalName}</span>
              </div>
              <div>
                <span className="text-[var(--gray-500)] block text-[11px] font-semibold uppercase tracking-wider">
                  Gender
                </span>
                <span className="capitalize font-medium text-sm mt-0.5 block">{nimcData.gender}</span>
              </div>
              <div>
                <span className="text-[var(--gray-500)] block text-[11px] font-semibold uppercase tracking-wider">
                  Date of Birth
                </span>
                <span className="font-mono text-sm text-[var(--gray-500)] mt-0.5 block">••••-••-•• (Masked)</span>
              </div>
            </div>
          </div>

          {/* Phone Verification Challenge */}
          <div className="border-t border-[var(--gray-200)] pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)] tracking-tight">
                  Mobile Phone Verification
                </h3>
                <p className="text-xs text-[var(--gray-700)] mt-0.5">
                  Confirm possession of your registered mobile line to secure your account.
                </p>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-[#1AA260] border border-emerald-200 shrink-0 self-start sm:self-auto">
                SMS Verification
              </span>
            </div>

            {/* If NOT sent yet: Prominent Send Button with Masked Phone */}
            {!otpSent && !otpVerified && (
              <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-[var(--gray-700)]">
                  A 6-digit verification code will be sent to your registered phone:{' '}
                  <strong className="font-mono font-semibold text-[var(--ink)] tracking-wider">
                    {maskNIMCPhone(nimcRegisteredPhone || nimcData.registeredPhone)}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="bg-[#1AA260] hover:bg-[#158A52] text-white px-6 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Verification Code</span>
                </button>
              </div>
            )}

            {/* When Sent & Awaiting Code Entry */}
            {otpSent && !otpVerified && (
              <div className="space-y-3.5 animate-in fade-in">
                <p className="text-xs sm:text-sm text-[var(--gray-700)]">
                  Enter the 6-digit verification code sent to your phone{' '}
                  <strong className="font-mono font-semibold text-[var(--ink)]">
                    {maskNIMCPhone(nimcRegisteredPhone || nimcData.registeredPhone)}
                  </strong>:
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-48 px-4 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] font-mono text-center tracking-[0.3em] text-lg font-semibold focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpInput.length < 6}
                    className="bg-[#1AA260] hover:bg-[#158A52] text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Verify Code
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={resendCooldown > 0}
                    className="text-xs text-[var(--gray-500)] hover:text-[var(--ink)] disabled:opacity-50 underline px-2 py-1 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                {otpError && (
                  <div className="p-3 border border-rose-300 bg-rose-50 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[11px] text-[var(--gray-500)]">
                  <span>Validity: 5 minutes</span>
                  <span>&bull;</span>
                  <span>{otpAttemptsLeft} attempt(s) remaining</span>
                </div>
              </div>
            )}

            {/* Verification Confirmation */}
            {otpVerified && (
              <div className="border border-emerald-200 bg-emerald-50/60 p-4 rounded-2xl text-xs text-[var(--ink)] flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-[#1AA260] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#1AA260] text-sm">
                    Phone Verification Confirmed
                  </div>
                  <p className="text-[var(--gray-700)] mt-0.5 leading-relaxed">
                    Identity ownership confirmed. Please confirm your primary contact details below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Fields (ONLY SHOWN WHEN OTP IS VERIFIED) */}
          {otpVerified && (
            <div className="border-t border-[var(--gray-200)] pt-6 space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)] tracking-tight">
                  Primary Contact Channels
                </h3>
                <p className="text-xs text-[var(--gray-700)] mt-0.5">
                  Confirm your contact information for state revenue receipts and tax assessments.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center justify-between">
                    <span>
                      Primary Email Address *
                    </span>
                    <span className="text-[11px] text-[var(--gray-500)]">Editable</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className={`w-full px-4 py-3 border rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none ${
                      emailDuplicateError
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                        : 'border-[var(--gray-200)] focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10'
                    }`}
                    required
                  />
                  {emailDuplicateError && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                      <span>{emailDuplicateError}</span>
                    </p>
                  )}
                  {!emailDuplicateError && email !== initialEmail && (
                    <p className="text-[11.5px] text-amber-700 mt-1.5 leading-tight">
                      Notice: Email changed from initial record &mdash; confirmation message will be sent.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center justify-between">
                    <span>
                      Mobile Phone Number *
                    </span>
                    <span className="text-[11px] text-[var(--gray-500)]">Editable</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="e.g. +234 814 555 1212"
                    className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                    required
                  />
                  <span className="text-[11px] text-[var(--gray-500)] mt-1.5 block">
                    Pre-populated from your verified NIN record.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2">
            {!otpVerified && (
              <p className="text-xs text-[var(--gray-500)] text-right mb-3">
                Verify phone number above to proceed
              </p>
            )}
            <div className="flex justify-between items-center border-t border-[var(--gray-200)] pt-5">
              <button
                type="button"
                onClick={() => changeStep(0)}
                className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
              <button
                type="button"
                disabled={!otpVerified || Boolean(emailDuplicateError) || !email.trim() || !phone.trim()}
                onClick={() => changeStep(2)}
                className={`px-7 py-3 rounded-full font-semibold text-xs sm:text-sm transition-all ${
                  otpVerified && !emailDuplicateError && email.trim() && phone.trim()
                    ? 'bg-[#1AA260] hover:bg-[#158A52] text-white cursor-pointer'
                    : 'bg-[var(--gray-200)] text-[var(--gray-500)] opacity-50 cursor-not-allowed'
                }`}
              >
                Continue &nbsp;&rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 2: Location & Tax Jurisdiction                                */}
      {/* ================================================================ */}
      {step === 2 && (
        <div className="bg-white border border-[var(--gray-200)] rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Location &amp; Tax Jurisdiction
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              Your Local Government Area determines your assigned KADIRS revenue office for vehicle licensing, property taxes, and personal assessments.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Local Government Area (LGA) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 cursor-pointer"
              >
                {KADUNA_LGAS.map((lga) => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>
            </div>

            {/* Assigned Tax Office Highlight Card */}
            <div className="border border-emerald-200 bg-emerald-50/50 p-4 rounded-2xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-[#1AA260]">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase font-semibold text-[#1AA260] tracking-wider block">
                  Designated KADIRS Tax Revenue Office
                </span>
                <div className="text-sm font-bold text-[var(--ink)] mt-0.5">
                  {taxOffice}
                </div>
                <p className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">
                  Personal tax filings, vehicle licensing, and land assessments in {selectedLga} are managed through this office.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Residential Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Swimming Pool Road, Kabala Doki"
                className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!address.trim()}
              onClick={() => changeStep(3)}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Continue &nbsp;&rarr;
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 3: Security & 2-Step Verification                             */}
      {/* ================================================================ */}
      {step === 3 && (
        <div className="bg-white border border-[var(--gray-200)] rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Account Password &amp; 2-Step Verification
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              Create a strong password and choose how you would like to receive 2-step verification codes for sensitive state transactions.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Account Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[var(--gray-500)] hover:text-[var(--ink)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Validation Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                  isPasswordLongEnough
                    ? 'border-emerald-200 bg-emerald-50 text-[#1AA260]'
                    : 'border-[var(--gray-200)] bg-[var(--paper)] text-[var(--gray-500)]'
                }`}>
                  <span className="text-xs">{isPasswordLongEnough ? '✓' : '○'}</span>
                  <span>8+ characters</span>
                </div>
                <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                  hasUpper
                    ? 'border-emerald-200 bg-emerald-50 text-[#1AA260]'
                    : 'border-[var(--gray-200)] bg-[var(--paper)] text-[var(--gray-500)]'
                }`}>
                  <span className="text-xs">{hasUpper ? '✓' : '○'}</span>
                  <span>Uppercase</span>
                </div>
                <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                  hasLower
                    ? 'border-emerald-200 bg-emerald-50 text-[#1AA260]'
                    : 'border-[var(--gray-200)] bg-[var(--paper)] text-[var(--gray-500)]'
                }`}>
                  <span className="text-xs">{hasLower ? '✓' : '○'}</span>
                  <span>Lowercase</span>
                </div>
                <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                  hasNumber
                    ? 'border-emerald-200 bg-emerald-50 text-[#1AA260]'
                    : 'border-[var(--gray-200)] bg-[var(--paper)] text-[var(--gray-500)]'
                }`}>
                  <span className="text-xs">{hasNumber ? '✓' : '○'}</span>
                  <span>Number</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-2">
                Secondary Verification Method (2FA) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTwoFactorMethod('sms')}
                  className={`p-4 border rounded-2xl text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                    twoFactorMethod === 'sms'
                      ? 'border-[#1AA260] bg-emerald-50/40 ring-2 ring-[#1AA260]/20'
                      : 'border-[var(--gray-200)] bg-[var(--paper)] hover:bg-[var(--gray-100)]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    twoFactorMethod === 'sms' ? 'bg-[#1AA260] text-white' : 'bg-[var(--gray-200)] text-[var(--gray-500)]'
                  }`}>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--ink)]">SMS Verification Code</div>
                    <div className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">
                      Instant one-time codes sent to your verified mobile number ({phone || nimcRegisteredPhone || 'NIMC Phone'}).
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTwoFactorMethod('totp')}
                  className={`p-4 border rounded-2xl text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                    twoFactorMethod === 'totp'
                      ? 'border-[#1AA260] bg-emerald-50/40 ring-2 ring-[#1AA260]/20'
                      : 'border-[var(--gray-200)] bg-[var(--paper)] hover:bg-[var(--gray-100)]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    twoFactorMethod === 'totp' ? 'bg-[#1AA260] text-white' : 'bg-[var(--gray-200)] text-[var(--gray-500)]'
                  }`}>
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--ink)]">Authenticator App</div>
                    <div className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">
                      Works offline with Google Authenticator, Microsoft Authenticator, or Apple Keychain.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={() => changeStep(2)}
              className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!isPasswordValid}
              onClick={() => changeStep(4)}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Continue to Privacy Agreement &nbsp;&rarr;
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 4: Privacy & Consent Agreement                               */}
      {/* ================================================================ */}
      {step === 4 && (
        <div className="bg-white border border-[var(--gray-200)] rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1AA260] text-[11px] font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Statutory Data Protection</span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Privacy &amp; Consent Agreement
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              In compliance with the Nigeria Data Protection Act, please review and confirm the terms governing how your verified identity and tax data are handled.
            </p>
          </div>

          <div className="space-y-3.5 border-t border-b border-[var(--gray-200)] py-5">
            <label className="flex items-start gap-3.5 p-3.5 rounded-2xl hover:bg-[var(--gray-100)]/70 transition-colors cursor-pointer border border-transparent hover:border-[var(--gray-200)]">
              <input
                type="checkbox"
                checked={consentStorage}
                onChange={(e) => setConsentStorage(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#1AA260] focus:ring-[#1AA260] accent-[#1AA260] cursor-pointer shrink-0"
              />
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-[var(--ink)] block">
                  1. Secure Data Storage
                </span>
                <span className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed block">
                  I authorize KADIRS to securely store my verified profile and tax records within certified Nigerian data infrastructure.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3.5 p-3.5 rounded-2xl hover:bg-[var(--gray-100)]/70 transition-colors cursor-pointer border border-transparent hover:border-[var(--gray-200)]">
              <input
                type="checkbox"
                checked={consentSharing}
                onChange={(e) => setConsentSharing(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#1AA260] focus:ring-[#1AA260] accent-[#1AA260] cursor-pointer shrink-0"
              />
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-[var(--ink)] block">
                  2. Protected Agency Sharing
                </span>
                <span className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed block">
                  I authorize KADIRS to share verified credentials (name, contact, and tax office) with connected state portals to provide seamless public services, without ever disclosing my raw National Identity Number (NIN).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3.5 p-3.5 rounded-2xl hover:bg-[var(--gray-100)]/70 transition-colors cursor-pointer border border-transparent hover:border-[var(--gray-200)]">
              <input
                type="checkbox"
                checked={consentPolicy}
                onChange={(e) => setConsentPolicy(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#1AA260] focus:ring-[#1AA260] accent-[#1AA260] cursor-pointer shrink-0"
              />
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-[var(--ink)] block">
                  3. Privacy Rights &amp; Access Control
                </span>
                <span className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed block">
                  I understand I have full control over my records: I can view all connected services, revoke agency access permissions, or update my details at any time from my central dashboard.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => changeStep(3)}
              className="text-[var(--gray-500)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!consentStorage || !consentSharing || !consentPolicy}
              onClick={handleComplete}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-8 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <span>Complete Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

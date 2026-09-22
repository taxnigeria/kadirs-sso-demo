import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Send,
  ArrowRight,
  ShieldCheck
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
          className="bg-[var(--paper-raised)] border border-[var(--line)] p-7 sm:p-8 rounded-[var(--radius)] space-y-6"
          onSubmit={handleVerifyNIN}
        >
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-[var(--ink)] tracking-tight mb-1">
              National identity verification
            </h2>
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Your legal name, date of birth and gender are anchored to your national identity record (NIMC).
            </p>
          </div>

          {/* Hard Block on Duplicate NIN */}
          {duplicateNINBlocked && (
            <div className="border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-5 rounded-[var(--radius)] space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--danger)]">
                    Identity Record Already Registered (Duplicate Prohibited)
                  </h4>
                  <p className="text-xs text-[var(--ink)] mt-1 leading-relaxed">
                    National Identity Number (<span className="font-mono font-bold">{duplicateNINBlocked.slice(0, 3)}••••{duplicateNINBlocked.slice(-3)}</span>) is already linked to an existing authenticated citizen identity in the Kaduna State revenue registry.
                    Under NDPA 2023 regulations and KADIRS identity governance, duplicate identity registrations are strictly blocked.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-3">
                <Link
                  to={`/auth/login?identifier=${duplicateNINBlocked}`}
                  className="bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white px-4 py-2 rounded-[var(--radius)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
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
                  className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] underline cursor-pointer"
                >
                  Enter different NIN
                </button>
              </div>
            </div>
          )}

          {ninError && !duplicateNINBlocked && (
            <div className="p-3 border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] rounded-[var(--radius)] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{ninError}</span>
            </div>
          )}

          <div>
            <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium flex items-center justify-between">
              <span>
                11-digit NIN or 16-character virtual NIN (vNIN) <span className="text-[var(--danger)]">*</span>
              </span>
              <span className="text-[11px] text-[var(--ink-soft)]">Masks after 3 digits</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={getDisplayNIN()}
                onChange={(e) => {
                  setDuplicateNINBlocked(null)
                  setNinError(null)
                  // Capture raw input digits
                  const raw = e.target.value.replace(/\s+/g, '')
                  setNinInput(raw)
                }}
                placeholder="Enter 11-digit NIN"
                maxLength={16}
                className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] font-mono text-[14px] focus:outline-2 focus:outline-[var(--green)] pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNIN(!showNIN)}
                className="absolute right-3 top-2.5 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                title={showNIN ? 'Mask digits' : 'Show digits'}
                tabIndex={-1}
              >
                {showNIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="border border-[var(--line-soft)] bg-[var(--paper)] p-4 rounded-[var(--radius)] text-xs text-[var(--ink-soft)] leading-relaxed">
            <span className="font-medium text-[var(--ink)] block mb-1">Privacy Guarantee (NDPA 2023):</span>
            Your raw 11-digit NIN is column-level encrypted and strictly never shared with connected Tax Service Providers (TSPs). State services receive a pseudonymized citizen token.
          </div>

          {/* NIMC Fallback Option */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleProvisionalNIMC}
              className="text-[var(--ink-soft)] hover:text-[var(--green)] underline transition-colors cursor-pointer"
            >
              NIMC service slow? Request provisional registration &rarr;
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[var(--line-soft)]">
            {onBackToSelection && (
              <button
                type="button"
                onClick={onBackToSelection}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm px-3 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
            )}
            <button
              type="submit"
              disabled={isVerifyingNIN || Boolean(duplicateNINBlocked)}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-6 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors ml-auto cursor-pointer disabled:opacity-50"
            >
              {isVerifyingNIN ? 'Verifying with NIMC...' : 'Verify identity \u00a0\u2192'}
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* ================================================================ */}
      {/* STEP 1: Phone Security Challenge & Contact Information              */}
      {/* ================================================================ */}
      {step === 1 && nimcData && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-7 sm:p-8 rounded-[var(--radius)] space-y-6">
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-[var(--ink)] tracking-tight mb-1">
              Identity verification &amp; contact setup
            </h2>
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Confirm ownership of your national identity record via your registered mobile number.
            </p>
          </div>

          {/* Verified Identity Record (NIMC) */}
          <div className="space-y-3">
            <div className="text-[var(--green)] font-medium text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>✓ Verified identity record (NIMC)</span>
              {isProvisionalNIMC && (
                <span className="ml-2 px-2 py-0.5 rounded bg-[var(--gold)]/20 text-[var(--gold)] text-[10px] font-semibold uppercase">
                  Provisional (Background Sync Active)
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[var(--ink)]">
              <div>
                <span className="text-[var(--ink-soft)] block text-[11px] font-medium uppercase tracking-wider">
                  Legal name
                </span>
                <span className="font-medium text-sm mt-0.5 block">{nimcData.legalName}</span>
              </div>
              <div>
                <span className="text-[var(--ink-soft)] block text-[11px] font-medium uppercase tracking-wider">
                  Gender
                </span>
                <span className="capitalize font-medium text-sm mt-0.5 block">{nimcData.gender}</span>
              </div>
              <div>
                <span className="text-[var(--ink-soft)] block text-[11px] font-medium uppercase tracking-wider">
                  Date of birth
                </span>
                <span className="font-mono text-sm text-[var(--ink-soft)] mt-0.5 block">••••-••-•• (Masked)</span>
              </div>
            </div>
          </div>

          {/* Phone Verification Challenge */}
          <div className="border-t border-[var(--line-soft)] pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-[16px] font-semibold text-[var(--ink)] tracking-tight">
                  Phone verification challenge
                </h3>
                <p className="text-[13px] text-[var(--ink-soft)] mt-0.5">
                  Verify possession of your registered mobile line to authenticate your identity.
                </p>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink-soft)] shrink-0 self-start sm:self-auto border border-[var(--line)]">
                SMS verification
              </span>
            </div>

            {/* If NOT sent yet: Prominent Send Button with Masked Phone */}
            {!otpSent && !otpVerified && (
              <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[13px] text-[var(--ink-soft)]">
                  A 6-digit verification code will be sent to your registered phone:{' '}
                  <strong className="font-mono font-semibold text-[var(--ink)] tracking-wider">
                    {maskNIMCPhone(nimcRegisteredPhone || nimcData.registeredPhone)}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-5 py-2.5 rounded-[var(--radius)] font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send verification code</span>
                </button>
              </div>
            )}

            {/* When Sent & Awaiting Code Entry */}
            {otpSent && !otpVerified && (
              <div className="space-y-3.5 animate-in fade-in">
                <p className="text-[13px] text-[var(--ink-soft)]">
                  Enter the 6-digit verification code sent to your registered phone{' '}
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
                    className="w-48 px-4 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] font-mono text-center tracking-[0.3em] text-lg font-semibold focus:outline-2 focus:outline-[var(--green)]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpInput.length < 6}
                    className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-5 py-2.5 rounded-[var(--radius)] text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Verify Code
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={resendCooldown > 0}
                    className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-50 underline px-2 py-1 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend new code'}
                  </button>
                </div>

                {otpError && (
                  <div className="p-3 border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] rounded-[var(--radius)] text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[11px] text-[var(--ink-soft)]">
                  <span>Validity: 5 minutes</span>
                  <span>&bull;</span>
                  <span>{otpAttemptsLeft} attempts remaining</span>
                </div>
              </div>
            )}

            {/* Verification Confirmation */}
            {otpVerified && (
              <div className="border border-[var(--green)]/30 bg-[var(--green)]/5 p-4 rounded-[var(--radius)] text-xs text-[var(--ink)] flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-[var(--green)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--green)] text-[13.5px]">
                    ✓ Phone verification confirmed
                  </div>
                  <p className="text-[var(--ink-soft)] mt-0.5 leading-relaxed">
                    Identity ownership confirmed. Please review and confirm your primary contact details below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Fields (ONLY SHOWN WHEN OTP IS VERIFIED) */}
          {otpVerified && (
            <div className="border-t border-[var(--line-soft)] pt-6 space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-[16px] font-semibold text-[var(--ink)] tracking-tight">
                  Contact channels
                </h3>
                <p className="text-[13px] text-[var(--ink-soft)] mt-0.5">
                  Set your verified primary contact channels for state revenue receipts and official tax assessments.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Editable Email with Red Asterisk */}
                <div>
                  <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium flex items-center justify-between">
                    <span>
                      Primary email address <span className="text-[var(--danger)]">*</span>
                    </span>
                    <span className="text-[11px] text-[var(--ink-soft)]">Editable</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className={`w-full px-3.5 py-2.5 border rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14px] focus:outline-2 ${
                      emailDuplicateError
                        ? 'border-[var(--danger)] focus:outline-[var(--danger)]'
                        : 'border-[var(--line)] focus:outline-[var(--green)]'
                    }`}
                    required
                  />
                  {emailDuplicateError && (
                    <p className="text-xs text-[var(--danger)] font-medium mt-1.5 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{emailDuplicateError}</span>
                    </p>
                  )}
                  {!emailDuplicateError && email !== initialEmail && (
                    <p className="text-[11.5px] text-[var(--gold)] mt-1.5 leading-tight">
                      Notice: Email modified from initial record &mdash; 24-hr verification token will be dispatched upon registration.
                    </p>
                  )}
                </div>

                {/* Editable Phone with Red Asterisk */}
                <div>
                  <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium flex items-center justify-between">
                    <span>
                      Mobile phone number <span className="text-[var(--danger)]">*</span>
                    </span>
                    <span className="text-[11px] text-[var(--ink-soft)]">Editable</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="e.g. +234 814 555 1212"
                    className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14px] focus:outline-2 focus:outline-[var(--green)]"
                    required
                  />
                  <span className="text-[11px] text-[var(--ink-soft)] mt-1.5 block">
                    Pre-populated from your verified NIN record; modify if you prefer an alternate active mobile line.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2">
            {!otpVerified && (
              <p className="text-xs text-[var(--ink-soft)] text-right mb-3">
                Verify phone number above to unlock contact setup
              </p>
            )}
            <div className="flex justify-between items-center border-t border-[var(--line-soft)] pt-5">
              <button
                type="button"
                onClick={() => changeStep(0)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm px-3 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
              <button
                type="button"
                disabled={!otpVerified || Boolean(emailDuplicateError) || !email.trim() || !phone.trim()}
                onClick={() => changeStep(2)}
                className={`px-6 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors ${
                  otpVerified && !emailDuplicateError && email.trim() && phone.trim()
                    ? 'bg-[var(--green)] hover:bg-[var(--green-deep)] text-white shadow-xs cursor-pointer'
                    : 'bg-[var(--line)] text-[var(--ink-soft)] opacity-50 cursor-not-allowed'
                }`}
              >
                Continue &nbsp;&rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 2: Residential Address & Tax Jurisdiction                     */}
      {/* ================================================================ */}
      {step === 2 && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-7 sm:p-8 rounded-[var(--radius)] space-y-6">
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-[var(--ink)] tracking-tight mb-1">
              Residential address &amp; tax jurisdiction
            </h2>
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Your Local Government Area determines your assigned KADIRS tax revenue office.
            </p>
          </div>

          <div>
            <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
              Local Government Area (LGA) <span className="text-[var(--danger)]">*</span>
            </label>
            <select
              value={selectedLga}
              onChange={(e) => setSelectedLga(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14px] focus:outline-2 focus:outline-[var(--green)]"
            >
              {KADUNA_LGAS.map((lga) => (
                <option key={lga} value={lga}>{lga}</option>
              ))}
            </select>
          </div>

          {/* Assigned Tax Office Definition Block */}
          <div className="border-t border-[var(--line-soft)] pt-4 pb-1 text-xs space-y-1">
            <span className="text-[11px] uppercase font-medium text-[var(--ink-soft)] tracking-wider block">
              Assigned KADIRS tax office
            </span>
            <div className="text-[15px] font-semibold text-[var(--ink)]">
              {taxOffice}
            </div>
            <p className="text-[var(--ink-soft)] text-[12.5px]">
              Vehicle licensing, personal tax assessments, and land rates for this LGA route through this office.
            </p>
          </div>

          <div>
            <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
              Residential street address <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 14 Swimming Pool Road, Kabala Doki"
              className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14px] focus:outline-2 focus:outline-[var(--green)]"
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[var(--line-soft)]">
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm px-3 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              onClick={() => changeStep(3)}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-6 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors cursor-pointer"
            >
              Continue &nbsp;&rarr;
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 3: Password & Two-Factor Authentication                       */}
      {/* ================================================================ */}
      {step === 3 && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-7 sm:p-8 rounded-[var(--radius)] space-y-6">
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-[var(--ink)] tracking-tight mb-1">
              Password &amp; two-factor authentication
            </h2>
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Passwords are encrypted using Argon2id. 2FA is required for high-security tax transactions.
            </p>
          </div>

          <div>
            <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
              Account password <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create secure password"
                className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14px] focus:outline-2 focus:outline-[var(--green)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Validation Checklist */}
            <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11.5px]">
              <span className={isPasswordLongEnough ? 'text-[var(--green)] font-medium' : 'text-[var(--ink-soft)]'}>
                {isPasswordLongEnough ? '✓' : '○'} At least 8 characters
              </span>
              <span className={hasUpper ? 'text-[var(--green)] font-medium' : 'text-[var(--ink-soft)]'}>
                {hasUpper ? '✓' : '○'} Uppercase letter
              </span>
              <span className={hasLower ? 'text-[var(--green)] font-medium' : 'text-[var(--ink-soft)]'}>
                {hasLower ? '✓' : '○'} Lowercase letter
              </span>
              <span className={hasNumber ? 'text-[var(--green)] font-medium' : 'text-[var(--ink-soft)]'}>
                {hasNumber ? '✓' : '○'} Number
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] text-[var(--ink-soft)] mb-2 font-medium">
              Secondary authentication (2FA method) <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div
                onClick={() => setTwoFactorMethod('sms')}
                className={`p-3.5 border rounded-[var(--radius)] cursor-pointer transition-colors ${
                  twoFactorMethod === 'sms'
                    ? 'border-[var(--green)] bg-[var(--paper)] font-medium ring-1 ring-[var(--green)]'
                    : 'border-[var(--line)] hover:bg-[var(--line-soft)]'
                }`}
              >
                <div className="text-[14px] font-semibold text-[var(--ink)]">SMS verification</div>
                <div className="text-[var(--ink-soft)] mt-0.5">Verification code sent to verified phone ({phone})</div>
              </div>

              <div
                onClick={() => setTwoFactorMethod('totp')}
                className={`p-3.5 border rounded-[var(--radius)] cursor-pointer transition-colors ${
                  twoFactorMethod === 'totp'
                    ? 'border-[var(--green)] bg-[var(--paper)] font-medium ring-1 ring-[var(--green)]'
                    : 'border-[var(--line)] hover:bg-[var(--line-soft)]'
                }`}
              >
                <div className="text-[14px] font-semibold text-[var(--ink)]">Authenticator App</div>
                <div className="text-[var(--ink-soft)] mt-0.5">Google Authenticator / Microsoft Auth</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[var(--line-soft)]">
            <button
              type="button"
              onClick={() => changeStep(2)}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm px-3 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!isPasswordValid}
              onClick={() => changeStep(4)}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-6 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Continue to Consent &nbsp;&rarr;
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 4: NDPA 2023 Statutory Consent (Event 1)                      */}
      {/* ================================================================ */}
      {step === 4 && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-7 sm:p-8 rounded-[var(--radius)] space-y-6">
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-[var(--ink)] tracking-tight mb-1">
              NDPA 2023 statutory consent (Event 1)
            </h2>
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Nigeria Data Protection Act compliance. Each consent confirmation is immutably logged with timestamp, IP, and policy version.
            </p>
          </div>

          <div className="space-y-4 border-t border-b border-[var(--line-soft)] py-5 text-xs text-[var(--ink)]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentStorage}
                onChange={(e) => setConsentStorage(e.target.checked)}
                className="mt-0.5 accent-[var(--green)]"
              />
              <div>
                <strong className="block text-sm font-medium">
                  1. Data Storage &amp; Residency <span className="text-[var(--danger)]">*</span>
                </strong>
                <span className="text-[var(--ink-soft)]">
                  I consent to KADIRS storing my identity record strictly on Nigerian Tier-III infrastructure (NITDA 2025 compliant).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentSharing}
                onChange={(e) => setConsentSharing(e.target.checked)}
                className="mt-0.5 accent-[var(--green)]"
              />
              <div>
                <strong className="block text-sm font-medium">
                  2. Scoped Token Sharing (No Raw NIN) <span className="text-[var(--danger)]">*</span>
                </strong>
                <span className="text-[var(--ink-soft)]">
                  I consent to sharing verified name, contact and tax office with connected TSPs via scoped tokens without raw NIN disclosure.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentPolicy}
                onChange={(e) => setConsentPolicy(e.target.checked)}
                className="mt-0.5 accent-[var(--green)]"
              />
              <div>
                <strong className="block text-sm font-medium">
                  3. Privacy Policy &amp; Right to Erasure <span className="text-[var(--danger)]">*</span>
                </strong>
                <span className="text-[var(--ink-soft)]">
                  I acknowledge my right to revoke consent per TSP or request account deletion with a 30-day cooling-off period.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => changeStep(3)}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm px-3 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!consentStorage || !consentSharing || !consentPolicy}
              onClick={handleComplete}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-6 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              Complete registration &nbsp;&rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

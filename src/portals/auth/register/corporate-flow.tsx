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
  Info
} from 'lucide-react'
import { lookupCAC, type CACLookupResponse } from '@/engine/kyc-simulator'
import { useAuthEngine, checkRCRegistered, checkEmailRegistered } from '@/engine/auth-engine'
import { useEventLogger } from '@/engine/event-logger'
import { sendSimulatedOTP, verifySimulatedOTP } from '@/engine/otp-simulator'
import { KADUNA_LGAS, LGA_TAX_OFFICES } from '@/data/lga-tax-offices'
import type { CorporateEntity } from '@/types'

interface CorporateFlowProps {
  onBackToSelection: () => void
  onStepChange?: (step: number) => void
}

export function CorporateFlow({ onBackToSelection, onStepChange }: CorporateFlowProps) {
  const navigate = useNavigate()
  const registerCorporate = useAuthEngine((s) => s.registerCorporate)
  const corporateEntities = useAuthEngine((s) => s.corporateEntities)
  const findRepresentativeByNIN = useAuthEngine((s) => s.findRepresentativeByNIN)
  const logConsent = useEventLogger((s) => s.logConsent)
  const logEvent = useEventLogger((s) => s.logEvent)

  const [step, setStepState] = useState<0 | 1 | 2>(0)

  const changeStep = (next: 0 | 1 | 2) => {
    setStepState(next)
    onStepChange?.(next)
  }

  // ==========================================
  // Step 0: CAC RC Lookup
  // ==========================================
  const [rcNumber, setRcNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [cacData, setCacData] = useState<CACLookupResponse | null>(null)
  const [rcError, setRcError] = useState<string | null>(null)
  const [duplicateRCBlocked, setDuplicateRCBlocked] = useState<{ rc: string; companyName?: string } | null>(null)

  // ==========================================
  // Step 1: Corporate Profile & Operational Details
  // ==========================================
  const [corporateEmail, setCorporateEmail] = useState('')
  const [corporatePhone, setCorporatePhone] = useState('')
  const [staffCount, setStaffCount] = useState('11 - 50 employees')
  const [selectedLga, setSelectedLga] = useState('Kaduna North')
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const [emailDuplicateError, setEmailDuplicateError] = useState<string | null>(null)

  // ==========================================
  // Step 2: Signatory, Separate Corporate Password & OTP
  // ==========================================
  const [repName, setRepName] = useState('')
  const [repNIN, setRepNIN] = useState('')
  const [showNIN, setShowNIN] = useState(false)
  const [repRole, setRepRole] = useState('')
  const [isAuthorizedChecked, setIsAuthorizedChecked] = useState(false)
  const [internalNINMatch, setInternalNINMatch] = useState<{ found: boolean; name?: string; email?: string } | null>(null)

  // Separate corporate password
  const [corporatePassword, setCorporatePassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Corporate OTP challenge
  const [otpSent, setOtpSent] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Resend cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Step 0: Lookup RC Number with duplicate check
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setRcError(null)
    setDuplicateRCBlocked(null)
    const clean = rcNumber.trim().toUpperCase()

    if (!clean) {
      setRcError('Please enter a valid CAC Registration Number.')
      return
    }

    // Duplicate RC Check
    const dupCheck = checkRCRegistered(clean, corporateEntities)
    if (dupCheck.registered) {
      setDuplicateRCBlocked({ rc: clean, companyName: dupCheck.companyName })
      return
    }

    try {
      setIsSearching(true)
      const res = await lookupCAC(clean)

      // Validate CAC Active status requirement
      if (res.status !== 'active') {
        setRcError(
          `CAC Status Check Failed: Entity status is "${res.status}". Only active companies in good standing with CAC may register for Kaduna State corporate revenue services.`
        )
        return
      }

      setCacData(res)

      // Pre-fill default contact details from CAC record
      const defaultEmail = `tax@${res.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.ng`
      setCorporateEmail(defaultEmail)
      setCorporatePhone('+234 812 987 6543')

      changeStep(1)
    } catch (err: unknown) {
      setRcError(err instanceof Error ? err.message : 'CAC registry query failed.')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle corporate email change: check duplicates and personal citizen overlap
  const handleEmailChange = (val: string) => {
    setCorporateEmail(val)
    if (!val.trim()) {
      setEmailDuplicateError(null)
      setEmailWarning(null)
      return
    }

    const check = checkEmailRegistered(val)
    if (check.registered) {
      if (check.isPersonal) {
        // Matches personal citizen email -> strong warning (not hard block; decision logged)
        setEmailDuplicateError(null)
        setEmailWarning(
          `Advisory Notice: "${val}" is currently registered as a personal citizen account (${check.ownerName || 'Citizen'}). It is strongly recommended to use a dedicated corporate email (e.g. tax@company.ng) to separate personal and company tax liabilities. Proceeding will be recorded in the KADIRS audit trail.`
        )
      } else {
        // Matches another corporate entity -> hard block
        setEmailDuplicateError(
          `Hard Block: This email is already registered to another corporate entity (${check.ownerName || 'Corporate Entity'}). Duplicate corporate emails are prohibited.`
        )
        setEmailWarning(null)
      }
    } else {
      setEmailDuplicateError(null)
      setEmailWarning(null)
    }
  }

  // Step 1 Submission: Advance to Representative & Password
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (emailDuplicateError) return

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

  // Real-time Representative NIN Check
  const handleNINChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '')
    setRepNIN(cleanDigits)

    if (cleanDigits.length === 11) {
      const match = findRepresentativeByNIN(cleanDigits)
      setInternalNINMatch(match)
      if (match.found && match.name) {
        setRepName(match.name)
      }
    } else {
      setInternalNINMatch(null)
    }
  }

  // Send Corporate OTP to corporate phone
  const handleSendCorpOTP = () => {
    if (!corporatePhone.trim()) {
      setOtpError('Please provide an official corporate phone number.')
      return
    }
    setOtpError(null)
    sendSimulatedOTP(corporatePhone, 'termii_sms_dnd')
    setOtpSent(true)
    setOtpInput('')
    setResendCooldown(30)
  }

  // Verify Corporate OTP
  const handleVerifyCorpOTP = () => {
    setOtpError(null)
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      setOtpError('Please enter the complete 6-digit corporate verification code.')
      return
    }

    const res = verifySimulatedOTP(otpInput)
    if (res.valid) {
      setOtpVerified(true)
      setOtpError(null)
    } else {
      setOtpError(res.message)
    }
  }

  // Password validation
  const isPasswordLongEnough = corporatePassword.length >= 8
  const hasUpper = /[A-Z]/.test(corporatePassword)
  const hasLower = /[a-z]/.test(corporatePassword)
  const hasNumber = /[0-9]/.test(corporatePassword)
  const isPasswordValid = isPasswordLongEnough && hasUpper && hasLower && hasNumber

  // Final Registration Finish
  const handleFinish = () => {
    if (!cacData || !otpVerified || !isAuthorizedChecked || !isPasswordValid) return

    const newCorp: CorporateEntity = {
      rcNumber: cacData.rcNumber,
      companyName: cacData.companyName,
      tin: cacData.tin,
      status: cacData.status,
      industry: cacData.industry,
      directors: cacData.directors,
      representatives: [`CIT-REP-${repNIN.slice(-5) || Date.now().toString(36).toUpperCase()}`]
    }

    registerCorporate(newCorp, repNIN)

    logConsent({
      citizenId: repNIN || cacData.rcNumber,
      type: 'registration',
      policyVersion: 'v2.0-2024',
      granted: true,
      ipAddress: '102.89.12.88',
      deviceInfo: navigator.userAgent,
      consentedFields: ['rcNumber', 'companyName', 'tin', 'directors', 'corporateEmail', 'corporatePhone', 'staffCount', 'lga']
    })

    navigate('/paykaduna')
  }

  const assignedCorporateTaxOffice = LGA_TAX_OFFICES[selectedLga] || 'Kaduna Central Tax Office'

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* STEP 0: CAC RC Lookup & Duplicate Verification                    */}
      {/* ================================================================ */}
      {step === 0 && (
        <form
          className="bg-[var(--paper-raised)] border border-[var(--line)] p-8 sm:p-9 rounded-[var(--radius)] space-y-6"
          onSubmit={handleLookup}
        >
          <div>
            <h2 className="font-semibold text-[22px] tracking-tight text-[var(--ink)] mb-1">
              Corporate Affairs Commission (CAC) verification
            </h2>
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Enter your registered corporate number to look up active commercial registry records.
            </p>
          </div>

          {/* Hard Block on Duplicate RC Number */}
          {duplicateRCBlocked && (
            <div className="border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-5 rounded-[var(--radius)] space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-[var(--danger)]">
                    Corporate Entity Already Registered (Duplicate Prohibited)
                  </h4>
                  <p className="text-xs text-[var(--ink)] mt-1 leading-relaxed">
                    Corporate registration <span className="font-mono font-bold">{duplicateRCBlocked.rc}</span> ({duplicateRCBlocked.companyName || 'Registered Enterprise'}) is already an active corporate entity on KADIRS Auth 2.0.
                    Under Kaduna State tax administration regulations, dual registration of corporate entities is prohibited.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-3">
                <Link
                  to={`/auth/login?identifier=${duplicateRCBlocked.rc}&type=corporate`}
                  className="bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white px-4 py-2 rounded-[var(--radius)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Proceed to corporate sign in</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateRCBlocked(null)
                    setRcNumber('')
                  }}
                  className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] underline cursor-pointer"
                >
                  Enter different RC number
                </button>
              </div>
            </div>
          )}

          {rcError && !duplicateRCBlocked && (
            <div className="p-3.5 border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] rounded-[var(--radius)] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{rcError}</span>
            </div>
          )}

          <div>
            <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
              CAC RC Number (e.g. RC-1849204 or BN-123456) <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              value={rcNumber}
              onChange={(e) => {
                setDuplicateRCBlocked(null)
                setRcError(null)
                setRcNumber(e.target.value)
              }}
              placeholder="e.g. RC-1849204"
              className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] font-mono text-[14.5px] uppercase focus:outline-2 focus:outline-[var(--green)]"
              required
            />
          </div>

          <div className="border border-[var(--line-soft)] bg-[var(--paper)] p-4 rounded-[var(--radius)] text-xs text-[var(--ink-soft)] leading-relaxed">
            <span className="font-medium text-[var(--ink)] block mb-1">CAC Interoperability (Registry Gateway):</span>
            Your corporate registration number triggers real-time verification against the Federal Corporate Affairs Commission database. Only active legal entities in good standing are authorized.
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-[var(--line-soft)]">
            <button
              type="button"
              onClick={onBackToSelection}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm px-3 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="submit"
              disabled={isSearching || Boolean(duplicateRCBlocked)}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-6 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors ml-auto cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSearching ? 'Querying CAC Registry...' : 'Lookup business \u00a0\u2192'}
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* STEP 1: Locked CAC Data & Operational Profile (Staff, LGA, Email)   */}
      {/* ================================================================ */}
      {step === 1 && cacData && (
        <form
          className="bg-[var(--paper-raised)] border border-[var(--line)] p-8 sm:p-9 rounded-[var(--radius)] space-y-6"
          onSubmit={handleStep1Submit}
        >
          <div>
            <h2 className="font-semibold text-[22px] tracking-tight text-[var(--ink)] mb-1">
              Corporate profile &amp; tax jurisdiction
            </h2>
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Verify your official CAC registry data and establish corporate operational parameters.
            </p>
          </div>

          {/* Verified CAC Data - Clean read-only presentation without nested card borders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--green)]">
                <CheckCircle2 className="w-4 h-4" />
                ✓ CAC registration active
              </span>
              <span className="text-[11px] text-[var(--ink-soft)] font-mono">
                Official Registry Record
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-3.5 border-y border-[var(--line-soft)]">
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-medium text-[var(--ink-soft)] mb-1">
                  Company Name
                </span>
                <span className="text-[13.5px] font-semibold text-[var(--ink)] block leading-snug">
                  {cacData.companyName}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-medium text-[var(--ink-soft)] mb-1">
                  RC / TIN
                </span>
                <span className="text-[13.5px] font-mono font-medium text-[var(--ink)] block">
                  {cacData.rcNumber} &middot; {cacData.tin}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-medium text-[var(--ink-soft)] mb-1">
                  Status / Type
                </span>
                <span className="text-[13.5px] capitalize font-medium text-[var(--ink)] block">
                  <span className="text-[var(--green)] font-semibold">{cacData.status}</span> &middot; {cacData.industry}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-medium text-[var(--ink-soft)] mb-1">
                  Registered Directors
                </span>
                <span className="text-[12.5px] text-[var(--ink)] block leading-snug">
                  {cacData.directors.join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Fields: Staff Count, Jurisdiction & Assigned Tax Office */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
                Operational staff count <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                value={staffCount}
                onChange={(e) => setStaffCount(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14px] focus:outline-2 focus:outline-[var(--green)]"
              >
                <option value="1 - 10 employees">1 - 10 employees (Micro enterprise)</option>
                <option value="11 - 50 employees">11 - 50 employees (Small enterprise)</option>
                <option value="51 - 250 employees">51 - 250 employees (Medium enterprise)</option>
                <option value="250+ employees">250+ employees (Large enterprise)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
                Business LGA <span className="text-[var(--danger)]">*</span>
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

            <div>
              <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
                Assigned corporate tax office
              </label>
              <input
                value={assignedCorporateTaxOffice}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--line-soft)]/50 text-[var(--ink-soft)] text-[13.5px] cursor-not-allowed select-none font-medium"
              />
            </div>
          </div>

          {/* Contact Fields: Corporate Email & Phone */}
          <div className="space-y-4 pt-5 border-t border-[var(--line-soft)]">
            <h3 className="font-semibold text-[15.5px] tracking-tight text-[var(--ink)]">
              Official Corporate Contact Channels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Corporate Email */}
              <div>
                <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
                  Corporate official email <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="email"
                  value={corporateEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. tax@company.ng"
                  className={`w-full px-3.5 py-2.5 border rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-2 ${
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
                {emailWarning && (
                  <div className="p-3 mt-2 border border-[var(--gold)]/40 bg-[var(--gold)]/10 rounded-[var(--radius)] text-xs text-[var(--ink)] flex items-start gap-2">
                    <Info className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{emailWarning}</span>
                  </div>
                )}
              </div>

              {/* Corporate Phone */}
              <div>
                <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
                  Corporate official phone <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="tel"
                  value={corporatePhone}
                  onChange={(e) => setCorporatePhone(e.target.value)}
                  placeholder="e.g. +234 812 987 6543"
                  className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-2 focus:outline-[var(--green)]"
                  required
                />
                <span className="text-[11px] text-[var(--ink-soft)] mt-1.5 block">
                  A verification code will be sent to this phone.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-[var(--line-soft)]">
            <button
              type="button"
              onClick={() => changeStep(0)}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm px-3 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="submit"
              disabled={Boolean(emailDuplicateError)}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-6 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              Continue to Signatory &nbsp;&rarr;
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* STEP 2: Representative Signatory, Separate Password & OTP        */}
      {/* ================================================================ */}
      {step === 2 && cacData && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-8 sm:p-9 rounded-[var(--radius)] space-y-6">
          <div>
            <h2 className="font-semibold text-[22px] tracking-tight text-[var(--ink)] mb-1">
              Authorised representative &amp; credentials
            </h2>
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Designate an authorized human representative and establish a separate corporate login password.
            </p>
          </div>

          {/* Representative Identity Lookup */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[15.5px] tracking-tight text-[var(--ink)]">
              Authorized Representative Signatory
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
                  Representative personal NIN (Hidden) <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNIN ? 'text' : 'password'}
                    value={repNIN}
                    onChange={(e) => handleNINChange(e.target.value)}
                    placeholder="Enter 11-digit personal NIN"
                    maxLength={11}
                    className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] font-mono text-[14.5px] focus:outline-2 focus:outline-[var(--green)] pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNIN(!showNIN)}
                    className="absolute right-3 top-2.5 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
                  Representative full legal name <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="Enter authorized representative name"
                  className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-2 focus:outline-[var(--green)]"
                  required
                />
              </div>
            </div>

            {/* Internal check feedback */}
            {internalNINMatch?.found && (
              <div className="border border-[var(--green)]/40 bg-[var(--green)]/10 p-3.5 rounded-[var(--radius)] text-xs text-[var(--ink)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--green)] shrink-0" />
                <span>
                  ✓ Existing Citizen Account Found: <strong className="text-[var(--green)]">{internalNINMatch.name}</strong> &middot; Pre-linked as Authorised Signatory.
                </span>
              </div>
            )}

            <div>
              <label className="block text-[12.5px] text-[var(--ink-soft)] mb-1.5 font-medium">
                Official designation / corporate capacity <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                value={repRole}
                onChange={(e) => setRepRole(e.target.value)}
                placeholder="e.g. Managing Director / Principal Partner"
                className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-2 focus:outline-[var(--green)]"
                required
              />
            </div>

            {/* Mandatory Authorised Representative Declaration Checkbox */}
            <label className="flex items-start gap-3 p-3.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isAuthorizedChecked}
                onChange={(e) => setIsAuthorizedChecked(e.target.checked)}
                className="mt-0.5 accent-[var(--green)] cursor-pointer"
              />
              <span className="text-[var(--ink)] leading-relaxed">
                <strong>
                  I declare under penalty of perjury <span className="text-[var(--danger)]">*</span>
                </strong>{' '}
                that I am the authorized representative / director legally designated to manage tax and statutory revenue affairs for <strong>{cacData.companyName}</strong> with the Kaduna State Internal Revenue Service.
              </span>
            </label>
          </div>

          {/* Separate Corporate Password */}
          <div className="space-y-3 pt-5 border-t border-[var(--line-soft)]">
            <h3 className="font-semibold text-[15.5px] tracking-tight text-[var(--ink)]">
              Corporate Login Password <span className="text-[var(--danger)]">*</span>
            </h3>
            <p className="text-xs text-[var(--ink-soft)]">
              This credential is strictly for managing <strong>{cacData.companyName}</strong> and remains isolated from any personal citizen accounts.
            </p>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={corporatePassword}
                onChange={(e) => setCorporatePassword(e.target.value)}
                placeholder="Create corporate access password"
                className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-2 focus:outline-[var(--green)] pr-10"
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

            <div className="grid grid-cols-2 gap-2 text-[11px]">
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

          {/* Corporate Phone Verification Challenge */}
          <div className="space-y-4 pt-5 border-t border-[var(--line-soft)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[15.5px] tracking-tight text-[var(--ink)]">
                  Corporate Phone Verification
                </h3>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Confirm ownership of this corporate filing via verification code sent to <span className="font-mono font-medium text-[var(--ink)]">{corporatePhone}</span>.
                </p>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius)] bg-[var(--line-soft)] text-[var(--ink-soft)] shrink-0 self-start sm:self-auto border border-[var(--line)]">
                SMS verification
              </span>
            </div>

            {!otpSent && !otpVerified && (
              <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--paper)] p-4 rounded-[var(--radius)] border border-[var(--line-soft)]">
                <p className="text-xs text-[var(--ink-soft)]">
                  Dispatch verification code to the registered corporate phone number.
                </p>
                <button
                  type="button"
                  onClick={handleSendCorpOTP}
                  className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-5 py-2.5 rounded-[var(--radius)] font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send verification code</span>
                </button>
              </div>
            )}

            {otpSent && !otpVerified && (
              <div className="space-y-3.5 animate-in fade-in bg-[var(--paper)] p-4 rounded-[var(--radius)] border border-[var(--line-soft)]">
                <p className="text-xs text-[var(--ink-soft)]">
                  Enter the 6-digit verification code sent to <strong className="text-[var(--ink)]">{corporatePhone}</strong>:
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-44 px-4 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper-raised)] text-[var(--ink)] font-mono text-center tracking-[0.3em] text-lg font-semibold focus:outline-2 focus:outline-[var(--green)]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCorpOTP}
                    disabled={otpInput.length < 6}
                    className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-5 py-2.5 rounded-[var(--radius)] text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Verify Code
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCorpOTP}
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
              </div>
            )}

            {otpVerified && (
              <div className="border border-[var(--green)]/40 bg-[var(--green)]/10 p-4 rounded-[var(--radius)] text-xs text-[var(--ink)] flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-[var(--green)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--green)] text-[13.5px]">
                    ✓ Corporate authorization confirmed
                  </div>
                  <p className="text-[var(--ink-soft)] mt-0.5 leading-relaxed">
                    Official corporate telephone channel validated. Entity <code className="font-mono font-medium text-[var(--ink)]">{cacData.companyName}</code> is authorized for state platform activation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-5 border-t border-[var(--line-soft)]">
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm px-3 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!otpVerified || !isAuthorizedChecked || !isPasswordValid || !repName.trim() || repNIN.length !== 11}
              onClick={handleFinish}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-7 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              Activate Corporate Account &nbsp;&rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

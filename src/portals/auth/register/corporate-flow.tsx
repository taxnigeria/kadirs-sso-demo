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
  Info,
  MapPin
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
          className="bg-white shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200"
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

          {/* Quick-Fill Evaluator Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-[var(--gray-500)]">Quick demo fill:</span>
            <button
              type="button"
              onClick={() => {
                setDuplicateRCBlocked(null)
                setRcError(null)
                setRcNumber('RC-1849204')
              }}
              className="text-xs px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#1AA260] border border-emerald-200 transition-colors font-mono font-medium cursor-pointer"
            >
              RC-1849204 (Arewa Textiles)
            </button>
            <button
              type="button"
              onClick={() => {
                setDuplicateRCBlocked(null)
                setRcError(null)
                setRcNumber('RC-9021844')
              }}
              className="text-xs px-3 py-1 rounded-full bg-[var(--paper)] hover:bg-[var(--gray-100)] text-[var(--ink)] border border-[var(--gray-200)] transition-colors font-mono font-medium cursor-pointer"
            >
              RC-9021844 (New Business)
            </button>
          </div>

          {/* Hard Block on Duplicate RC Number */}
          {duplicateRCBlocked && (
            <div className="border border-rose-300 bg-rose-50/80 p-5 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-rose-900">
                    Corporate Entity Already Registered
                  </h4>
                  <p className="text-xs text-[var(--gray-700)] mt-1 leading-relaxed">
                    Corporate registration <span className="font-mono font-bold text-rose-800">{duplicateRCBlocked.rc}</span> ({duplicateRCBlocked.companyName || 'Registered Enterprise'}) is already an active corporate profile on Kaduna State services. Under state revenue rules, duplicate corporate profiles are not permitted.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-3">
                <Link
                  to={`/auth/login?identifier=${duplicateRCBlocked.rc}&type=corporate`}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Proceed to Corporate Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateRCBlocked(null)
                    setRcNumber('')
                  }}
                  className="text-xs text-[var(--gray-500)] hover:text-[var(--ink)] underline cursor-pointer"
                >
                  Enter different RC number
                </button>
              </div>
            </div>
          )}

          {rcError && !duplicateRCBlocked && (
            <div className="p-4 border border-rose-300 bg-rose-50 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
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
              className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] font-mono text-base uppercase focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 tracking-wider"
              required
            />
          </div>

          <div className="border border-emerald-200 bg-emerald-50/50 p-4 rounded-2xl text-xs text-[var(--gray-700)] leading-relaxed flex items-start gap-3">
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
      {/* STEP 1: Locked CAC Data & Operational Profile (Staff, LGA, Email)   */}
      {/* ================================================================ */}
      {step === 1 && cacData && (
        <form
          className="bg-white shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200"
          onSubmit={handleStep1Submit}
        >
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Corporate Profile &amp; Jurisdiction
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              Confirm your official CAC registration details and establish corporate operational parameters for Kaduna State.
            </p>
          </div>

          {/* Verified CAC Data Card */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1AA260]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified CAC Registry Record</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--gray-500)] uppercase tracking-wider">
                Active Entity
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-emerald-200/60">
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] mb-1">
                  Registered Name
                </span>
                <span className="text-sm font-bold text-[var(--ink)] block leading-snug">
                  {cacData.companyName}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] mb-1">
                  RC / State TIN
                </span>
                <span className="text-sm font-mono font-medium text-[var(--ink)] block">
                  {cacData.rcNumber} &middot; {cacData.tin}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] mb-1">
                  Industry &amp; Status
                </span>
                <span className="text-sm capitalize font-medium text-[var(--ink)] block">
                  <span className="text-[#1AA260] font-semibold">{cacData.status}</span> &middot; {cacData.industry}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] mb-1">
                  Registered Directors
                </span>
                <span className="text-xs text-[var(--gray-700)] block leading-snug">
                  {cacData.directors.join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Fields: Staff Count, Jurisdiction & Assigned Tax Office */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Staff Size Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={staffCount}
                onChange={(e) => setStaffCount(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 cursor-pointer"
              >
                <option value="1 - 10 employees">1 - 10 employees (Micro enterprise)</option>
                <option value="11 - 50 employees">11 - 50 employees (Small enterprise)</option>
                <option value="51 - 250 employees">51 - 250 employees (Medium enterprise)</option>
                <option value="250+ employees">250+ employees (Large enterprise)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Principal Business LGA <span className="text-rose-500">*</span>
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
          </div>

          {/* Assigned Corporate Tax Office Highlight Card */}
          <div className="border border-emerald-200 bg-emerald-50/50 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-[#1AA260]">
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

          {/* Contact Fields: Corporate Email & Phone */}
          <div className="space-y-4 pt-2 border-t border-[var(--gray-200)]">
            <h3 className="font-display font-bold text-base text-[var(--ink)] tracking-tight">
              Official Corporate Contact Channels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Corporate Email */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  Corporate Official Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={corporateEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. tax@company.ng"
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
                {emailWarning && (
                  <div className="p-3 mt-2 border border-amber-200 bg-amber-50 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{emailWarning}</span>
                  </div>
                )}
              </div>

              {/* Corporate Phone */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  Corporate Official Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={corporatePhone}
                  onChange={(e) => setCorporatePhone(e.target.value)}
                  placeholder="e.g. +234 812 987 6543"
                  className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                  required
                />
                <span className="text-[11px] text-[var(--gray-500)] mt-1.5 block">
                  A verification code will be sent to this phone.
                </span>
              </div>
            </div>
          </div>

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
              disabled={Boolean(emailDuplicateError)}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>Continue to Signatory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* STEP 2: Representative Signatory, Separate Password & OTP        */}
      {/* ================================================================ */}
      {step === 2 && cacData && (
        <div className="bg-white shadow-float rounded-[28px] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Authorized Representative &amp; Credentials
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] mt-1 leading-relaxed">
              Designate an authorized human representative and establish a separate corporate login password.
            </p>
          </div>

          {/* Representative Identity Lookup */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-[var(--ink)] tracking-tight">
                Authorized Signatory Officer
              </h3>
              {/* Quick Fill Demo NIN Chip */}
              <button
                type="button"
                onClick={() => {
                  handleNINChange('12345678901')
                  setRepName('Fatima Aliyu')
                  setRepRole('Managing Director')
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#1AA260] border border-emerald-200 transition-colors font-medium cursor-pointer"
              >
                Demo Fill: Fatima Aliyu (Director)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  Representative Personal NIN <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNIN ? 'text' : 'password'}
                    value={repNIN}
                    onChange={(e) => handleNINChange(e.target.value)}
                    placeholder="Enter 11-digit personal NIN"
                    maxLength={11}
                    className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] font-mono text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNIN(!showNIN)}
                    className="absolute right-3.5 top-3 text-[var(--gray-500)] hover:text-[var(--ink)] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  Representative Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="Enter authorized representative name"
                  className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                  required
                />
              </div>
            </div>

            {/* Internal check feedback */}
            {internalNINMatch?.found && (
              <div className="border border-emerald-200 bg-emerald-50/60 p-3.5 rounded-2xl text-xs text-[var(--ink)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1AA260] shrink-0" />
                <span>
                  Existing Citizen Account Found: <strong className="text-[#1AA260]">{internalNINMatch.name}</strong> &middot; Pre-linked as Authorised Signatory.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Official Capacity / Designation <span className="text-rose-500">*</span>
              </label>
              <input
                value={repRole}
                onChange={(e) => setRepRole(e.target.value)}
                placeholder="e.g. Managing Director / Principal Partner"
                className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                required
              />
            </div>

            {/* Mandatory Authorised Representative Declaration Checkbox */}
            <label className="flex items-start gap-3.5 p-4 border border-[var(--gray-200)] rounded-2xl bg-[var(--paper)]/60 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isAuthorizedChecked}
                onChange={(e) => setIsAuthorizedChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#1AA260] focus:ring-[#1AA260] accent-[#1AA260] cursor-pointer shrink-0"
              />
              <span className="text-[var(--gray-700)] leading-relaxed">
                <strong className="text-[var(--ink)]">
                  I solemnly declare <span className="text-rose-500">*</span>
                </strong>{' '}
                that I am the authorized representative / director legally empowered to manage tax and statutory revenue affairs for <strong>{cacData.companyName}</strong> with the Kaduna State Internal Revenue Service.
              </span>
            </label>
          </div>

          {/* Separate Corporate Password */}
          <div className="space-y-4 pt-3 border-t border-[var(--gray-200)]">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink)] tracking-tight">
                Corporate Login Password <span className="text-rose-500">*</span>
              </h3>
              <p className="text-xs text-[var(--gray-700)] mt-0.5">
                This credential is strictly for managing <strong>{cacData.companyName}</strong> and remains isolated from any personal citizen accounts.
              </p>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={corporatePassword}
                onChange={(e) => setCorporatePassword(e.target.value)}
                placeholder="Create corporate access password"
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                isPasswordLongEnough
                  ? 'border-emerald-200 bg-emerald-50 text-[#1AA260]'
                  : 'border-[var(--gray-200)] bg-[var(--paper)] text-[var(--gray-500)]'
              }`}>
                <span className="text-xs">{isPasswordLongEnough ? '✓' : '○'}</span>
                <span>8+ chars</span>
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

          {/* Corporate Phone Verification Challenge */}
          <div className="space-y-4 pt-3 border-t border-[var(--gray-200)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)] tracking-tight">
                  Corporate Phone Verification
                </h3>
                <p className="text-xs text-[var(--gray-700)] mt-0.5">
                  Confirm possession of the corporate phone number:{' '}
                  <strong className="font-mono font-semibold text-[var(--ink)]">{corporatePhone}</strong>.
                </p>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-[#1AA260] border border-emerald-200 shrink-0 self-start sm:self-auto">
                SMS Verification
              </span>
            </div>

            {!otpSent && !otpVerified && (
              <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--paper)] p-4 rounded-2xl border border-[var(--gray-200)]">
                <p className="text-xs sm:text-sm text-[var(--gray-700)]">
                  A 6-digit verification code will be sent to the official corporate phone.
                </p>
                <button
                  type="button"
                  onClick={handleSendCorpOTP}
                  className="bg-[#1AA260] hover:bg-[#158A52] text-white px-6 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Verification Code</span>
                </button>
              </div>
            )}

            {otpSent && !otpVerified && (
              <div className="space-y-3.5 animate-in fade-in bg-[var(--paper)] p-4 rounded-2xl border border-[var(--gray-200)]">
                <p className="text-xs sm:text-sm text-[var(--gray-700)]">
                  Enter the 6-digit verification code sent to <strong className="text-[var(--ink)]">{corporatePhone}</strong>:
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-48 px-4 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--white)] text-[var(--ink)] font-mono text-center tracking-[0.3em] text-lg font-semibold focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCorpOTP}
                    disabled={otpInput.length < 6}
                    className="bg-[#1AA260] hover:bg-[#158A52] text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Verify Code
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCorpOTP}
                    disabled={resendCooldown > 0}
                    className="text-xs text-[var(--gray-500)] hover:text-[var(--ink)] disabled:opacity-50 underline px-2 py-1 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                {otpError && (
                  <div className="p-3 border border-rose-300 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>
            )}

            {otpVerified && (
              <div className="border border-emerald-200 bg-emerald-50/60 p-4 rounded-2xl text-xs text-[var(--ink)] flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-[#1AA260] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#1AA260] text-sm">
                    Corporate Verification Confirmed
                  </div>
                  <p className="text-[var(--gray-700)] mt-0.5 leading-relaxed">
                    Official corporate phone validated. Profile for <strong className="text-[var(--ink)]">{cacData.companyName}</strong> is verified and ready for activation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
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
              disabled={!otpVerified || !isAuthorizedChecked || !isPasswordValid || !repName.trim() || repNIN.length !== 11}
              onClick={handleFinish}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-8 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <span>Activate Corporate Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

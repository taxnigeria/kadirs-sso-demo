import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import {
  ShieldCheck,
  Lock,
  Smartphone,
  MessageSquare,
  PhoneCall,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { DEMO_PERSONAS } from '@/data/personas'
import {
  sendSimulatedOTP,
  verifySimulatedOTP,
  type OTPChannel
} from '@/engine/otp-simulator'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const login = useAuthEngine((s) => s.login)
  const reconciledRecordIds = useAuthEngine((s) => s.reconciledRecordIds)

  // Step state: 1 = Credentials, 2 = 2FA Challenge, 3 = Post-Login Transition
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Credentials form state (Blank by default)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Rate-limiting simulation state
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [credError, setCredError] = useState<string | null>(null)

  // 2FA state
  const [selectedChannel, setSelectedChannel] = useState<OTPChannel>('termii_sms_dnd')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(30)
  const [authenticatedPersonaId, setAuthenticatedPersonaId] = useState<string | null>(null)
  const [authenticatedName, setAuthenticatedName] = useState<string>('')

  // Handle countdown for lockout
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isLockedOut && lockoutSeconds > 0) {
      timer = setTimeout(() => {
        setLockoutSeconds((prev) => prev - 1)
      }, 1000)
    } else if (isLockedOut && lockoutSeconds <= 0) {
      setIsLockedOut(false)
      setFailedAttempts(0)
      setCredError(null)
    }
    return () => clearTimeout(timer)
  }, [isLockedOut, lockoutSeconds])

  // Handle countdown for OTP resend cooldown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (step === 2 && resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearTimeout(timer)
  }, [step, resendCooldown])

  const handleResetLockout = () => {
    setIsLockedOut(false)
    setFailedAttempts(0)
    setLockoutSeconds(0)
    setCredError(null)
  }

  // Dispatch OTP on entering step 2 or switching channel
  const dispatchOTP = (channel: OTPChannel = selectedChannel) => {
    // Determine destination for current identifier and channel
    const found = DEMO_PERSONAS.find(
      (p) =>
        p.profile.email.toLowerCase() === identifier.trim().toLowerCase() ||
        p.identity.nin === identifier.trim()
    )
    const phone = found ? found.profile.phone : '+234 803 123 4567'
    const email = identifier.includes('@') ? identifier.trim() : (found ? found.profile.email : 'citizen@kaduna.ng')
    const destination = channel === 'email' ? email : phone

    sendSimulatedOTP(destination, channel)
    setEnteredOtp('')
    setOtpError(null)
    setResendCooldown(30)
  }

  // Step 1 Submission: Validate credentials
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLockedOut) return

    setCredError(null)

    // Demo password rule: "Kaduna2024!" is standard, but accept anything unless intentional fail
    if (password !== 'Kaduna2024!' && password.length < 4) {
      const nextFailed = failedAttempts + 1
      setFailedAttempts(nextFailed)
      if (nextFailed >= 3) {
        setIsLockedOut(true)
        setLockoutSeconds(30)
        setCredError(
          'Account temporarily locked: 3 consecutive authentication failures. Rate-limiting protection active.'
        )
      } else {
        setCredError(
          `Invalid credentials. ${3 - nextFailed} attempt(s) remaining before security lockout.`
        )
      }
      return
    }

    // Credentials accepted -> move to Step 2 (2FA)
    setStep(2)
    dispatchOTP(selectedChannel)
  }

  // Step 2 Submission: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError(null)

    if (enteredOtp.length < 6) {
      setOtpError('Please enter the complete 6-digit verification code.')
      return
    }

    setIsVerifying(true)
    setTimeout(() => {
      const result = verifySimulatedOTP(enteredOtp)
      setIsVerifying(false)

      if (!result.valid) {
        setOtpError(result.message)
        return
      }

      // Successful 2FA verification -> call Auth Engine login
      const loginResult = login(identifier, password)
      setAuthenticatedPersonaId(loginResult.personaId || null)
      setAuthenticatedName(loginResult.citizen.citizenId)

      const foundPersona = DEMO_PERSONAS.find((p) => p.id === loginResult.personaId)
      if (foundPersona) {
        setAuthenticatedName(foundPersona.identity.legalName)
      }

      // Check if this persona has un-reconciled legacy records (e.g. Fatima)
      const isFatima = loginResult.personaId === 'fatima' || identifier.toLowerCase().includes('fatima')
      const hasUnlinkedRecords = isFatima && reconciledRecordIds.length === 0

      if (hasUnlinkedRecords) {
        // Move to Step 3: Recognition Interstitial
        setStep(3)
      } else {
        // Direct redirect
        const target = redirectUrl ? decodeURIComponent(redirectUrl) : '/paykaduna'
        navigate(target)
      }
    }, 600)
  }

  // Current persona helper for UI display
  const matchedPersona = DEMO_PERSONAS.find(
    (p) =>
      p.profile.email.toLowerCase() === identifier.trim().toLowerCase() ||
      p.identity.nin === identifier.trim()
  ) || DEMO_PERSONAS[0]

  const maskedPhone = matchedPersona.profile.phone.replace(/(\+\d{3}\s\d{3})\s\d{3}\s(\d{4})/, '$1 ••• $2')
  const maskedEmail = (() => {
    const rawEmail = identifier.includes('@') ? identifier.trim() : matchedPersona.profile.email
    const [user, domain] = rawEmail.split('@')
    if (!user || !domain) return rawEmail
    const visible = user.length > 2 ? user.slice(0, 2) : user.slice(0, 1)
    return `${visible}•••••@${domain}`
  })()

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      {/* Official State Header */}
      <div className="text-center mb-8 max-w-[560px]">
        <div className="w-12 h-12 rounded-full border border-[var(--green)] flex items-center justify-center text-[var(--green)] font-sans font-semibold text-base mb-3 mx-auto bg-[var(--paper-raised)] shadow-2xs">
          KD
        </div>
        <h1 className="font-sans font-semibold text-[24px] sm:text-[28px] leading-tight text-[var(--ink)] tracking-tight mb-2">
          Sign in to Kaduna State Services
        </h1>
        <p className="text-[13.5px] text-[var(--ink-soft)] leading-relaxed max-w-[48ch] mx-auto">
          One unified citizen account for PayKaduna, motor vehicle licensing, and state tax filings.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[480px] bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 sm:p-8 shadow-xs transition-all">
        {/* STEP 1: Credentials */}
        {step === 1 && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div className="border-b border-[var(--line-soft)] pb-4 mb-1">
              <h2 className="font-sans font-semibold text-[18px] sm:text-[20px] text-[var(--ink)] tracking-tight">
                Citizen &amp; Business Login
              </h2>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                Enter your email address, registered mobile phone number, or Citizen ID.
              </p>
            </div>

            {/* Error or Rate-Limiting Alert */}
            {credError && (
              <div className="p-3.5 border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] rounded-[var(--radius)] text-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{credError}</p>
                    {isLockedOut && (
                      <p className="mt-1 font-mono text-[11.5px]">
                        Cooldown active: {lockoutSeconds}s remaining
                      </p>
                    )}
                  </div>
                </div>
                {isLockedOut && (
                  <button
                    type="button"
                    onClick={handleResetLockout}
                    className="underline text-[11px] font-semibold shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}

            {/* Identifier Input */}
            <div>
              <label className="block text-[12.5px] font-medium text-[var(--ink-soft)] mb-1.5">
                Email, Phone, or Citizen ID <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLockedOut}
                  placeholder="e.g. fatimah.a@gmail.com or 08031234567"
                  className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-2 focus:outline-[var(--green)] disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12.5px] font-medium text-[var(--ink-soft)]">
                  Password <span className="text-[var(--danger)]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset links are simulated via secure SMS in this demo.')}
                  className="text-xs text-[var(--ink-soft)] hover:text-[var(--green)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLockedOut}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-2 focus:outline-[var(--green)] disabled:opacity-50 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded-[var(--radius)] accent-[var(--green)]"
              />
              <label htmlFor="remember" className="text-xs text-[var(--ink-soft)] cursor-pointer">
                Trust this device for 30 days (NDPA Section 24 compliance)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLockedOut}
              className="w-full bg-[var(--green)] hover:bg-[var(--green-deep)] disabled:opacity-50 text-white py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2 shadow-2xs"
            >
              <span>Continue to 2-Factor Authentication</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Registration link */}
            <div className="text-center pt-3 border-t border-[var(--line-soft)]">
              <span className="text-xs text-[var(--ink-soft)]">
                Don&apos;t have a verified Kaduna citizen account yet?{' '}
              </span>
              <Link
                to="/auth/register"
                className="text-xs text-[var(--green)] font-semibold hover:underline"
              >
                Register with NIN &rarr;
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: 2FA Verification */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-[var(--line-soft)] pb-4 mb-1">
              <div className="flex items-center gap-2 text-[var(--green)] text-xs font-semibold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Two-Factor Authentication</span>
              </div>
              <h2 className="font-sans font-semibold text-[18px] sm:text-[20px] text-[var(--ink)] tracking-tight">
                Verify Your Identity
              </h2>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                A one-time verification code was dispatched to verify your citizen profile.
              </p>
            </div>

            {/* Channel Tabs */}
            <div>
              <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-2">
                Delivery Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('termii_sms_dnd')
                    dispatchOTP('termii_sms_dnd')
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] border text-xs font-medium transition-all ${
                    selectedChannel === 'termii_sms_dnd'
                      ? 'border-[var(--green)] bg-[var(--line-soft)] text-[var(--ink)] font-semibold'
                      : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                  <span className="truncate">SMS Verification</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('whatsapp')
                    dispatchOTP('whatsapp')
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] border text-xs font-medium transition-all ${
                    selectedChannel === 'whatsapp'
                      ? 'border-[var(--green)] bg-[var(--line-soft)] text-[var(--ink)] font-semibold'
                      : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('voice_call')
                    dispatchOTP('voice_call')
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] border text-xs font-medium transition-all ${
                    selectedChannel === 'voice_call'
                      ? 'border-[var(--green)] bg-[var(--line-soft)] text-[var(--ink)] font-semibold'
                      : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                  <span className="truncate">Voice Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('email')
                    dispatchOTP('email')
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] border text-xs font-medium transition-all ${
                    selectedChannel === 'email'
                      ? 'border-[var(--green)] bg-[var(--line-soft)] text-[var(--ink)] font-semibold'
                      : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                  <span className="truncate">Email</span>
                </button>
              </div>
            </div>

            {/* Carrier Dispatch Confirmation — Tailored per channel */}
            <div className="bg-[var(--paper)] border border-[var(--line)] p-3.5 rounded-[var(--radius)] text-xs text-[var(--ink-soft)] leading-relaxed flex items-start gap-2.5 transition-all">
              {selectedChannel === 'termii_sms_dnd' && (
                <>
                  <Smartphone className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                  <div>
                    Verification code dispatched via SMS to{' '}
                    <strong className="text-[var(--ink)] font-mono">{maskedPhone}</strong>. Enter the 6-digit code below to authorize your session.
                  </div>
                </>
              )}
              {selectedChannel === 'whatsapp' && (
                <>
                  <MessageSquare className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                  <div>
                    Verification code sent via WhatsApp message to{' '}
                    <strong className="text-[var(--ink)] font-mono">{maskedPhone}</strong>. Check your WhatsApp chats and enter the 6-digit code below.
                  </div>
                </>
              )}
              {selectedChannel === 'voice_call' && (
                <>
                  <PhoneCall className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                  <div>
                    Automated voice call dialing{' '}
                    <strong className="text-[var(--ink)] font-mono">{maskedPhone}</strong>. Answer the incoming call to hear your 6-digit audio verification code.
                  </div>
                </>
              )}
              {selectedChannel === 'email' && (
                <>
                  <Mail className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                  <div>
                    Verification code dispatched to your registered email{' '}
                    <strong className="text-[var(--ink)] font-mono">{maskedEmail}</strong>. Check your inbox or spam folder and enter the 6-digit code below.
                  </div>
                </>
              )}
            </div>

            {/* OTP Input Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {otpError && (
                <div className="p-3 border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] rounded-[var(--radius)] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="block text-[12.5px] font-medium text-[var(--ink-soft)] mb-1.5">
                  Enter 6-digit Code <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  autoFocus
                  className="w-full px-3 py-2.5 text-center font-mono text-xl tracking-[0.4em] border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] focus:outline-2 focus:outline-[var(--green)]"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--ink-soft)]">
                <span>Code expires in 5:00</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={() => dispatchOTP()}
                  className="text-[var(--green)] font-medium hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-[var(--green)] hover:bg-[var(--green-deep)] text-white py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2 shadow-2xs"
              >
                {isVerifying ? (
                  <span>Verifying code...</span>
                ) : (
                  <>
                    <span>Verify &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setEnteredOtp('')
                  setOtpError(null)
                }}
                className="w-full text-center text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors py-1 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to credentials</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Hero Post-Login Recognition Interstitial (Fatima's Journey) */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center pb-2">
              <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center mx-auto mb-3 border border-[var(--green)]/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--green)] block mb-1">
                Identity Verified &middot; Citizen Session Ready{authenticatedPersonaId ? ` (${authenticatedPersonaId})` : ''}
              </span>
              <h2 className="font-sans font-semibold text-[20px] sm:text-[22px] text-[var(--ink)] tracking-tight">
                Welcome back, {authenticatedName.split(' ')[0]}
              </h2>
              <p className="text-xs text-[var(--ink-soft)] max-w-[40ch] mx-auto mt-1">
                Your primary identity has been validated. Our account reconciliation engine found 3 unlinked historical records.
              </p>
            </div>

            {/* Found legacy records notice */}
            <div className="border border-[var(--line)] bg-[var(--paper)] p-4 rounded-[var(--radius)] space-y-2.5 text-xs">
              <div className="font-semibold text-[var(--ink)] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[var(--green)]" />
                <span>Detected Pre-Migration Accounts:</span>
              </div>
              <ul className="space-y-1.5 text-[var(--ink-soft)] pl-6 list-disc">
                <li>
                  <strong className="text-[var(--ink)]">PayKaduna:</strong> fatimah.a@gmail.com (₦15,000 paid history)
                </li>
                <li>
                  <strong className="text-[var(--ink)]">KADVREG:</strong> fatima.abdullahi@yahoo.com (Plate: KD-123-ABC)
                </li>
                <li>
                  <strong className="text-[var(--ink)]">PIT Portal:</strong> fatima.abdullahi@yahoo.com (TIN-PIT-008472)
                </li>
              </ul>
              <p className="text-[11px] text-[var(--ink-soft)] italic pt-1 border-t border-[var(--line-soft)]">
                Per KADIRS Account Unification Mandate, you can review and bind these records under your NIN with Recognition Cards.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/auth/reconciliation')}
                className="w-full bg-[var(--green)] hover:bg-[var(--green-deep)] text-white py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <span>Review &amp; Reconcile Accounts</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/paykaduna')}
                className="w-full border border-[var(--line)] bg-[var(--paper-raised)] hover:bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)] py-2 rounded-[var(--radius)] text-xs font-medium transition-colors"
              >
                Skip for now &rarr; Go to PayKaduna Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security & Regulatory Footnote */}
      <div className="mt-8 text-center text-xs text-[var(--ink-soft)] max-w-[460px] flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
        <span>
          Protected by Kaduna State Identity Framework 2.0 &middot; NDPA Compliant
        </span>
      </div>
    </div>
  )
}

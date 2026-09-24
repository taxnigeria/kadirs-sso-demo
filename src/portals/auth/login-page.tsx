import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import {
  Scale,
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
  RefreshCw,
  Sparkles,
  Car,
  Wallet,
  FileText
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

  // Credentials form state
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Rate-limiting simulation state
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [credError, setCredError] = useState<string | null>(null)

  // 2FA state: TOTP or SMS OTP with fallback channels
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'sms'>('totp')
  const [smsFallbackRoute, setSmsFallbackRoute] = useState<'sms' | 'whatsapp' | 'voice_call' | 'email'>('sms')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(30)
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

  // Quick fill helper for evaluator demo
  const handleQuickFill = (email: string) => {
    setIdentifier(email)
    setPassword('Kaduna2024!')
    setCredError(null)
    handleResetLockout()
  }

  // Dispatch OTP on entering step 2 or switching channel
  const dispatchOTP = (channel: OTPChannel = 'termii_sms_dnd') => {
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

    // Demo password rule: "Kaduna2024!" is standard, but accept anything >= 4 chars unless intentionally blank
    if (password !== 'Kaduna2024!' && password.length < 4) {
      const nextFailed = failedAttempts + 1
      setFailedAttempts(nextFailed)
      if (nextFailed >= 3) {
        setIsLockedOut(true)
        setLockoutSeconds(30)
        setCredError(
          'Account temporarily paused after 3 unsuccessful attempts. Please wait 30 seconds.'
        )
      } else {
        setCredError(
          `Incorrect password. ${3 - nextFailed} attempt(s) remaining.`
        )
      }
      return
    }

    // Credentials accepted -> move to Step 2 (2FA)
    setStep(2)
    if (twoFactorMethod === 'sms') {
      dispatchOTP('termii_sms_dnd')
    } else {
      setEnteredOtp('')
      setOtpError(null)
    }
  }

  // Step 2 Submission: Verify OTP or TOTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError(null)

    if (enteredOtp.length < 6) {
      setOtpError('Please enter the complete 6-digit security code.')
      return
    }

    setIsVerifying(true)
    setTimeout(() => {
      let isValid = false
      let errMsg = ''

      if (twoFactorMethod === 'totp') {
        if (enteredOtp.length === 6) {
          isValid = true
        } else {
          errMsg = 'Invalid authenticator code. Please check your app.'
        }
      } else {
        const result = verifySimulatedOTP(enteredOtp)
        isValid = result.valid
        errMsg = result.message
      }

      setIsVerifying(false)

      if (!isValid) {
        setOtpError(errMsg || 'Verification failed. Please check the code and try again.')
        return
      }

      // Successful 2FA verification -> call Auth Engine login
      const loginResult = login(identifier, password)
      setAuthenticatedName(loginResult.citizen.citizenId)

      const foundPersona = DEMO_PERSONAS.find((p) => p.id === loginResult.personaId)
      if (foundPersona) {
        setAuthenticatedName(foundPersona.identity.legalName)
      }

      // Check if this persona has un-reconciled legacy records (e.g. Fatima)
      const isFatima = loginResult.personaId === 'fatima' || identifier.toLowerCase().includes('fatima')
      const hasUnlinkedRecords = isFatima && reconciledRecordIds.length === 0

      if (hasUnlinkedRecords) {
        setStep(3)
      } else {
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
    <div className="py-10 sm:py-16 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      {/* Official State Header */}
      <div className="text-center mb-8 max-w-[540px]">
        <div className="w-14 h-14 rounded-full bg-[#1AA260]/10 border border-[#1AA260]/30 flex items-center justify-center text-[#1AA260] mb-4 mx-auto">
          <Scale className="w-7 h-7" />
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight mb-2">
          Sign In to Kaduna State Portal
        </h1>
        <p className="text-sm text-[var(--gray-700)] leading-relaxed max-w-[48ch] mx-auto">
          One unified citizen account for PayKaduna revenue, road vehicle licensing, and tax assessment.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[480px] bg-white border border-[var(--gray-200)] rounded-[28px] p-7 sm:p-9 transition-all">
        
        {/* Evaluator Demo Quick Fill Bar */}
        {step === 1 && (
          <div className="mb-6 p-3 rounded-2xl bg-[var(--paper)] border border-[var(--gray-200)] text-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#1AA260]" />
              <span>Demo Accounts (1-Click Fill)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('fatimah.a@gmail.com')}
                className="px-2.5 py-1 rounded-full bg-[var(--white)] hover:bg-emerald-50 border border-[var(--gray-200)] hover:border-emerald-300 text-[11.5px] font-medium text-[var(--ink)] transition-colors cursor-pointer"
              >
                Fatima (Citizen)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('amina.yusuf@kdsme.org')}
                className="px-2.5 py-1 rounded-full bg-[var(--white)] hover:bg-emerald-50 border border-[var(--gray-200)] hover:border-emerald-300 text-[11.5px] font-medium text-[var(--ink)] transition-colors cursor-pointer"
              >
                Amina (Corporate)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('emeka.obi@gmail.com')}
                className="px-2.5 py-1 rounded-full bg-[var(--white)] hover:bg-emerald-50 border border-[var(--gray-200)] hover:border-emerald-300 text-[11.5px] font-medium text-[var(--ink)] transition-colors cursor-pointer"
              >
                Emeka (Logistics)
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Credentials */}
        {step === 1 && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div className="border-b border-[var(--gray-200)] pb-4 mb-1">
              <h2 className="font-display font-bold text-lg text-[var(--ink)] tracking-tight">
                Citizen &amp; Business Account
              </h2>
              <p className="text-xs text-[var(--gray-700)] mt-0.5">
                Enter your registered email address or National ID (NIN) to continue.
              </p>
            </div>

            {/* Error Alert */}
            {credError && (
              <div className="p-3.5 border border-rose-300 bg-rose-50 text-rose-700 rounded-2xl text-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <p className="font-medium">{credError}</p>
                    {isLockedOut && (
                      <p className="mt-1 font-mono text-[11.5px]">
                        Please wait: {lockoutSeconds}s
                      </p>
                    )}
                  </div>
                </div>
                {isLockedOut && (
                  <button
                    type="button"
                    onClick={handleResetLockout}
                    className="underline text-[11px] font-semibold shrink-0 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}

            {/* Registered Email or NIN Input */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Email Address or National ID (NIN) *
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLockedOut}
                placeholder="e.g. fatimah.a@gmail.com or 12345678901"
                className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all disabled:opacity-50"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[var(--ink)]">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => alert('For this demo, standard passwords are "Kaduna2024!"')}
                  className="text-xs text-[var(--gray-500)] hover:text-[#1AA260] transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all disabled:opacity-50 pr-11"
                  required
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1AA260] cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-[var(--gray-700)] cursor-pointer">
                Trust this device for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLockedOut}
              className="w-full bg-[#1AA260] hover:bg-[#158A52] disabled:opacity-50 text-white py-3 rounded-full text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <span>Continue to Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Registration link */}
            <div className="text-center pt-3 border-t border-[var(--gray-200)]">
              <span className="text-xs text-[var(--gray-500)]">
                Don&apos;t have a Kaduna citizen account yet?
              </span>
              <Link
                to="/auth/register"
                className="text-xs text-[#1AA260] font-semibold hover:underline ml-1.5"
              >
                Register with National ID (NIN) &rarr;
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: 2FA Verification */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-[var(--gray-200)] pb-4 mb-1">
              <h2 className="font-display font-bold text-lg text-[var(--ink)] tracking-tight">
                Confirm Your Identity
              </h2>
              <p className="text-xs text-[var(--gray-700)] mt-0.5">
                Select your preferred verification method to protect your citizen records.
              </p>
            </div>

            {/* Method Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTwoFactorMethod('totp')
                  setEnteredOtp('')
                  setOtpError(null)
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  twoFactorMethod === 'totp'
                    ? 'border-[#1AA260] bg-emerald-50/60 ring-1 ring-[#1AA260]'
                    : 'border-[var(--gray-200)] bg-[var(--paper)] hover:bg-[var(--gray-100)] text-[var(--gray-700)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="w-4 h-4 text-[#1AA260]" />
                  <span className="font-bold text-xs text-[var(--ink)]">Authenticator App</span>
                </div>
                <div className="text-[11px] text-[#1AA260] font-medium">
                  Instant &middot; Offline
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorMethod('sms')
                  setEnteredOtp('')
                  setOtpError(null)
                  dispatchOTP(smsFallbackRoute === 'sms' ? 'termii_sms_dnd' : smsFallbackRoute)
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  twoFactorMethod === 'sms'
                    ? 'border-[#1AA260] bg-emerald-50/60 ring-1 ring-[#1AA260]'
                    : 'border-[var(--gray-200)] bg-[var(--paper)] hover:bg-[var(--gray-100)] text-[var(--gray-700)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-[#1AA260]" />
                  <span className="font-bold text-xs text-[var(--ink)]">Mobile Code</span>
                </div>
                <div className="text-[11px] text-[var(--gray-500)] font-medium">
                  SMS &middot; WhatsApp
                </div>
              </button>
            </div>

            {/* TOTP Active State */}
            {twoFactorMethod === 'totp' && (
              <div className="bg-[var(--paper)] border border-[var(--gray-200)] p-3.5 rounded-2xl text-xs text-[var(--gray-700)] leading-relaxed flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-[#1AA260] shrink-0 mt-0.5" />
                <div>
                  Enter the 6-digit code from your <strong>Authenticator App</strong> (e.g. Google Authenticator, Microsoft Authenticator, or 1Password).
                </div>
              </div>
            )}

            {/* SMS Active State */}
            {twoFactorMethod === 'sms' && (
              <div className="space-y-3">
                <div className="bg-[var(--paper)] border border-[var(--gray-200)] p-3.5 rounded-2xl text-xs text-[var(--gray-700)] leading-relaxed flex items-start gap-2.5">
                  {smsFallbackRoute === 'email' ? (
                    <>
                      <Mail className="w-4 h-4 text-[#1AA260] shrink-0 mt-0.5" />
                      <div>
                        Security code sent to your registered email:{' '}
                        <strong className="text-[var(--ink)] font-mono">{maskedEmail}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 text-[#1AA260] shrink-0 mt-0.5" />
                      <div>
                        Security code sent to your registered phone:{' '}
                        <strong className="text-[var(--ink)] font-mono">{maskedPhone}</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Delivery Options */}
                <div className="p-3 bg-[var(--paper)] border border-[var(--gray-200)] rounded-2xl text-xs space-y-2">
                  <span className="text-[11px] text-[var(--gray-500)] block">
                    Choose receiving channel:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSmsFallbackRoute('sms')
                        dispatchOTP('termii_sms_dnd')
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        smsFallbackRoute === 'sms'
                          ? 'bg-[#1AA260] text-white'
                          : 'bg-[var(--white)] border border-[var(--gray-200)] text-[var(--gray-700)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>SMS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSmsFallbackRoute('whatsapp')
                        dispatchOTP('whatsapp')
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        smsFallbackRoute === 'whatsapp'
                          ? 'bg-[#1AA260] text-white'
                          : 'bg-[var(--white)] border border-[var(--gray-200)] text-[var(--gray-700)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSmsFallbackRoute('voice_call')
                        dispatchOTP('voice_call')
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        smsFallbackRoute === 'voice_call'
                          ? 'bg-[#1AA260] text-white'
                          : 'bg-[var(--white)] border border-[var(--gray-200)] text-[var(--gray-700)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Voice Call</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSmsFallbackRoute('email')
                        dispatchOTP('email')
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        smsFallbackRoute === 'email'
                          ? 'bg-[#1AA260] text-white'
                          : 'bg-[var(--white)] border border-[var(--gray-200)] text-[var(--gray-700)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {otpError && (
                <div className="p-3 border border-rose-300 bg-rose-50 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  Enter 6-Digit Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  autoFocus
                  className="w-full px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] font-bold rounded-xl border border-[var(--gray-200)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--gray-500)]">
                {twoFactorMethod === 'totp' ? (
                  <span>Codes update every 30 seconds</span>
                ) : (
                  <span>Code valid for 5 minutes</span>
                )}
                {twoFactorMethod === 'sms' && (
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={() => dispatchOTP(smsFallbackRoute === 'sms' ? 'termii_sms_dnd' : smsFallbackRoute)}
                    className="text-[#1AA260] font-medium hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-[#1AA260] hover:bg-[#158A52] text-white py-3 rounded-full text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
                className="w-full text-center text-xs text-[var(--gray-500)] hover:text-[var(--ink)] transition-colors py-1 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Past Records Discovery Interstitial (Fatima's Journey) */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center pb-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#1AA260] flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1AA260] block mb-1">
                Identity Verified &middot; Welcome
              </span>
              <h2 className="font-display font-extrabold text-2xl text-[var(--ink)] tracking-tight">
                Welcome back, {authenticatedName.split(' ')[0]}!
              </h2>
              <p className="text-xs text-[var(--gray-700)] max-w-[40ch] mx-auto mt-1 leading-relaxed">
                We discovered 3 past records linked to your National ID across state revenue databases.
              </p>
            </div>

            {/* Found legacy records notice */}
            <div className="border border-[var(--gray-200)] bg-[var(--paper)] p-4 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-[var(--ink)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1AA260]" />
                <span>Discovered Historical Accounts:</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[var(--white)] border border-[var(--gray-200)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-[#1AA260]" />
                    <div>
                      <strong className="text-[var(--ink)] block">PayKaduna Revenue</strong>
                      <span className="text-[11px] text-[var(--gray-500)]">fatimah.a@gmail.com &middot; ₦15,000 paid</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">Ready to link</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--white)] border border-[var(--gray-200)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Car className="w-4 h-4 text-[#1AA260]" />
                    <div>
                      <strong className="text-[var(--ink)] block">KADVREG Vehicle Licensing</strong>
                      <span className="text-[11px] text-[var(--gray-500)]">Plate: KD-123-ABC &middot; Honda Accord</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">Ready to link</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--white)] border border-[var(--gray-200)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#1AA260]" />
                    <div>
                      <strong className="text-[var(--ink)] block">Personal Income Tax (PIT)</strong>
                      <span className="text-[11px] text-[var(--gray-500)]">TIN-PIT-008472 &middot; Prior filings</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">Ready to link</span>
                </div>
              </div>
              <p className="text-[11px] text-[var(--gray-500)] pt-1">
                You can review and merge these into your single account now, or do it later from your profile.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigate('/auth/reconciliation')}
                className="w-full bg-[#1AA260] hover:bg-[#158A52] text-white py-3 rounded-full text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Review &amp; Link Past Accounts</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/paykaduna')}
                className="w-full border border-[var(--gray-200)] bg-[var(--white)] hover:bg-[var(--gray-100)] text-[var(--gray-700)] py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Skip for now &rarr; Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security & Official Trust Seal */}
      <div className="mt-8 text-center text-xs text-[var(--gray-500)] max-w-[460px] flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-[#1AA260] shrink-0" />
        <span>
          Kaduna State Internal Revenue Service &middot; Unified Citizen Gateway
        </span>
      </div>
    </div>
  )
}

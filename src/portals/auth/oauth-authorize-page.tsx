import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router'
import {
  ShieldCheck,
  Building2,
  Lock,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  UserPlus
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useAdminEngine } from '@/engine/admin-engine'
import { useEventLogger } from '@/engine/event-logger'
import { buildToken } from '@/engine/token-builder'
import { DEMO_PERSONAS } from '@/data/personas'

export default function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Query parameters from external TSP
  const clientId = searchParams.get('client_id') || 'kadtaxonrent'
  const redirectUri = searchParams.get('redirect_uri') || 'http://localhost:5174/auth/callback'
  const state = searchParams.get('state') || 'demo_state_123'
  const requestedPersonaParam = searchParams.get('persona') || searchParams.get('persona_id')

  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const isAuthenticated = useAuthEngine((s) => s.isAuthenticated)
  const login = useAuthEngine((s) => s.login)
  const loginAsPersona = useAuthEngine((s) => s.loginAsPersona)
  const tspClients = useAdminEngine((s) => s.tspClients)
  const logConsent = useEventLogger((s) => s.logConsent)

  // Step state: 'login' (Credentials when not authenticated) | 'confirm' (App Card & Account) | 'scopes' (Data Scopes Disclosure) | 'completed' (Demo feedback)
  const [ceremonyStep, setCeremonyStep] = useState<'login' | 'confirm' | 'scopes' | 'completed'>(() => {
    return isAuthenticated && currentUser ? 'confirm' : 'login'
  })

  // Sign-in inputs for unauthenticated state
  const [loginIdentifier, setLoginIdentifier] = useState('amina.yusuf@outlook.com')
  const [loginPassword, setLoginPassword] = useState('Kaduna2024!')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false)

  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const [isDemoAccordionOpen, setIsDemoAccordionOpen] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [generatedCallbackUrl, setGeneratedCallbackUrl] = useState<string | null>(null)

  // Resolve TSP details
  const matchedClient = tspClients.find((c) => c.id === clientId) || {
    id: clientId,
    name: clientId === 'kadtaxonrent' ? 'Kad Tax on Rent (WHT Property Platform)' : 'Kaduna State Partner TSP',
    audience: clientId,
    activeScopes: ['profile:read', 'tax:read', 'rent:manage']
  }

  // Split name and descriptor if parentheses are present (e.g. "Kad Tax on Rent (WHT Property Platform)")
  const nameMatch = matchedClient.name.match(/^([^(]+)(?:\((.*)\))?$/)
  const tspPrimaryName = nameMatch ? nameMatch[1].trim() : matchedClient.name
  const tspSubtitle = nameMatch && nameMatch[2] ? nameMatch[2].trim() : null

  // Active persona resolution (Honors requested param, active currentUser, or defaults to Amina for demo)
  const activePersona =
    (requestedPersonaParam ? DEMO_PERSONAS.find((p) => p.id === requestedPersonaParam) : null) ||
    DEMO_PERSONAS.find((p) => p.profile.email === currentUser?.email) ||
    DEMO_PERSONAS.find((p) => p.id === 'amina') ||
    DEMO_PERSONAS[0]

  const activeName = identity?.legalName || activePersona.identity.legalName
  const activeEmail = currentUser?.email || activePersona.profile.email
  const activeCitizenId = currentUser?.citizenId || activePersona.profile.citizenId
  const activeTaxOffice = currentUser?.taxOffice || activePersona.profile.taxOffice
  const activeTin = 'KAD-TIN-8829104'

  // Handle credentials login submit inside OAuth flow
  const handlePerformLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your email, phone, or 11-digit NIN.')
      return
    }

    setIsSubmittingLogin(true)
    setTimeout(() => {
      setIsSubmittingLogin(false)
      const res = login(loginIdentifier, loginPassword)
      if (res.success) {
        setCeremonyStep('confirm')
      } else {
        setLoginError('Invalid credentials. Check your details or select a demo account below.')
      }
    }, 400)
  }

  // Quick 1-click Demo Taxpayer selection
  const handleQuickDemoLogin = (personaId: string) => {
    loginAsPersona(personaId)
    setCeremonyStep('confirm')
  }

  // Handle switching persona inside account dropdown
  const handleSelectPersona = (personaId: string) => {
    loginAsPersona(personaId)
    setIsAccountDropdownOpen(false)
  }

  // Abort / Cancel handler
  const handleCancel = () => {
    if (redirectUri && redirectUri.startsWith('http')) {
      const abortUrl = `${redirectUri}?error=access_denied&state=${encodeURIComponent(state)}`
      window.location.href = abortUrl
    } else {
      navigate('/paykaduna')
    }
  }

  // Final Authorize & Token Grant Handler
  const handleAuthorizeAndProceed = () => {
    // 1. Actively log in and persist this persona in the SSO session store
    loginAsPersona(activePersona.id)

    // 2. Build signed RS256 token scoped strictly to this TSP audience
    const token = buildToken({
      citizenId: activeCitizenId,
      tspId: matchedClient.id,
      scopes: matchedClient.activeScopes || ['profile:read', 'tax:read', 'rent:manage'],
      personaType: 'individual',
      authMethods: ['pwd', 'sms_otp'],
      assuranceLevel: '2'
    })

    // 3. Log statutory consent in central NDPA audit trail
    const consentRef = `CNS-${Date.now().toString(36).toUpperCase()}`
    logConsent({
      citizenId: activeCitizenId,
      type: 'tsp_data_sharing',
      policyVersion: 'v2.0-2024',
      granted: true,
      ipAddress: '102.89.12.88',
      deviceInfo: navigator.userAgent,
      consentedFields: ['legalName', 'email', 'citizenId', 'stateTin', 'taxOffice']
    })

    // 4. Construct OAuth callback URL with verified claims
    const params = new URLSearchParams({
      code: `AUTH_CODE_KD_${Math.floor(10000 + Math.random() * 90000)}`,
      state,
      token: token.raw,
      citizenId: activeCitizenId,
      name: activeName,
      email: activeEmail,
      tin: activeTin,
      taxOffice: activeTaxOffice,
      personaId: activePersona.id,
      consentRef,
      verified: 'true'
    })

    const fullCallbackUrl = `${redirectUri}?${params.toString()}`
    setGeneratedCallbackUrl(fullCallbackUrl)

    // In production or when targeting KadTaxOnRent origin, perform browser redirect
    if (redirectUri && (redirectUri.includes('kadtaxonrent') || redirectUri.includes('5174') || redirectUri.includes('3000'))) {
      window.location.href = fullCallbackUrl
    } else {
      // Local evaluation feedback state
      setCeremonyStep('completed')
    }
  }

  const handleCopyToken = () => {
    if (generatedCallbackUrl) {
      navigator.clipboard.writeText(generatedCallbackUrl)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
      {/* Container: Elegant Dark/Light Dialog matching Google OAuth modal (Wider ~10% for improved breathing room) */}
      <div className="w-full max-w-[485px] bg-[var(--card-bg)] text-[var(--ink)] border border-[var(--input-border)] rounded-[28px] shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 relative">
        {/* Top Header: Kaduna State SSO Brand Mark */}
        <div className="flex items-center justify-between border-b border-[var(--gray-200)] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1AA260] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold tracking-tight text-[var(--ink)]">
              Sign in with Kaduna State SSO
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--gray-500)] uppercase tracking-wider">
            OAuth 2.0 PKCE
          </span>
        </div>

        {/* ================================================================ */}
        {/* STAGE 0: Sign In to Kaduna State SSO (When Unauthenticated)        */}
        {/* ================================================================ */}
        {ceremonyStep === 'login' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="flex flex-col items-center text-center pt-1 pb-1">
              <div className="w-14 h-14 rounded-2xl bg-[#123D35] text-emerald-400 flex items-center justify-center shadow-lg ring-4 ring-emerald-500/15 mb-3">
                <Building2 className="w-7 h-7 stroke-[2.2]" />
              </div>
              
              <p className="text-xs sm:text-[13px] font-medium text-[var(--gray-500)] tracking-tight">
                Sign in to continue to
              </p>
              <h1 className="font-display font-black text-2xl sm:text-[26px] text-[#0A5C36] dark:text-emerald-400 tracking-tight leading-tight mt-0.5">
                {tspPrimaryName}
              </h1>
              {tspSubtitle && (
                <div className="mt-1">
                  <span className="inline-flex items-center text-[11px] font-semibold text-[var(--gray-600)] dark:text-[var(--gray-300)] bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--input-border)] px-2.5 py-0.5 rounded-full">
                    {tspSubtitle}
                  </span>
                </div>
              )}
            </div>

            {/* Login Form */}
            <form onSubmit={handlePerformLogin} className="space-y-3.5 pt-1">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gray-600)]">
                  Email, Phone, or NIN
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. amina.yusuf@outlook.com or 77788899900"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] bg-black/[0.02] dark:bg-white/[0.04] text-xs text-[var(--ink)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[#1AA260]"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gray-600)]">
                    Password
                  </label>
                  <span className="text-[10.5px] text-[var(--gray-400)] font-mono">Demo: Kaduna2024!</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--input-border)] bg-black/[0.02] dark:bg-white/[0.04] text-xs text-[var(--ink)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[#1AA260]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full py-3 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmittingLogin ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In &amp; Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Registration Link */}
              <div className="text-center pt-2 pb-0.5">
                <span className="text-xs text-[var(--gray-600)] dark:text-[var(--gray-300)]">
                  Don&apos;t have an account?{' '}
                  <Link
                    to={`/auth/register?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                    className="text-[#1AA260] hover:text-[#158A52] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Register here</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </span>
              </div>
            </form>

            {/* Quick Demo Sign-In Picker (One-Click Collapsible Accordion) */}
            <div className="pt-2 border-t border-[var(--gray-200)] space-y-2">
              <button
                type="button"
                onClick={() => setIsDemoAccordionOpen(!isDemoAccordionOpen)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-[var(--input-border)] text-left transition-all cursor-pointer group"
                aria-expanded={isDemoAccordionOpen}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#1AA260]" />
                  <span className="text-xs font-semibold text-[var(--gray-700)] dark:text-[var(--gray-300)] group-hover:text-[var(--ink)]">
                    Or Select Demo Taxpayer
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1AA260]/10 text-[#1AA260]">
                    1-Click Demo
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--gray-400)] group-hover:text-[var(--ink)]">
                  <span className="text-[11px] font-normal hidden sm:inline">
                    {isDemoAccordionOpen ? 'Hide' : 'Expand'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDemoAccordionOpen ? 'rotate-180 text-[#1AA260]' : ''
                    }`}
                  />
                </div>
              </button>

              {isDemoAccordionOpen && (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(p.id)}
                      className="p-2.5 rounded-xl border border-[var(--input-border)] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-[#1AA260]/10 hover:border-[#1AA260]/40 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-[var(--ink)] group-hover:text-[#1AA260] truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-[var(--gray-500)] truncate">
                        {p.profile.email}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-[var(--gray-500)] hover:text-[var(--ink)] hover:underline cursor-pointer"
              >
                Cancel and return to {tspPrimaryName}
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STAGE 1: Confirm TSP & Select Account (Google Sign-In Style)       */}
        {/* ================================================================ */}
        {ceremonyStep === 'confirm' && (
          <div className="space-y-6">
            {/* Target TSP Application Emblem & Title Hierarchy */}
            <div className="flex flex-col items-center text-center pt-1 pb-1">
              <div className="w-16 h-16 rounded-2xl bg-[#123D35] text-emerald-400 flex items-center justify-center shadow-lg ring-4 ring-emerald-500/15 mb-3">
                <Building2 className="w-8 h-8 stroke-[2.2]" />
              </div>

              {/* Smaller pre-heading */}
              <p className="text-xs sm:text-[13px] font-medium text-[var(--gray-500)] tracking-tight">
                You&apos;re signing in to
              </p>

              {/* Eye-bold TSP name with distinct contrast / font color */}
              <h1 className="font-display font-black text-2xl sm:text-[28px] text-[#0A5C36] dark:text-emerald-400 tracking-tight leading-tight mt-0.5">
                {tspPrimaryName}
              </h1>

              {/* Secondary badge for platform descriptor (e.g. WHT Property Platform) */}
              {tspSubtitle && (
                <div className="mt-1.5">
                  <span className="inline-flex items-center text-[11px] font-semibold text-[var(--gray-600)] dark:text-[var(--gray-300)] bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--input-border)] px-2.5 py-0.5 rounded-full">
                    {tspSubtitle}
                  </span>
                </div>
              )}

              <p className="text-xs text-[var(--gray-500)] max-w-xs mt-2 leading-relaxed">
                Kaduna State Internal Revenue Service authorized tax compliance partner.
              </p>
            </div>

            {/* Account Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="w-full p-3 rounded-2xl border border-[var(--input-border)] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#1AA260] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                    {activePersona.identity.photoUrl ? (
                      <img
                        src={activePersona.identity.photoUrl}
                        alt={activeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeName[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-[var(--ink)] block truncate">
                      {activeName}
                    </span>
                    <span className="text-xs text-[var(--gray-600)] block truncate">
                      {activeEmail}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[var(--gray-500)]">
                  <span className="text-[10.5px] font-semibold text-[#1AA260] bg-[#1AA260]/10 px-2 py-0.5 rounded-full hidden sm:inline-block">
                    Active ID
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Persona Switcher Dropdown */}
              {isAccountDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--input-border)] rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in duration-150 max-h-64 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--gray-500)]">
                    Switch Demo Taxpayer Account
                  </div>
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPersona(p.id)}
                      className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer ${
                        p.profile.email === activeEmail
                          ? 'bg-[#1AA260]/10 text-[#1AA260] font-semibold'
                          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[var(--ink)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="block font-medium truncate">{p.name}</span>
                        <span className="block text-[11px] text-[var(--gray-500)] truncate">
                          {p.profile.email}
                        </span>
                      </div>
                      {p.profile.email === activeEmail && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}

                  {/* Switch to login form */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountDropdownOpen(false)
                      setCeremonyStep('login')
                    }}
                    className="w-full p-2.5 rounded-xl text-left border-t border-[var(--input-border)] text-xs text-[#1AA260] font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer mt-1"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Use another account / Sign in with credentials &rarr;</span>
                  </button>

                  {/* Register another account */}
                  <Link
                    to={`/auth/register?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                    className="w-full p-2.5 rounded-xl text-left border-t border-[var(--input-border)] text-xs text-[var(--gray-600)] dark:text-[var(--gray-300)] hover:text-[#1AA260] font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#1AA260]" />
                    <span>Register a new Kaduna State account &rarr;</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Privacy & Terms Text */}
            <div className="space-y-2 text-xs text-[var(--gray-600)] leading-relaxed pt-1">
              <p>
                Review <strong className="text-[var(--ink)] font-semibold">{tspPrimaryName}</strong>&apos;s{' '}
                <a href="#privacy" className="text-[#1AA260] hover:underline font-medium">
                  privacy policy
                </a>{' '}
                and{' '}
                <a href="#terms" className="text-[#1AA260] hover:underline font-medium">
                  Terms of Service
                </a>{' '}
                to understand how your rent tax records are processed.
              </p>
              <p className="text-[11px] text-[var(--gray-500)]">
                To manage or revoke application permissions at any time, visit your{' '}
                <span className="text-[var(--ink)] font-semibold">PayKaduna Profile</span>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--gray-200)]">
              <button
                type="button"
                onClick={handleCancel}
                className="w-1/2 py-3 rounded-full border border-[var(--input-border)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setCeremonyStep('scopes')}
                className="w-1/2 py-3 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STAGE 2: Scope Transparency & Data Permissions (NDPA 2023)        */}
        {/* ================================================================ */}
        {ceremonyStep === 'scopes' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1AA260]/10 text-[#1AA260] text-[11px] font-semibold mb-2">
                <CheckCircle2 className="w-3 h-3" />
                <span>Step 2 &bull; Data Sharing Permissions</span>
              </div>
              <h2 className="font-display font-bold text-xl text-[var(--ink)] tracking-tight">
                Review Shared Information
              </h2>
              <p className="text-xs text-[var(--gray-600)] mt-1 leading-relaxed">
                <strong className="text-[#0A5C36] dark:text-emerald-400 font-bold">{tspPrimaryName}</strong> requests the following verified attributes from your Kaduna State identity:
              </p>
            </div>

            {/* Scopes Cards */}
            <div className="space-y-2.5 text-xs">
              {/* Scope 1: Basic Identity */}
              <div className="p-3.5 rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] border border-[var(--input-border)] space-y-1">
                <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
                  <span>1. Verified Citizen Profile</span>
                  <span className="text-[#1AA260] text-[11px] font-mono">profile:read</span>
                </div>
                <div className="text-[11.5px] text-[var(--gray-600)] flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                  <span>
                    Name: <strong className="text-[var(--ink)]">{activeName}</strong>
                  </span>
                  <span>
                    Citizen ID: <strong className="font-mono text-[var(--ink)]">{activeCitizenId}</strong>
                  </span>
                  <span>Email: {activeEmail}</span>
                </div>
              </div>

              {/* Scope 2: Tax Jurisdiction */}
              <div className="p-3.5 rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] border border-[var(--input-border)] space-y-1">
                <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
                  <span>2. State Tax Jurisdiction</span>
                  <span className="text-[#1AA260] text-[11px] font-mono">tax:read</span>
                </div>
                <div className="text-[11.5px] text-[var(--gray-600)] flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                  <span>
                    State TIN: <strong className="font-mono text-[var(--ink)]">{activeTin}</strong>
                  </span>
                  <span>Office: {activeTaxOffice}</span>
                </div>
              </div>

              {/* Scope 3: Rent Tax Operations */}
              <div className="p-3.5 rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] border border-[var(--input-border)] space-y-1">
                <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
                  <span>3. Rent Tax Administration</span>
                  <span className="text-[#1AA260] text-[11px] font-mono">rent:manage</span>
                </div>
                <p className="text-[11.5px] text-[var(--gray-600)] leading-relaxed">
                  Query registered properties and record Withholding Tax on Rent payments directly on your state tax ledger.
                </p>
              </div>

              {/* Strict NDPA NIN Shield Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#123D35] dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#1AA260]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>NDPA 2023 Statutory Shield</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your raw 11-digit National Identity Number (NIN) is <strong>NEVER</strong> shared with <span className="font-semibold">{tspPrimaryName}</span>. Only your anonymous Citizen ID is transmitted.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--gray-200)]">
              <button
                type="button"
                onClick={() => setCeremonyStep('confirm')}
                className="w-1/3 py-3 rounded-full border border-[var(--input-border)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleAuthorizeAndProceed}
                className="w-2/3 py-3 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Authorize &amp; Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STAGE 3: Completed / Simulation Feedback Card                      */}
        {/* ================================================================ */}
        {ceremonyStep === 'completed' && (
          <div className="space-y-5 animate-in fade-in duration-200 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-display font-bold text-xl text-[var(--ink)]">
                Authorization Successful!
              </h2>
              <p className="text-xs text-[var(--gray-600)] mt-1">
                Audience-locked token generated for <strong className="text-[#0A5C36] dark:text-emerald-400 font-bold">{tspPrimaryName}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-[var(--input-border)] text-left text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[var(--gray-500)] font-semibold text-[11px] uppercase">
                  Callback URL with Claims
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="text-xs text-[#1AA260] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-[10.5px] p-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[var(--ink)] break-all max-h-24 overflow-y-auto">
                {generatedCallbackUrl}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {generatedCallbackUrl && (
                <a
                  href={generatedCallbackUrl}
                  className="w-full py-3 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Simulate Open {tspPrimaryName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setCeremonyStep('confirm')}
                className="w-full py-2.5 rounded-full border border-[var(--input-border)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-semibold text-[var(--gray-700)] cursor-pointer"
              >
                Restart Authorization Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

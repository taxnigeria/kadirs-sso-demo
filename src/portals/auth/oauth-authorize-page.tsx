import { useState, useRef, useEffect } from 'react'
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
  UserPlus,
  User,
  Mail,
  Landmark,
  Sun,
  Moon,
  Globe
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useAdminEngine } from '@/engine/admin-engine'
import { useEventLogger } from '@/engine/event-logger'
import { buildToken } from '@/engine/token-builder'
import { useThemeStore } from '@/engine/theme-store'
import { DEMO_PERSONAS } from '@/data/personas'
import { toast } from 'sonner'

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

  const { theme, toggleTheme } = useThemeStore()

  // Step state: 'login' (Credentials when not authenticated) | 'confirm' (App Card & Account) | 'completed' (Demo feedback)
  const [ceremonyStep, setCeremonyStep] = useState<'login' | 'confirm' | 'completed'>(() => {
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
  const [selectedLanguage, setSelectedLanguage] = useState('en-NG')

  const accountDropdownRef = useRef<HTMLDivElement>(null)

  // Auto-close account dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
  const tspSubtitle = nameMatch && nameMatch[2] ? nameMatch[2].trim() : 'WHT Property Platform'

  // Active persona resolution (Honors requested param, active currentUser, or defaults to Amina for demo)
  const activePersona =
    (requestedPersonaParam ? DEMO_PERSONAS.find((p) => p.id === requestedPersonaParam) : null) ||
    DEMO_PERSONAS.find((p) => p.profile.email === currentUser?.email) ||
    DEMO_PERSONAS.find((p) => p.id === 'fatima') ||
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
    <div className="min-h-screen bg-[#EEF2F6] dark:bg-[#121314] text-[var(--ink)] flex flex-col justify-between items-center px-4 py-6 sm:py-10 transition-colors select-none">
      {/* Top balance spacer */}
      <div className="hidden sm:block w-full max-w-[880px] h-2" aria-hidden="true" />

      {/* ── Main Google-Style Horizontal Authorization Card ── */}
      <div className="w-full max-w-[880px] bg-white dark:bg-[#1E1F20] text-[var(--ink)] border border-slate-200/80 dark:border-white/10 rounded-[28px] sm:rounded-[32px] shadow-xl dark:shadow-[0_24px_70px_rgba(0,0,0,0.6)] p-6 sm:p-8 md:p-10 lg:p-12 relative transition-all my-auto">
        
        {/* Top Header: Identity Authority & Security Metadata */}
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1AA260] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-[13px] font-bold tracking-tight text-[var(--ink)]">
              Sign in with Kaduna State SSO
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[10.5px] font-mono text-[var(--gray-500)] dark:text-gray-400 uppercase tracking-wider bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-white/10">
              OAuth 2.0 PKCE
            </span>

            {/* Theme switcher for instant preview of light & dark aesthetics */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-[var(--gray-500)] dark:text-gray-400 hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* STAGE 1: Horizontal Google Sign-In Layout (User Authenticated)      */}
        {/* ================================================================ */}
        {ceremonyStep === 'confirm' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start pt-6 sm:pt-8 animate-in fade-in duration-200">
            
            {/* Left Column: TSP Application Identity & Active Account Selector */}
            <div className="space-y-5">
              {/* TSP App Emblem */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#123D35] text-emerald-400 flex items-center justify-center shadow-lg ring-4 ring-emerald-500/15">
                <Building2 className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
              </div>

              <div>
                <p className="text-xs sm:text-[13px] font-medium text-[var(--gray-500)] tracking-tight">
                  You&apos;re signing in to
                </p>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)] tracking-tight leading-tight mt-0.5">
                  {tspPrimaryName}
                </h1>

                {tspSubtitle && (
                  <div className="mt-2">
                    <span className="inline-flex items-center text-[11px] font-semibold text-[var(--gray-600)] dark:text-[var(--gray-300)] bg-black/[0.04] dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 px-2.5 py-0.5 rounded-full">
                      {tspSubtitle}
                    </span>
                  </div>
                )}

                <p className="text-xs text-[var(--gray-500)] leading-relaxed mt-3 max-w-sm">
                  Kaduna State Internal Revenue Service authorized tax compliance partner.
                </p>
              </div>

              {/* Google-Style Account Selector Pill */}
              <div className="relative pt-1" ref={accountDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  aria-expanded={isAccountDropdownOpen}
                  aria-label="Switch account"
                  className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/10 text-xs sm:text-[13px] font-medium text-[var(--ink)] transition-colors cursor-pointer group shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-[#1AA260] text-white flex items-center justify-center text-[10px] font-bold">
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
                  <span className="truncate max-w-[200px]">{activeEmail}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[var(--gray-400)] group-hover:text-[var(--ink)] transition-transform duration-200 ${
                      isAccountDropdownOpen ? 'rotate-180 text-[#1AA260]' : ''
                    }`}
                  />
                </button>

                {/* Persona Switcher Dropdown (Floats beneath account pill) */}
                {isAccountDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#252628] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
                      Switch Demo Taxpayer Account
                    </div>
                    {DEMO_PERSONAS.map((p) => {
                      const isCurrent = p.profile.email === activeEmail
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPersona(p.id)}
                          className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center justify-between gap-2.5 text-xs cursor-pointer ${
                            isCurrent
                              ? 'bg-[#1AA260]/10 text-[#1AA260] font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-[var(--ink)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700">
                              <img
                                src={p.identity.photoUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="block font-medium truncate">{p.name}</span>
                              <span className="block text-[10.5px] text-[var(--gray-500)] truncate">
                                {p.profile.email}
                              </span>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-[#1AA260] shrink-0" />}
                        </button>
                      )
                    })}

                    {/* Switch to login credentials */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false)
                        setCeremonyStep('login')
                      }}
                      className="w-full p-2.5 rounded-xl text-left border-t border-slate-100 dark:border-white/10 text-xs text-[#1AA260] font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer mt-1"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Use another account / Sign in &rarr;</span>
                    </button>

                    {/* Register another account */}
                    <Link
                      to={`/auth/register?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                      className="w-full p-2.5 rounded-xl text-left border-t border-slate-100 dark:border-white/10 text-xs text-[var(--gray-600)] dark:text-[var(--gray-300)] hover:text-[#1AA260] font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#1AA260]" />
                      <span>Register a new Kaduna State account &rarr;</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Scopes Disclosure & Action Buttons (Matches Google's Right Column) */}
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] leading-snug">
                  Kaduna State SSO will allow <strong className="text-[#0A5C36] dark:text-emerald-400 font-extrabold">{tspPrimaryName}</strong> to access this info about you
                </h2>
              </div>

              {/* Scopes & Identity Attributes List */}
              <div className="space-y-3.5 text-xs sm:text-[13px]">
                {/* 1. Verified Profile */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--gray-500)] shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-[var(--ink)] block truncate">{activeName}</span>
                    <span className="text-[var(--gray-500)] block text-xs">Name and verified profile picture</span>
                  </div>
                </div>

                {/* 2. Email Address */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--gray-500)] shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-[var(--ink)] block truncate">{activeEmail}</span>
                    <span className="text-[var(--gray-500)] block text-xs">Email address</span>
                  </div>
                </div>

                {/* 3. State Tax & Revenue Jurisdiction */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--gray-500)] shrink-0 mt-0.5">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-[var(--ink)] block truncate">State Tax Jurisdiction &amp; WHT Status</span>
                    <span className="text-[var(--gray-500)] block text-xs truncate">TIN: {activeTin} · {activeTaxOffice}</span>
                  </div>
                </div>
              </div>

              {/* Statutory Privacy & Policy Notice */}
              <div className="text-xs text-[var(--gray-500)] leading-relaxed space-y-2 pt-4 border-t border-slate-200/80 dark:border-white/10">
                <p>
                  Review <strong className="text-[var(--ink)] font-semibold">{tspPrimaryName}</strong>&apos;s{' '}
                  <button
                    type="button"
                    onClick={() => toast.info('Privacy Policy', { description: `${tspPrimaryName} operates under Kaduna State Data Protection Framework & NDPA 2023.` })}
                    className="text-[#1AA260] dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    privacy policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => toast.info('Terms of Service', { description: 'Subject to KADIRS Authorized Technology Service Provider Agreement.' })}
                    className="text-[#1AA260] dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    Terms of Service
                  </button>{' '}
                  to understand how your rent tax records are processed.
                </p>

                <p>
                  To make changes at any time, visit your{' '}
                  <Link to="/auth/profile" className="text-[#1AA260] dark:text-emerald-400 hover:underline font-medium">
                    Kaduna State Account
                  </Link>.
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--gray-400)] pt-0.5">
                  <Lock className="w-3 h-3 text-[#1AA260] shrink-0" />
                  <span>NDPA 2023 Shield: Your raw 11-digit NIN is never shared.</span>
                </div>
              </div>

              {/* Action Buttons (Matches Google's Bottom Right Buttons in Image 2) */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-xs sm:text-sm font-semibold text-[var(--ink)] transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAuthorizeAndProceed}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STAGE 0: Horizontal Google Sign-In Layout (Unauthenticated User)   */}
        {/* ================================================================ */}
        {ceremonyStep === 'login' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start pt-6 sm:pt-8 animate-in fade-in duration-200">
            
            {/* Left Column: Sign-in Context */}
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#123D35] text-emerald-400 flex items-center justify-center shadow-lg ring-4 ring-emerald-500/15 mb-2">
                <Building2 className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)] tracking-tight leading-tight">
                Sign in
              </h1>

              <p className="text-sm font-medium text-[var(--gray-600)] dark:text-[var(--gray-300)]">
                to continue to <strong className="text-[#0A5C36] dark:text-emerald-400 font-bold">{tspPrimaryName}</strong>
              </p>

              <p className="text-xs text-[var(--gray-500)] leading-relaxed max-w-sm pt-2">
                Use your official Kaduna State Single Sign-On credentials (NIN, Phone, or Email) to grant authenticated access.
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-white/10 text-xs text-[var(--gray-500)] space-y-2">
                <div className="flex items-center gap-2 text-[#1AA260] font-semibold text-[11px]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Statutory NDPA 2023 Identity Protection</span>
                </div>
              </div>
            </div>

            {/* Right Column: Credentials Form & Demo Accordion */}
            <div className="space-y-4">
              <form onSubmit={handlePerformLogin} className="space-y-3.5">
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/[0.04] text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[#1AA260]"
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
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/[0.04] text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[#1AA260]"
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
                    className="w-full py-2.5 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmittingLogin ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <span>Sign In &amp; Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Registration Link */}
                <div className="text-center pt-1.5 pb-0.5">
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
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsDemoAccordionOpen(!isDemoAccordionOpen)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/10 text-left transition-all cursor-pointer group"
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
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:bg-[#1AA260]/10 hover:border-[#1AA260]/40 text-left transition-all group cursor-pointer"
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

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-xs text-[var(--gray-500)] hover:text-[var(--ink)] hover:underline cursor-pointer"
                >
                  Cancel and return to {tspPrimaryName}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STAGE 3: Completed / Simulation Feedback Card                      */}
        {/* ================================================================ */}
        {ceremonyStep === 'completed' && (
          <div className="py-6 sm:py-8 space-y-6 text-center animate-in fade-in duration-200 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#1AA260] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-display font-black text-2xl text-[var(--ink)]">
                Authorization Successful!
              </h2>
              <p className="text-xs sm:text-sm text-[var(--gray-600)] mt-1">
                Audience-locked token generated for <strong className="text-[#0A5C36] dark:text-emerald-400 font-bold">{tspPrimaryName}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[var(--gray-500)] font-semibold text-[11px] uppercase tracking-wider">
                  Callback URL with Signed Token
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="text-xs text-[#1AA260] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-[11px] p-2.5 rounded-xl bg-white dark:bg-black/30 border border-slate-200/60 dark:border-white/10 text-[var(--ink)] break-all max-h-24 overflow-y-auto">
                {generatedCallbackUrl}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {generatedCallbackUrl && (
                <a
                  href={generatedCallbackUrl}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Simulate Open {tspPrimaryName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setCeremonyStep('confirm')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-xs sm:text-sm font-semibold text-[var(--gray-700)] dark:text-gray-300 cursor-pointer"
              >
                Restart Authorization Demo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Google-Style Footer (Language Picker + Help, Privacy, Terms) ── */}
      <footer className="w-full max-w-[880px] mx-auto pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--gray-500)] dark:text-gray-400">
        {/* Language Picker Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <Globe className="w-3.5 h-3.5 text-[var(--gray-400)] shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value)
                toast.success(`Language set to ${e.target.options[e.target.selectedIndex].text}`)
              }}
              aria-label="Select language"
              className="bg-transparent text-xs text-[var(--gray-600)] dark:text-gray-300 cursor-pointer focus:outline-none appearance-none pr-4"
            >
              <option value="en-NG" className="dark:bg-[#1E1F20] dark:text-white">English (Nigeria)</option>
              <option value="ha" className="dark:bg-[#1E1F20] dark:text-white">Hausa (Harshen Hausa)</option>
              <option value="yo" className="dark:bg-[#1E1F20] dark:text-white">Yoruba (Èdè Yorùbá)</option>
              <option value="ig" className="dark:bg-[#1E1F20] dark:text-white">Igbo (Asụsụ Igbo)</option>
              <option value="en-GB" className="dark:bg-[#1E1F20] dark:text-white">English (United Kingdom)</option>
              <option value="en-US" className="dark:bg-[#1E1F20] dark:text-white">English (United States)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[var(--gray-400)] -ml-3 pointer-events-none" />
          </div>
        </div>

        {/* Legal & Help Links (Matches Image 2) */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => {
              toast.info('Kaduna State SSO Help', {
                description: 'For citizen taxpayer support or OAuth integration inquiries, email support@kadirs.kdsg.gov.ng or call toll-free +234 800-KADIRS.'
              })
            }}
            className="hover:text-[var(--ink)] dark:hover:text-white hover:underline transition-colors cursor-pointer"
          >
            Help
          </button>
          <button
            type="button"
            onClick={() => {
              toast.info('Privacy Notice', {
                description: 'Under NDPA 2023, personal records and tax assessments remain sovereign and protected. Data sharing requires explicit taxpayer authorization.'
              })
            }}
            className="hover:text-[var(--ink)] dark:hover:text-white hover:underline transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => {
              toast.info('Terms of Service', {
                description: 'Access to Kaduna State Identity Gateway is governed by statutory laws of Kaduna State and KADIRS Authorized Provider Regulations.'
              })
            }}
            className="hover:text-[var(--ink)] dark:hover:text-white hover:underline transition-colors cursor-pointer"
          >
            Terms
          </button>
        </div>
      </footer>
    </div>
  )
}

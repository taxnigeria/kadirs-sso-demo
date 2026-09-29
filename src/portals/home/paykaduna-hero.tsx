import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import {
  Car,
  GraduationCap,
  Stamp,
  Bus,
  Landmark,
  Trees,
  Building2,
  UserCheck,
  Dices,
  Pickaxe,
  ClipboardList,
  HandCoins,
  Banknote,
  Search,
  X,
  Menu,
  ChevronDown,
  Sparkles,
  FileCheck,
  AlertTriangle
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { PayKadunaLogo } from '@/components/layout/paykaduna-logo'
import paykadunaHeroBg from '@/assets/paykaduna-hero-bg.jpg'
import ibsLogoImg from '@/assets/ibs-logo.png'
import ndpcLogoImg from '@/assets/ndpc-logo.png'
import pcidssLogoImg from '@/assets/pcidss-logo.png'
import isoLogoImg from '@/assets/information-security-logo.png'
import {
  VerificationModal,
  DEMO_VERIFICATION_PRESETS,
  type VerificationDoc
} from './verification-modal'

interface PayKadunaHeroProps {
  /** Optional custom background image path or URL (provided by user) */
  backgroundImageUrl?: string
}

export function PayKadunaHero({ backgroundImageUrl }: PayKadunaHeroProps) {
  const currentUser = useAuthEngine((s) => s.currentUser)

  const [verifyQuery, setVerifyQuery] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [activeDoc, setActiveDoc] = useState<VerificationDoc | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const searchBoxRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsInputFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleVerify = (customCode?: string) => {
    const rawQuery = (customCode ?? verifyQuery).trim()
    const query = rawQuery.toUpperCase() || 'ETCC-2026-KAD-00847'
    setVerifyQuery(query)
    setIsInputFocused(false)

    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)

      if (DEMO_VERIFICATION_PRESETS[query]) {
        setActiveDoc(DEMO_VERIFICATION_PRESETS[query])
        return
      }

      if (query.includes('ETCC') || query.includes('TAX') || query.includes('CLEARANCE')) {
        setActiveDoc({
          ...DEMO_VERIFICATION_PRESETS['ETCC-2026-KAD-00847'],
          docNumber: query
        })
      } else if (query.includes('RCP') || query.includes('REC') || query.includes('VEHICLE')) {
        setActiveDoc({
          ...DEMO_VERIFICATION_PRESETS['RCP-2026-KV-3910'],
          docNumber: query
        })
      } else if (query.includes('FLAG') || query.includes('REVOKE') || query.includes('FAKE')) {
        setActiveDoc({
          ...DEMO_VERIFICATION_PRESETS['INV-FLAGGED-004'],
          docNumber: query
        })
      } else {
        setActiveDoc({
          ...DEMO_VERIFICATION_PRESETS['INV-2026-KDSME-991'],
          docNumber: query
        })
      }
    }, 320)
  }

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleVerify()
  }

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="relative w-full min-h-[100dvh] lg:h-[100dvh] bg-[#07191D] text-white flex flex-col justify-between select-none">
      {/* ── Background Layer: Official PayKaduna Durbar Background Image & Atmospheric Overlay ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Authentic Kaduna Durbar Camel Riders Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center sm:bg-[center_35%] bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: `url(${backgroundImageUrl || paykadunaHeroBg})` }}
        />

        {/* High-contrast dark gradient overlay matching PayKaduna */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, 
                rgba(7, 25, 29, 0.78) 0%, 
                rgba(7, 28, 32, 0.70) 35%, 
                rgba(7, 25, 29, 0.86) 75%, 
                rgba(6, 21, 24, 0.96) 100%
              )
            `
          }}
        />

        {/* Brand Aurora subtle glow accents */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 18% 22%, rgba(16, 185, 129, 0.16) 0%, transparent 45%),
              radial-gradient(circle at 82% 28%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 60%, rgba(5, 150, 105, 0.12) 0%, transparent 55%)
            `
          }}
        />

        {/* Subtle decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* ── Header / Top Navigation (Compact navbar: h-12 sm:h-14) ── */}
      <header className="relative z-20 w-full shrink-0 border-b border-white/10 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between">
          {/* Left: Official PayKaduna Emblem with Theme-Adaptive Typography */}
          <Link
            to="/"
            className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0"
            aria-label="PayKaduna Home"
          >
            <PayKadunaLogo
              markSize="md"
              textClassName="text-white font-black tracking-wider text-base sm:text-lg drop-shadow-xs"
            />
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-[13px] font-medium">
            <Link
              to="/"
              className="text-white font-semibold relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-white after:rounded-full"
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="text-white/80 hover:text-white transition-colors"
            >
              About us
            </a>
            <a
              href="#support"
              onClick={(e) => scrollToSection(e, 'support')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Contact us
            </a>
          </nav>

          {/* Right: Auth Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/80 font-mono hidden lg:inline-block px-2 py-0.5 rounded bg-white/10 border border-white/15">
                  {currentUser.email.split('@')[0]}
                </span>
                <Link
                  to="/paykaduna"
                  className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-[#07191D] text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  Dashboard &rarr;
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="px-4 py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs sm:text-[13px] font-medium transition-all backdrop-blur-xs border border-white/15 active:scale-95"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs sm:text-[13px] font-medium transition-all backdrop-blur-xs border border-white/15 active:scale-95"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2.5 pb-4 space-y-2 bg-[#07191D]/95 backdrop-blur-md border-b border-white/10 animate-in fade-in slide-in-from-top-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-white/10"
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="block px-3 py-1.5 rounded-md text-xs font-medium text-white/80 hover:text-white hover:bg-white/5"
            >
              About us
            </a>
            <a
              href="#support"
              onClick={(e) => scrollToSection(e, 'support')}
              className="block px-3 py-1.5 rounded-md text-xs font-medium text-white/80 hover:text-white hover:bg-white/5"
            >
              Contact us
            </a>
            <div className="pt-2 border-t border-white/10 flex gap-2">
              <Link
                to="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-medium border border-white/15 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-medium border border-white/15 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Center Content: The Compact Quote & Verify Bar with Autofill Popover ── */}
      <div className="relative z-40 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center shrink-0 min-h-0 flex-1 flex flex-col items-center justify-center py-1 sm:py-2">
        {/* Roosevelt Quote — refined, compact & readable */}
        <div className="max-w-2xl mx-auto space-y-1 mb-2 sm:mb-3 animate-in fade-in duration-500">
          <blockquote className="text-xs sm:text-sm md:text-base font-normal tracking-normal text-white/95 dark:text-white leading-snug font-sans drop-shadow-xs">
            “Taxes, after all, are dues that we pay for the privileges of membership in an organized society”
          </blockquote>
          <p className="text-[11px] sm:text-xs text-white/70 dark:text-white/80 font-normal tracking-wide">
            -Franklin D. Roosevelt
          </p>
        </div>

        {/* Verification / Search Bar Container with Autofill Popover */}
        <div ref={searchBoxRef} className="relative z-50 w-full max-w-lg mx-auto">
          <form
            onSubmit={handleVerifySubmit}
            className="w-full bg-white dark:bg-[#0B1E1A]/95 rounded-full p-1 sm:p-1.5 shadow-xl dark:shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex items-center border border-white/40 dark:border-white/20 backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-emerald-400/40"
          >
            <Search className="w-4 h-4 text-slate-400 dark:text-emerald-300/80 ml-3 mr-1.5 shrink-0" />
            <input
              type="text"
              value={verifyQuery}
              onFocus={() => setIsInputFocused(true)}
              onChange={(e) => setVerifyQuery(e.target.value)}
              placeholder="Verify Invoice, eTCC and Receipt"
              className="w-full bg-transparent py-1 px-1.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none text-xs sm:text-sm font-normal"
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="bg-[#1C3A33] hover:bg-[#142A25] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-[10.5px] sm:text-xs tracking-wider uppercase transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-75"
            >
              {isVerifying ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <span>VERIFY</span>
              )}
            </button>
          </form>

          {/* ── Autofill Popover (Appears automatically when input is active) ── */}
          {isInputFocused && (
            <div className="absolute top-full left-0 right-0 mt-2.5 z-50 bg-white dark:bg-[#0E2420] text-slate-900 dark:text-white rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_10px_25px_-5px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-slate-200 dark:border-white/15 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-black/30 border-b border-slate-100 dark:border-white/10 flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
                  <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Autofill Demo Records
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">Click to fill &amp; verify</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/10 max-h-64 overflow-y-auto">
                {/* 1. eTCC Fatima */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleVerify('ETCC-2026-KAD-00847')
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-emerald-50/80 dark:hover:bg-white/5 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <FileCheck size={15} />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 block">
                        ETCC-2026-KAD-00847
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Fatima Abdullahi · 3-Year Tax Clearance (eTCC)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                    eTCC
                  </span>
                </button>

                {/* 2. Vehicle Receipt Emeka */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleVerify('RCP-2026-KV-3910')
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-cyan-50/80 dark:hover:bg-white/5 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
                      <Car size={15} />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400 block">
                        RCP-2026-KV-3910
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Emeka Obi · Vehicle Registration (KAD-582-AA)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 shrink-0">
                    Receipt
                  </span>
                </button>

                {/* 3. Corporate Invoice Amina */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleVerify('INV-2026-KDSME-991')
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-amber-50/80 dark:hover:bg-white/5 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Building2 size={15} />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 block">
                        INV-2026-KDSME-991
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Yusuf Agro-Allied SME · Environmental Assessment
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0">
                    Invoice
                  </span>
                </button>

                {/* 4. Flagged Ref */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleVerify('INV-FLAGGED-004')
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-rose-50/80 dark:hover:bg-white/5 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                      <AlertTriangle size={15} />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-400 block">
                        INV-FLAGGED-004
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Revoked Reference · Anti-Fraud Telemetry Alert
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 shrink-0">
                    Flagged
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Official PayKaduna Services Matrix (Exact Layout from paykaduna.com, Kept Portable) ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-8 sm:pb-10 lg:pb-12 pt-1 shrink-0">
        
        {/* Tier 1: Upper Row (Motor Vehicle Admin [Left] + 5 Central Icon Badges + Lands & Geographic Fees [Right]) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 items-stretch mb-2 sm:mb-3">
          
          {/* Col 1: Motor Vehicle Administration (White Card) */}
          <Link
            to="/kadvreg"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-center min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Car className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-white leading-tight">
              Motor Vehicle<br />Administration
            </h3>
          </Link>

          {/* Col 2: Tertiary Education (White outline icon over background) */}
          <Link
            to="/paykaduna/services"
            className="flex flex-col items-center justify-center text-center p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/15 transition-all text-white group cursor-pointer min-h-[96px] sm:min-h-[105px]"
          >
            <GraduationCap className="w-6 h-6 mb-2 text-white/90 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-normal text-white/90 leading-tight">
              Tertiary Education
            </span>
          </Link>

          {/* Col 3: Stamp Duty (White outline icon over background) */}
          <Link
            to="/paykaduna/services"
            className="flex flex-col items-center justify-center text-center p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/15 transition-all text-white group cursor-pointer min-h-[96px] sm:min-h-[105px]"
          >
            <Stamp className="w-6 h-6 mb-2 text-white/90 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-normal text-white/90 leading-tight">
              Stamp Duty
            </span>
          </Link>

          {/* Col 4: Transport (White outline icon over background) */}
          <Link
            to="/paykaduna/services"
            className="flex flex-col items-center justify-center text-center p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/15 transition-all text-white group cursor-pointer min-h-[96px] sm:min-h-[105px]"
          >
            <Bus className="w-6 h-6 mb-2 text-white/90 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-normal text-white/90 leading-tight">
              Transport
            </span>
          </Link>

          {/* Col 5: LGA Collections (White outline icon over background) */}
          <Link
            to="/paykaduna/services"
            className="flex flex-col items-center justify-center text-center p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/15 transition-all text-white group cursor-pointer min-h-[96px] sm:min-h-[105px]"
          >
            <Landmark className="w-6 h-6 mb-2 text-white/90 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-normal text-white/90 leading-tight">
              LGA Collections
            </span>
          </Link>

          {/* Col 6: Forestry Collections (White outline icon over background) */}
          <Link
            to="/paykaduna/services"
            className="flex flex-col items-center justify-center text-center p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/15 transition-all text-white group cursor-pointer min-h-[96px] sm:min-h-[105px]"
          >
            <Trees className="w-6 h-6 mb-2 text-white/90 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-normal text-white/90 leading-tight">
              Forestry Collections
            </span>
          </Link>

          {/* Col 7: Lands & Geographic Fees (White Card) */}
          <Link
            to="/paykaduna/services"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-center min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-white leading-tight">
              Lands &amp; Geographic<br />Fees
            </h3>
          </Link>
        </div>

        {/* Tier 2: Lower Row (7 Distinct White Cards, Perfectly Aligned Under Tier 1 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          
          {/* Card 1: Personal Income Tax & Direct Assessment (Col 1) */}
          <Link
            to="/pit"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#C026D3] dark:text-fuchsia-400 group-hover:scale-110 transition-transform shrink-0">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">
              Personal Income Tax &amp; Direct Assessment
            </span>
          </Link>

          {/* Card 2: Betting, Pools & Lottery (Col 2) */}
          <Link
            to="/paykaduna/services"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#EF4444] dark:text-rose-400 group-hover:scale-110 transition-transform shrink-0">
              <Dices className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">
              Betting, Pools &amp; Lottery
            </span>
          </Link>

          {/* Card 3: Environment & Natural resources (Col 3) */}
          <Link
            to="/paykaduna/services"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#06B6D4] dark:text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
              <Pickaxe className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">
              Environment &amp; Natural resources
            </span>
          </Link>

          {/* Card 4: MDA Collection (Col 4) */}
          <Link
            to="/paykaduna/services"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#8B5CF6] dark:text-violet-400 group-hover:scale-110 transition-transform shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">
              MDA Collection
            </span>
          </Link>

          {/* Card 5: Development Levies, Fees & Others (Col 5) */}
          <Link
            to="/paykaduna/services"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#D97706] dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">
              Development Levies, Fees &amp; Others
            </span>
          </Link>

          {/* Card 6: Education (Fees and licensing) (Col 6) */}
          <Link
            to="/paykaduna/services"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#2563EB] dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">
              Education (Fees and licensing)
            </span>
          </Link>

          {/* Card 7: Withholding Tax (Col 7) */}
          <Link
            to="/paykaduna/services"
            className="bg-white dark:bg-[#0B1E1A]/95 rounded-2xl p-3 sm:p-3.5 text-center shadow-md hover:shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[96px] sm:min-h-[105px] group border border-white/80 dark:border-white/15 dark:hover:bg-[#0F2823] cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#10B981] dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
              <Banknote className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">
              Withholding Tax
            </span>
          </Link>
        </div>

        {/* ── Official PayKaduna Compliance Logos & Copyright Strip (Matches PayKaduna.com) ── */}
        <div className="w-full flex flex-wrap text-white/90 justify-center items-center gap-3 sm:gap-6 mt-3 sm:mt-4 mb-1">
          <p className="w-full sm:w-auto text-center text-xs sm:text-[13px] font-normal text-white/80 tracking-wide">
            &copy; copyright 2026
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4 bg-white/95 px-3.5 sm:px-4 py-1.5 rounded-full shadow-md">
            <img
              src={ibsLogoImg}
              alt="Intelligent Billing System (IBS)"
              className="h-6 sm:h-7 w-auto object-contain"
            />
            <img
              src={ndpcLogoImg}
              alt="Nigeria Data Protection Commission (NDPC)"
              className="h-6 sm:h-7 w-auto object-contain"
            />
            <img
              src={pcidssLogoImg}
              alt="PCI DSS Compliant"
              className="h-6 sm:h-7 w-auto object-contain"
            />
            <img
              src={isoLogoImg}
              alt="ISO 27001 Certified Information Security Management"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </div>
        </div>

        {/* Subtle scroll hint to indicate continuity with the page */}
        <div className="flex justify-center mt-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="flex items-center gap-1 text-[11px] text-white/75 hover:text-white"
          >
            <span>Explore Kaduna Identity Gateway</span>
            <ChevronDown size={14} className="animate-bounce" />
          </a>
        </div>
      </div>

      {/* ── Full-Screen Official Verification Modal ── */}
      {activeDoc && (
        <VerificationModal doc={activeDoc} onClose={() => setActiveDoc(null)} />
      )}
    </div>
  )
}

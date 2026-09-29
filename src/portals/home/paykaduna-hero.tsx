import { useState } from 'react'
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
  CheckCircle2,
  X,
  Menu
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'

/**
 * Authentic PayKaduna rosette / spiral logo mark
 */
export function PayKadunaLogo({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pk-teal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="pk-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Central swirling spiral rosette */}
      <circle cx="20" cy="20" r="18" fill="url(#pk-teal)" opacity="0.15" />
      <g transform="rotate(0 20 20)">
        <path
          d="M20 5C22.5 10 25 15 20 20C15 25 10 22.5 5 20C10 15 15 10 20 5Z"
          fill="url(#pk-teal)"
          opacity="0.85"
        />
      </g>
      <g transform="rotate(45 20 20)">
        <path
          d="M20 5C22.5 10 25 15 20 20C15 25 10 22.5 5 20C10 15 15 10 20 5Z"
          fill="url(#pk-green)"
          opacity="0.75"
        />
      </g>
      <g transform="rotate(90 20 20)">
        <path
          d="M20 5C22.5 10 25 15 20 20C15 25 10 22.5 5 20C10 15 15 10 20 5Z"
          fill="url(#pk-teal)"
          opacity="0.85"
        />
      </g>
      <g transform="rotate(135 20 20)">
        <path
          d="M20 5C22.5 10 25 15 20 20C15 25 10 22.5 5 20C10 15 15 10 20 5Z"
          fill="url(#pk-green)"
          opacity="0.75"
        />
      </g>
      <circle cx="20" cy="20" r="4.5" fill="#FFFFFF" />
      <circle cx="20" cy="20" r="2.2" fill="#0E7490" />
    </svg>
  )
}

interface PayKadunaHeroProps {
  /** Optional custom background image path or URL (provided by user) */
  backgroundImageUrl?: string
}

export function PayKadunaHero({ backgroundImageUrl }: PayKadunaHeroProps) {
  const currentUser = useAuthEngine((s) => s.currentUser)

  const [verifyQuery, setVerifyQuery] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean
    invoiceNo: string
    title: string
    amount: string
    date: string
    status: string
    taxpayer: string
  } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = verifyQuery.trim() || 'INV-KD-2026-08492'

    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setVerificationResult({
        valid: true,
        invoiceNo: query.toUpperCase(),
        title: 'Kaduna State Consolidated Revenue Assessment',
        amount: '₦ 45,000.00',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'Settled & Verified (KADIRS)',
        taxpayer: currentUser ? currentUser.email : 'Amina Gambo Yusuf'
      })
    }, 450)
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
    <div className="relative w-full min-h-[90vh] lg:min-h-[880px] bg-[#07191D] text-white overflow-hidden flex flex-col justify-between">
      {/* ── Background Layer: Custom Image or Blurred Aurora Mesh ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {backgroundImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
        ) : null}

        {/* Aurora Atmospheric Mesh Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07191D]/90 via-[#0A2624]/85 to-[#07191D]/95" />

        {/* Luminous Glow Orbs (Aurora Effect) */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/25 blur-3xl animate-pulse" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[110px]" />
        <div className="absolute top-1/2 left-1/3 w-[600px] h-[350px] rounded-full bg-emerald-600/15 blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[300px] rounded-full bg-amber-500/10 blur-[100px]" />

        {/* Subtle decorative grid/vignette */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)',
            backgroundSize: '36px 36px'
          }}
        />
      </div>

      {/* ── Header / Top Navigation (Embedded seamlessly in Hero) ── */}
      <header className="relative z-20 w-full border-b border-white/10 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
            aria-label="PayKaduna Home"
          >
            <PayKadunaLogo className="w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:rotate-12 duration-300" />
            <span className="font-extrabold text-xl sm:text-2xl tracking-wider text-white">
              PAYKADUNA
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
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
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-white/80 font-mono hidden lg:inline-block px-2.5 py-1 rounded bg-white/10 border border-white/15">
                  {currentUser.email.split('@')[0]}
                </span>
                <Link
                  to="/paykaduna"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#07191D] text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Dashboard &rarr;
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all backdrop-blur-xs active:scale-95"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-white text-[#07191D] text-xs font-bold transition-all shadow-sm active:scale-95"
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
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-3 pb-5 space-y-3 bg-[#07191D]/95 backdrop-blur-md border-b border-white/10 animate-in fade-in slide-in-from-top-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-semibold text-white bg-white/10"
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="block px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/5"
            >
              About us
            </a>
            <a
              href="#support"
              onClick={(e) => scrollToSection(e, 'support')}
              className="block px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/5"
            >
              Contact us
            </a>
            <div className="pt-3 border-t border-white/10 flex gap-2">
              <Link
                to="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-lg bg-white/10 text-white text-xs font-semibold border border-white/20"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-lg bg-emerald-500 text-[#07191D] text-xs font-bold"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Center Content: The Quote & Verify Bar ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 text-center flex-1 flex flex-col items-center justify-center">
        {/* Roosevelt Quote */}
        <div className="max-w-4xl mx-auto space-y-3 mb-8 sm:mb-10 animate-in fade-in duration-500">
          <blockquote className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-white leading-relaxed font-sans drop-shadow-md">
            “Taxes, after all, are dues that we pay for the privileges of membership in an organized society”
          </blockquote>
          <p className="text-sm sm:text-base text-white/85 font-normal tracking-wide">
            -Franklin D. Roosevelt
          </p>
        </div>

        {/* Verification / Search Bar */}
        <form
          onSubmit={handleVerifySubmit}
          className="w-full max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-full p-2 shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-white/40 backdrop-blur-md transition-all focus-within:ring-4 focus-within:ring-emerald-400/40"
        >
          <div className="flex items-center flex-1 w-full px-4 text-slate-800">
            <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0 hidden sm:block" />
            <input
              type="text"
              value={verifyQuery}
              onChange={(e) => setVerifyQuery(e.target.value)}
              placeholder="Verify Invoice, eTCC and Receipt"
              className="w-full bg-transparent py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm sm:text-base font-normal"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full sm:w-auto bg-[#1C3A33] hover:bg-[#142A25] text-white px-8 py-3.5 rounded-xl sm:rounded-full font-bold text-xs tracking-wider uppercase transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-75"
          >
            {isVerifying ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>VERIFY</span>
            )}
          </button>
        </form>

        {/* Simulated Verification Result Modal / Card */}
        {verificationResult && (
          <div className="mt-4 w-full max-w-xl p-4 bg-white/95 text-slate-900 rounded-2xl shadow-xl text-left border border-emerald-300 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="text-xs font-bold block uppercase tracking-wider">
                    Official KADIRS Verification Passed
                  </strong>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Ref: {verificationResult.invoiceNo}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerificationResult(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10.5px]">Title:</span>
                <span className="font-semibold">{verificationResult.title}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Amount:</span>
                <span className="font-semibold text-emerald-700 font-mono">{verificationResult.amount}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Taxpayer:</span>
                <span className="font-medium">{verificationResult.taxpayer}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Status:</span>
                <span className="font-bold text-emerald-600">{verificationResult.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Category / Service Cards Matrix ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-8 pt-4">
        {/* Tier 1: Floating Upper Row (Motor Vehicle Admin + Center Badges + Lands & Geographic Fees) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center mb-3.5">
          {/* Left Upper Card: Motor Vehicle Administration */}
          <Link
            to="/kadvreg"
            className="lg:col-span-3 bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-center text-center group cursor-pointer border border-white/60"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Car className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">
              Motor Vehicle<br />Administration
            </h3>
          </Link>

          {/* Center Badges: Tertiary Education, Stamp Duty, Transport, LGA, Forestry */}
          <div className="lg:col-span-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-2 px-1">
            <Link
              to="/paykaduna/services"
              className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all group"
            >
              <GraduationCap className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium leading-tight">Tertiary Education</span>
            </Link>

            <Link
              to="/paykaduna/services"
              className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all group"
            >
              <Stamp className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium leading-tight">Stamp Duty</span>
            </Link>

            <Link
              to="/paykaduna/services"
              className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all group"
            >
              <Bus className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium leading-tight">Transport</span>
            </Link>

            <Link
              to="/paykaduna/services"
              className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all group"
            >
              <Landmark className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium leading-tight">LGA Collections</span>
            </Link>

            <Link
              to="/paykaduna/services"
              className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all group"
            >
              <Trees className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium leading-tight">Forestry Collections</span>
            </Link>
          </div>

          {/* Right Upper Card: Lands & Geographic Fees */}
          <Link
            to="/paykaduna/services"
            className="lg:col-span-3 bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-center text-center group cursor-pointer border border-white/60"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">
              Lands &amp; Geographic<br />Fees
            </h3>
          </Link>
        </div>

        {/* Tier 2: 7 White Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Card 1: Personal Income Tax & Direct Assessment */}
          <Link
            to="/pit"
            className="bg-white rounded-2xl p-3.5 sm:p-4 text-center shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-between min-h-[140px] group border border-white/70"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#C026D3] group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight">
              Personal Income Tax &amp; Direct Assessment
            </span>
          </Link>

          {/* Card 2: Betting, Pools & Lottery */}
          <Link
            to="/paykaduna/services"
            className="bg-white rounded-2xl p-3.5 sm:p-4 text-center shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-between min-h-[140px] group border border-white/70"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#EF4444] group-hover:scale-110 transition-transform">
              <Dices className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight">
              Betting, Pools &amp; Lottery
            </span>
          </Link>

          {/* Card 3: Environment & Natural resources */}
          <Link
            to="/paykaduna/services"
            className="bg-white rounded-2xl p-3.5 sm:p-4 text-center shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-between min-h-[140px] group border border-white/70"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#06B6D4] group-hover:scale-110 transition-transform">
              <Pickaxe className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight">
              Environment &amp; Natural resources
            </span>
          </Link>

          {/* Card 4: MDA Collection */}
          <Link
            to="/paykaduna/services"
            className="bg-white rounded-2xl p-3.5 sm:p-4 text-center shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-between min-h-[140px] group border border-white/70"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight">
              MDA Collection
            </span>
          </Link>

          {/* Card 5: Development Levies, Fees & Others */}
          <Link
            to="/paykaduna/services"
            className="bg-white rounded-2xl p-3.5 sm:p-4 text-center shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-between min-h-[140px] group border border-white/70"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#D97706] group-hover:scale-110 transition-transform">
              <HandCoins className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight">
              Development Levies, Fees &amp; Others
            </span>
          </Link>

          {/* Card 6: Education (Fees and licensing) */}
          <Link
            to="/paykaduna/services"
            className="bg-white rounded-2xl p-3.5 sm:p-4 text-center shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-between min-h-[140px] group border border-white/70"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight">
              Education (Fees and licensing)
            </span>
          </Link>

          {/* Card 7: Withholding Tax */}
          <Link
            to="/paykaduna/services"
            className="bg-white rounded-2xl p-3.5 sm:p-4 text-center shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-between min-h-[140px] group border border-white/70"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#10B981] group-hover:scale-110 transition-transform">
              <Banknote className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight">
              Withholding Tax
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

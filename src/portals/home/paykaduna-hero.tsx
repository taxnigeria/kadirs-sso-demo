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
  Menu,
  ChevronDown
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import paykadunaLogoImg from '@/assets/paykaduna-logo.png'

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
    <div className="relative w-full h-screen max-h-screen bg-[#07191D] text-white overflow-hidden flex flex-col justify-between select-none">
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
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/25 blur-3xl animate-pulse" />
        <div className="absolute top-1/4 right-0 w-[420px] h-[420px] rounded-full bg-cyan-500/20 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[300px] rounded-full bg-emerald-600/15 blur-[110px]" />
        <div className="absolute bottom-10 right-1/4 w-[380px] h-[250px] rounded-full bg-amber-500/10 blur-[90px]" />

        {/* Subtle decorative grid/vignette */}
        <div
          className="absolute inset-0 opacity-[0.03]"
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
          {/* Left: Official Uploaded PayKaduna Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0"
            aria-label="PayKaduna Home"
          >
            <img
              src={paykadunaLogoImg}
              alt="PAYKADUNA"
              className="h-6 sm:h-7 w-auto object-contain"
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
                  className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-medium transition-all backdrop-blur-xs active:scale-95"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/register"
                  className="px-3 py-1.5 rounded-md bg-slate-200 hover:bg-white text-[#07191D] text-xs font-bold transition-all shadow-xs active:scale-95"
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
                className="flex-1 py-1.5 text-center rounded-md bg-white/10 text-white text-xs font-semibold border border-white/20"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-1.5 text-center rounded-md bg-emerald-500 text-[#07191D] text-xs font-bold"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Center Content: The Compact Quote & Verify Bar ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center shrink-0 min-h-0 flex-1 flex flex-col items-center justify-center py-1 sm:py-2">
        {/* Roosevelt Quote — refined, compact & readable */}
        <div className="max-w-2xl mx-auto space-y-1 mb-2.5 sm:mb-3 animate-in fade-in duration-500">
          <blockquote className="text-xs sm:text-sm md:text-base font-normal tracking-normal text-white/95 leading-snug font-sans drop-shadow-xs">
            “Taxes, after all, are dues that we pay for the privileges of membership in an organized society”
          </blockquote>
          <p className="text-[11px] sm:text-xs text-white/70 font-normal tracking-wide">
            -Franklin D. Roosevelt
          </p>
        </div>

        {/* Verification / Search Bar — compact pill */}
        <form
          onSubmit={handleVerifySubmit}
          className="w-full max-w-lg mx-auto bg-white rounded-full p-1 sm:p-1.5 shadow-xl flex items-center border border-white/40 backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-emerald-400/40"
        >
          <Search className="w-4 h-4 text-slate-400 ml-3 mr-1.5 shrink-0" />
          <input
            type="text"
            value={verifyQuery}
            onChange={(e) => setVerifyQuery(e.target.value)}
            placeholder="Verify Invoice, eTCC and Receipt"
            className="w-full bg-transparent py-1 px-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none text-xs sm:text-sm font-normal"
          />
          <button
            type="submit"
            disabled={isVerifying}
            className="bg-[#1C3A33] hover:bg-[#142A25] text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-[10.5px] sm:text-xs tracking-wider uppercase transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-75"
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

        {/* Simulated Verification Result Modal / Card */}
        {verificationResult && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4 bg-white text-slate-900 rounded-2xl shadow-2xl text-left border border-emerald-300 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="text-xs font-bold block uppercase tracking-wider">
                    Official KADIRS Verification Passed
                  </strong>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Ref: {verificationResult.invoiceNo}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerificationResult(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Title:</span>
                <span className="font-semibold text-[11px]">{verificationResult.title}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Amount:</span>
                <span className="font-semibold text-emerald-700 font-mono text-[11px]">{verificationResult.amount}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Taxpayer:</span>
                <span className="font-medium text-[11px]">{verificationResult.taxpayer}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Status:</span>
                <span className="font-bold text-emerald-600 text-[11px]">{verificationResult.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Grounded Category / Service Cards Matrix (Unified White Cards + Bottom Breathing Room) ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-14 pt-1 shrink-0">
        {/* Subtle Grounded Container / Platform */}
        <div className="bg-black/25 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 shadow-2xl space-y-2">
          
          {/* Row 1: 7 Symmetrical White Cards (Including Tertiary Education as a full white card!) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
            {/* 1. Motor Vehicle Administration */}
            <Link
              to="/kadvreg"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#10B981] group-hover:scale-110 transition-transform shrink-0">
                <Car className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Motor Vehicle Administration
              </span>
            </Link>

            {/* 2. Lands & Geographic Fees */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#F59E0B] group-hover:scale-110 transition-transform shrink-0">
                <Building2 className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Lands &amp; Geographic Fees
              </span>
            </Link>

            {/* 3. Tertiary Education (Now same size as the white ones!) */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70 ring-1 ring-blue-500/20"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform shrink-0">
                <GraduationCap className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Tertiary Education
              </span>
            </Link>

            {/* 4. Transport Services */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#6366F1] group-hover:scale-110 transition-transform shrink-0">
                <Bus className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Transport Services
              </span>
            </Link>

            {/* 5. Stamp Duty */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#E11D48] group-hover:scale-110 transition-transform shrink-0">
                <Stamp className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Stamp Duty
              </span>
            </Link>

            {/* 6. LGA Collections */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#06B6D4] group-hover:scale-110 transition-transform shrink-0">
                <Landmark className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                LGA Collections
              </span>
            </Link>

            {/* 7. Forestry Collections */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#059669] group-hover:scale-110 transition-transform shrink-0">
                <Trees className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Forestry Collections
              </span>
            </Link>
          </div>

          {/* Row 2: 7 Symmetrical White Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
            {/* 8. Personal Income Tax & Direct Assessment */}
            <Link
              to="/pit"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#C026D3] group-hover:scale-110 transition-transform shrink-0">
                <UserCheck className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Personal Income Tax
              </span>
            </Link>

            {/* 9. Betting, Pools & Lottery */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#EF4444] group-hover:scale-110 transition-transform shrink-0">
                <Dices className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Betting, Pools &amp; Lottery
              </span>
            </Link>

            {/* 10. Environment & Natural resources */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#06B6D4] group-hover:scale-110 transition-transform shrink-0">
                <Pickaxe className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Environment &amp; Resources
              </span>
            </Link>

            {/* 11. MDA Collection */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform shrink-0">
                <ClipboardList className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                MDA Collection
              </span>
            </Link>

            {/* 12. Development Levies, Fees & Others */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#D97706] group-hover:scale-110 transition-transform shrink-0">
                <HandCoins className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Development Levies &amp; Fees
              </span>
            </Link>

            {/* 13. Education (Fees & licensing) */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform shrink-0">
                <GraduationCap className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Education Fees &amp; Licensing
              </span>
            </Link>

            {/* 14. Withholding Tax */}
            <Link
              to="/paykaduna/services"
              className="bg-white rounded-xl p-2 sm:p-2.5 text-center shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] group border border-white/70"
            >
              <div className="w-6 h-6 flex items-center justify-center text-[#10B981] group-hover:scale-110 transition-transform shrink-0">
                <Banknote className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-800 leading-tight line-clamp-2">
                Withholding Tax
              </span>
            </Link>
          </div>
        </div>

        {/* Subtle scroll hint to indicate continuity with the page */}
        <div className="flex justify-center mt-2 opacity-60 hover:opacity-100 transition-opacity">
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
    </div>
  )
}

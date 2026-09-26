import { useState } from 'react'
import { Link } from 'react-router'
import {
  ShieldCheck,
  ArrowRight,
  ArrowDownRight,
  Check,
  LockKeyhole,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  Cpu,
  Wifi,
  QrCode,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Car,
  Wallet,
  FileText
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useThemeStore } from '@/engine/theme-store'
import { usePresentationStore } from '@/engine/presentation-store'
import { useInspectorStore } from '@/engine/inspector-store'

function DigitalIdentityVisual() {
  const [activeTab, setActiveTab] = useState<'pass' | 'federation' | 'vault'>('pass')
  const [ninRevealed, setNinRevealed] = useState(false)
  const [simulatedService, setSimulatedService] = useState<'paykaduna' | 'kadvreg' | 'pit'>('kadvreg')
  const [simulating, setSimulating] = useState(false)
  const [handshakeDone, setHandshakeDone] = useState(true)

  const handleSimulate = (svc: 'paykaduna' | 'kadvreg' | 'pit') => {
    setSimulatedService(svc)
    setSimulating(true)
    setHandshakeDone(false)
    setTimeout(() => {
      setSimulating(false)
      setHandshakeDone(true)
    }, 450)
  }

  return (
    <div className="space-y-3">
      {/* Header Bar with 3 interactive mode pills */}
      <div className="flex items-center justify-between text-[11px] font-bold tracking-wider px-1 text-[var(--gray-500)]">
        <div className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1AA260] animate-pulse" />
          <span>Interactive Digital Identity</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--paper-raised)] dark:bg-white/5 border border-[var(--line)] p-0.5 rounded-full text-[10px]">
          {(['pass', 'federation', 'vault'] as const).map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#1AA260] text-white shadow-2xs'
                  : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
              }`}
            >
              0{idx + 1} {tab === 'pass' ? 'Smart Pass' : tab === 'federation' ? 'SSO Flow' : 'Data Vault'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visual Display Container */}
      <div className="relative min-h-[420px] bg-gradient-to-br from-[#041E18] via-[#08352B] to-[#041E18] rounded-[28px] p-5 sm:p-6 text-white overflow-hidden shadow-[0_24px_55px_rgba(4,30,24,0.38)] border border-emerald-500/20 flex flex-col justify-between">
        {/* Holographic Ambient Lights */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-emerald-400/5 pointer-events-none" />
        </div>

        {/* ── TAB 1: SMART CITIZEN PASS ── */}
        {activeTab === 'pass' && (
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Pass Topline */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-300 block leading-tight">
                    Kaduna Digital Pass
                  </span>
                  <span className="text-[9px] text-white/60 tracking-wider">
                    Official Citizen Credential • KADIRS
                  </span>
                </div>
              </div>

              {/* Gold Smart Chip + Contactless Wave */}
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-300/80 rotate-90" />
                <div className="w-9 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-400/80 flex items-center justify-center shadow-xs">
                  <Cpu className="w-4 h-4 text-amber-950/80 stroke-[2]" />
                </div>
              </div>
            </div>

            {/* Citizen Data & Biometric Card Center */}
            <div className="py-1 flex items-start gap-4">
              {/* Biometric Hologram Avatar Frame */}
              <div className="relative shrink-0">
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="w-10 h-10 rounded-full bg-emerald-800/40 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-1">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-200">
                    AAL2
                  </span>
                </div>
                {/* Verified Check Badge */}
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1AA260] border-2 border-[#07352C] flex items-center justify-center text-white shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Citizen Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  NIMC Master Record
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate leading-tight">
                  Bello Mohammed Danjuma
                </h3>

                <div className="space-y-1 text-xs">
                  {/* NIN with reveal button */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/60 uppercase font-semibold">NIN:</span>
                    <span className="font-mono font-bold text-white text-[11px] tracking-wider">
                      {ninRevealed ? '5491 8021 3482' : '5491 •••• •••• 82'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNinRevealed(!ninRevealed)}
                      className="text-white/60 hover:text-white p-0.5 cursor-pointer transition-colors"
                      title={ninRevealed ? 'Mask NIN' : 'Reveal NIN (Demo)'}
                    >
                      {ninRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* State TIN */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/60 uppercase font-semibold">State TIN:</span>
                    <span className="font-mono text-emerald-300 font-bold text-[11px]">
                      KD-2026-9041-A
                    </span>
                  </div>

                  {/* Jurisdiction */}
                  <div className="text-[10px] text-white/70">
                    Tax Office: <span className="text-white font-medium">Kaduna North LGA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Portals Ribbon */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-emerald-300">
                <span>Active Single Sign-On Tunnels</span>
                <span className="text-white/60 font-mono">14 MDAs</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 text-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-white truncate">PayKaduna</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 text-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-white truncate">KADVREG</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 text-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-white truncate">PIT e-Tax</span>
                </div>
              </div>
            </div>

            {/* Pass Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-300 shrink-0" />
                <div className="text-[9px] text-white/60 leading-tight">
                  <span className="block font-mono text-emerald-300">SEC-ID: KD-NIMC-2026</span>
                  <span>Cryptographically Verified</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('federation')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-300 text-[10px] font-bold border border-emerald-400/40 transition-colors cursor-pointer"
              >
                <span>Test SSO Flow</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: LIVE SSO FEDERATION SIMULATOR ── */}
        {activeTab === 'federation' && (
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Topline */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live SSO Handshake Simulator
                </span>
              </div>
              <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-400/30">
                0 Passwords Required
              </span>
            </div>

            {/* Interactive Service Selectors */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                Select target portal to simulate 1-click token launch:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'paykaduna' as const, name: 'PayKaduna', icon: Wallet, desc: 'Revenue' },
                  { id: 'kadvreg' as const, name: 'KADVREG', icon: Car, desc: 'Vehicles' },
                  { id: 'pit' as const, name: 'PIT e-Tax', icon: FileText, desc: 'Assessments' }
                ].map((s) => {
                  const Icon = s.icon
                  const isSelected = simulatedService === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSimulate(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 shadow-sm'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-300' : 'text-white/60'}`} />
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                      </div>
                      <strong className="text-xs font-bold text-white block leading-tight">{s.name}</strong>
                      <span className="text-[9px] text-white/50 block mt-0.5">{s.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Simulated Live Token Exchange Box */}
            <div className="bg-[#051C17] border border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-emerald-300 font-mono">
                <span>Handshake Protocol: OAuth 2.0 PKCE</span>
                <span>Latency: 0.28s</span>
              </div>
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 text-xs font-mono font-bold">
                  NIN
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 rounded-full transition-all duration-300 ${
                        simulating ? 'w-1/2' : 'w-full'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                    {simulating ? 'Encrypting scoped token...' : 'Token audience verified ✓'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 text-xs font-bold capitalize">
                  {simulatedService === 'paykaduna' ? 'PK' : simulatedService === 'kadvreg' ? 'KV' : 'PIT'}
                </div>
              </div>

              {handshakeDone && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-200">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Citizen authenticated automatically without login prompt.</span>
                  </span>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleSimulate(simulatedService)}
                className="px-4 py-2 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Re-trigger Handshake</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className="text-white/60 hover:text-white text-[11px] underline cursor-pointer"
              >
                Inspect Data Vault →
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: NDPA CITIZEN PRIVACY VAULT ── */}
        {activeTab === 'vault' && (
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Topline */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  NDPA 2023 Citizen Privacy Vault
                </span>
              </div>
              <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Citizen Sovereign Control
              </span>
            </div>

            {/* 3 Privacy Pillars */}
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">NIMC Biometric Master Lock</h4>
                  <p className="text-[10px] text-white/60 leading-relaxed mt-0.5">
                    Your raw biometrics never touch commercial servers. Only verified cryptographic claims are validated.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Data Minimization Enforced</h4>
                  <p className="text-[10px] text-white/60 leading-relaxed mt-0.5">
                    Vehicle portals only see vehicle records. Tax portals only see tax data. Ministries cannot cross-inspect.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant Consent Revocation</h4>
                  <p className="text-[10px] text-white/60 leading-relaxed mt-0.5">
                    Revoke access to any ministry or TSP in 1 click from your Citizen Profile at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Vault Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>NDPA Statutory Compliance Active</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('pass')}
                className="text-white/60 hover:text-white text-[11px] underline cursor-pointer"
              >
                Back to Smart Pass →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visual Card Caption */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--gray-500)] pt-1">
        <Sparkles className="w-3.5 h-3.5 text-[#1AA260]" />
        <span>One secure sign-on across your Kaduna records.</span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { theme, toggleTheme } = useThemeStore()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const openPalette = usePresentationStore((s) => s.openPalette)
  const openInspector = useInspectorStore((s) => s.openInspector)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Smooth scroll handler for anchor navigation
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] antialiased transition-colors selection:bg-[#1AA260]/20 selection:text-[var(--ink)]">
      {/* ── Official Notice Bar ── */}
      <div className="bg-[#0A2E24] text-white/90 text-xs py-2.5 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#1AA260] animate-pulse shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 shrink-0">
              Official notice
            </span>
            <span className="text-[11.5px] text-white/80 hidden sm:inline">
              2026 unified tax assessments & vehicle licensing renewals are now open online.
            </span>
          </div>
          <Link
            to="/paykaduna/services"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-300 hover:text-white transition-colors shrink-0"
          >
            <span>Learn more</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Site Header / Navigation ── */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-[var(--line)]">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-[#1AA260] shadow-2xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-lg tracking-tight text-[var(--ink)] leading-none">
              KADIRS
            </div>
            <span className="text-[9.5px] uppercase tracking-widest text-[var(--gray-500)] font-semibold block mt-1">
              Unified Identity Gateway
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[var(--gray-700)] dark:text-[var(--gray-300)]">
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="hover:text-[#1AA260] transition-colors"
          >
            How it works
          </a>
          <a
            href="#services"
            onClick={(e) => scrollToSection(e, 'services')}
            className="hover:text-[#1AA260] transition-colors"
          >
            Services
          </a>
          <a
            href="#trust"
            onClick={(e) => scrollToSection(e, 'trust')}
            className="hover:text-[#1AA260] transition-colors"
          >
            Trust & privacy
          </a>
          <a
            href="#support"
            onClick={(e) => scrollToSection(e, 'support')}
            className="hover:text-[#1AA260] transition-colors"
          >
            Support
          </a>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <a
            href="#support"
            onClick={(e) => scrollToSection(e, 'support')}
            className="hidden sm:inline-block text-xs font-medium text-[var(--gray-500)] hover:text-[var(--ink)] transition-colors mr-1"
          >
            Need help?
          </a>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full text-[var(--gray-500)] hover:text-[var(--ink)] hover:bg-[var(--gray-100)] dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Sign In / Dashboard CTA */}
          {currentUser ? (
            <Link
              to="/paykaduna"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#07352C] hover:bg-[#0B5B4B] dark:bg-[#1AA260] dark:hover:bg-[#158A52] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Sign in</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--gray-500)] hover:text-[var(--ink)]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--paper-raised)] border-b border-[var(--line)] px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="block text-sm font-semibold text-[var(--gray-700)] dark:text-[var(--gray-300)] py-1"
          >
            How it works
          </a>
          <a
            href="#services"
            onClick={(e) => scrollToSection(e, 'services')}
            className="block text-sm font-semibold text-[var(--gray-700)] dark:text-[var(--gray-300)] py-1"
          >
            Services
          </a>
          <a
            href="#trust"
            onClick={(e) => scrollToSection(e, 'trust')}
            className="block text-sm font-semibold text-[var(--gray-700)] dark:text-[var(--gray-300)] py-1"
          >
            Trust & privacy
          </a>
          <a
            href="#support"
            onClick={(e) => scrollToSection(e, 'support')}
            className="block text-sm font-semibold text-[var(--gray-700)] dark:text-[var(--gray-300)] py-1"
          >
            Support
          </a>
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-widest text-[#1AA260]">
              <span className="w-6 h-[1.5px] bg-[#1AA260]" />
              <span>KADIRS CENTRAL IDENTITY GATEWAY</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--ink)] leading-[1.08]">
              One identity.<br />
              <em>Every</em> public service.
            </h1>

            {/* Intro Copy */}
            <p className="text-base sm:text-lg text-[var(--gray-500)] leading-relaxed max-w-xl font-normal">
              A simpler way to access Kaduna State tax, revenue, and vehicle services.
              Verify your identity once, then move between connected portals without starting over.
            </p>

            {/* Actions: Sign In placed directly beside Create Your Account */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Create your account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[var(--card-bg)] hover:bg-[var(--gray-100)] dark:hover:bg-white/10 text-[var(--ink)] text-sm font-bold border border-[var(--gray-200)] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4 text-[#1AA260]" />
              </Link>

              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--gray-500)] hover:text-[#1AA260] transition-colors px-2 py-2 cursor-pointer"
              >
                <span>See how it works</span>
                <ArrowDownRight className="w-4 h-4" />
              </a>
            </div>

            {/* Verification Checks */}
            <div className="pt-6 border-t border-[var(--line)] flex flex-wrap items-center gap-6 text-xs text-[var(--gray-700)] dark:text-[var(--gray-300)] font-medium">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#1AA260] flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>NIMC verified</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#1AA260] flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>NDPA protected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#1AA260] flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>14 connected MDAs</span>
              </div>
            </div>
          </div>

          {/* Right Column: Creative Interactive Digital Identity Visual */}
          <div className="lg:col-span-5">
            <DigitalIdentityVisual />
          </div>
        </div>
      </section>

      {/* ── One Gateway Strip ── */}
      <section id="services" className="border-y border-[var(--line)] bg-[var(--paper-raised)] py-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <p className="text-xs uppercase font-extrabold tracking-widest text-[var(--gray-500)] shrink-0">
              One gateway for
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              {/* PayKaduna */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[var(--paper)] border border-[var(--line)] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#1AA260]" />
                <div>
                  <p className="text-xs font-bold text-[var(--ink)]">PayKaduna</p>
                  <span className="text-[10px] text-[var(--gray-500)]">Revenue & payments</span>
                </div>
                <Check className="w-3.5 h-3.5 text-[#1AA260] ml-1 stroke-[2.5]" />
              </div>

              {/* KADVREG */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[var(--paper)] border border-[var(--line)] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#1AA260]" />
                <div>
                  <p className="text-xs font-bold text-[var(--ink)]">KADVREG</p>
                  <span className="text-[10px] text-[var(--gray-500)]">Vehicle licensing</span>
                </div>
                <Check className="w-3.5 h-3.5 text-[#1AA260] ml-1 stroke-[2.5]" />
              </div>

              {/* PIT */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[var(--paper)] border border-[var(--line)] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#1AA260]" />
                <div>
                  <p className="text-xs font-bold text-[var(--ink)]">PIT</p>
                  <span className="text-[10px] text-[var(--gray-500)]">Personal income tax</span>
                </div>
                <Check className="w-3.5 h-3.5 text-[#1AA260] ml-1 stroke-[2.5]" />
              </div>

              {/* Link to all 14 services */}
              <Link
                to="/paykaduna/services"
                className="text-[11px] font-bold uppercase tracking-wider text-[#1AA260] hover:text-[#158A52] flex items-center gap-1 px-3 py-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <span>+11 more connected services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── The SSO Difference Section ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-widest text-[#1AA260]">
              <span className="w-6 h-[1.5px] bg-[#1AA260]" />
              <span>The SSO difference</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
              SSO should feel like <em>one door</em>, not three queues.
            </h2>

            <p className="text-sm sm:text-base text-[var(--gray-500)] leading-relaxed font-normal">
              Public services work better when your identity follows you.
              KADIRS brings your state records into one clear, secure starting point.
            </p>

            <div className="pt-2">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1AA260] hover:text-[#158A52] group"
              >
                <span>Experience the 1-click flow</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Step Cards */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step 1 */}
            <div className="bg-[var(--card-bg)] border border-[var(--line)] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center justify-between gap-5 group">
              <div className="flex items-center gap-5 sm:gap-6">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--gray-400)] group-hover:text-[#1AA260] transition-colors">
                  01
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] leading-snug">
                    Sign in once
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-1 leading-relaxed">
                    Your NIN becomes the secure key to your connected services.
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] flex items-center justify-center shrink-0">
                <LockKeyhole className="w-5 h-5" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[var(--card-bg)] border border-[var(--line)] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center justify-between gap-5 group">
              <div className="flex items-center gap-5 sm:gap-6">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--gray-400)] group-hover:text-[#1AA260] transition-colors">
                  02
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] leading-snug">
                    Records find you
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-1 leading-relaxed">
                    Past payments, vehicle records, and tax profiles are matched automatically.
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[var(--card-bg)] border border-[var(--line)] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center justify-between gap-5 group">
              <div className="flex items-center gap-5 sm:gap-6">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--gray-400)] group-hover:text-[#1AA260] transition-colors">
                  03
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] leading-snug">
                    Keep moving
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-1 leading-relaxed">
                    Switch between services without duplicate accounts or repeated verification.
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Built Around Trust Section ── */}
      <section id="trust" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[var(--line)]">
        {/* Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-widest text-[#1AA260]">
              <span className="w-6 h-[1.5px] bg-[#1AA260]" />
              <span>Built around trust</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
              Less friction for you.<br />
              <em>More clarity</em> in the system.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base text-[var(--gray-500)] leading-relaxed">
              Every part of the gateway is designed to make public services easier to understand,
              easier to reach, and safer to use.
            </p>
          </div>
        </div>

        {/* 3 Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Verify once (White card) */}
          <div className="bg-[var(--card-bg)] border border-[var(--line)] rounded-[28px] p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#1AA260] mb-8">
                <span className="text-sm">01</span>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Verify once</h3>
              <p className="text-xs sm:text-sm text-[var(--gray-500)] leading-relaxed">
                Your National ID confirms who you are directly with NIMC—no repeated paperwork across portals.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[var(--line)] text-[10px] uppercase font-bold tracking-widest text-[var(--gray-400)]">
              KADIRS / SSO
            </div>
          </div>

          {/* Card 2: Move freely (Mint / Soft Emerald card) */}
          <div className="bg-[#D8F3E5] dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 rounded-[28px] p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all text-[#0D3029] dark:text-emerald-100">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#0B5B4B] dark:text-emerald-300 mb-8">
                <span className="text-sm">02</span>
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0D3029] dark:text-white mb-2">Move freely</h3>
              <p className="text-xs sm:text-sm text-[#28554A] dark:text-emerald-200/80 leading-relaxed">
                Open every connected Kaduna service from one account, without starting a new login each time.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-emerald-200/80 dark:border-emerald-800/40 text-[10px] uppercase font-bold tracking-widest text-[#0B5B4B]/80 dark:text-emerald-300">
              KADIRS / SSO
            </div>
          </div>

          {/* Card 3: Stay in control (Deep forest green card) */}
          <div className="bg-[#07352C] rounded-[28px] p-7 shadow-lg flex flex-col justify-between hover:shadow-xl transition-all text-white border border-emerald-900/50">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-8">
                <span className="text-sm">03</span>
                <LockKeyhole className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Stay in control</h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                See what is connected, manage your data permissions, and keep your public records together.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">
              KADIRS / SSO
            </div>
          </div>
        </div>
      </section>

      {/* ── Quote Section ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center border-t border-[var(--line)]">
        <span className="font-serif text-5xl sm:text-6xl text-[#1AA260] leading-none block">
          “
        </span>
        <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[var(--ink)] leading-snug tracking-tight max-w-2xl mx-auto my-6 font-normal">
          When identity is simple, public service can feel like it belongs to everyone.
        </blockquote>
        <div className="flex items-center justify-center gap-2 text-[10.5px] uppercase font-bold tracking-widest text-[var(--gray-500)]">
          <span>Kaduna State Internal Revenue Service</span>
          <span>&bull;</span>
          <span>Central Identity Initiative</span>
        </div>
      </section>

      {/* ── Need a Hand? / Support Section ── */}
      <section id="support" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-[#07352C] rounded-[32px] p-8 sm:p-12 lg:p-14 text-white relative overflow-hidden shadow-2xl border border-emerald-900/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="w-6 h-[1.5px] bg-emerald-400" />
                <span>Need a hand?</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                We’re here to help you <em>get through.</em>
              </h2>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-lg">
                Questions about your tax assessment, vehicle title, or NIN matching? Our taxpayer support team is ready.
              </p>
            </div>

            {/* Right: Support Card */}
            <div className="lg:col-span-5 bg-[#0B5B4B] border border-emerald-400/30 rounded-[24px] p-6 sm:p-7 space-y-5 shadow-inner">
              {/* General Enquiries */}
              <div className="pb-4 border-b border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-300 block">
                  General enquiries
                </span>
                <strong className="text-sm sm:text-base font-bold text-white block">
                  taxpayer.support@kadirs.gov.ng
                </strong>
              </div>

              {/* Helpline */}
              <div className="pb-4 border-b border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-300 block">
                  Helpline
                </span>
                <strong className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>+234 800-KADIRS</span>
                  <span className="text-xs font-normal text-white/70">(Toll free)</span>
                </strong>
              </div>

              {/* Visit Support Centre */}
              <Link
                to="/paykaduna/services"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#C1F2D9] hover:bg-emerald-200 text-[#07352C] text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Visit the support centre</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Site Footer ── */}
      <footer className="bg-[#051C17] text-white pt-16 pb-12 border-t border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Brand */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-white">KADIRS</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed max-w-sm">
                Central Identity & Revenue Gateway.<br />
                Serving Kaduna State with clarity.
              </p>
            </div>

            {/* Citizen Portals */}
            <div className="md:col-span-3 space-y-3">
              <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400 block">
                Citizen portals
              </span>
              <ul className="space-y-2 text-xs text-white/70">
                <li>
                  <Link to="/paykaduna" className="hover:text-white transition-colors">
                    PayKaduna Revenue
                  </Link>
                </li>
                <li>
                  <Link to="/kadvreg" className="hover:text-white transition-colors">
                    Vehicle licensing
                  </Link>
                </li>
                <li>
                  <Link to="/pit" className="hover:text-white transition-colors">
                    Personal income tax
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="md:col-span-3 space-y-3">
              <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400 block">
                Company
              </span>
              <ul className="space-y-2 text-xs text-white/70">
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => scrollToSection(e, 'how-it-works')}
                    className="hover:text-white transition-colors"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#trust"
                    onClick={(e) => scrollToSection(e, 'trust')}
                    className="hover:text-white transition-colors"
                  >
                    Privacy & compliance
                  </a>
                </li>
                <li>
                  <a
                    href="#support"
                    onClick={(e) => scrollToSection(e, 'support')}
                    className="hover:text-white transition-colors"
                  >
                    Contact support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar with Evaluator Toolbar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <div className="flex items-center gap-3">
              <span>© 2026 Kaduna State Internal Revenue Service</span>
              <span>&bull;</span>
              <span className="text-emerald-400/90 font-medium">NDPA 2023 protected • NIMC identity partner</span>
            </div>

            {/* Subtle Evaluator / Demo triggers */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openInspector('topology')}
                className="text-[11px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
              >
                Architecture Inspector
              </button>
              <button
                type="button"
                onClick={openPalette}
                className="text-[11px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
              >
                Command Palette
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

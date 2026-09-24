import { useState } from 'react'
import { Link } from 'react-router'
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
  Lock,
  Search,
  Sun,
  Moon,
  Sparkles,
  Car,
  Wallet,
  FileText,
  MapPin,
  Mail,
  Phone,
  Star,
  Check,
  Send,
  Code2,
  ChevronRight
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useAdminEngine } from '@/engine/admin-engine'
import { usePresentationStore } from '@/engine/presentation-store'
import { useInspectorStore } from '@/engine/inspector-store'
import { useThemeStore } from '@/engine/theme-store'
import { toast } from 'sonner'

export default function HomePage() {
  const { theme, toggleTheme } = useThemeStore()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const logoutCitizen = useAuthEngine((s) => s.logout)
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)
  const logoutAdmin = useAdminEngine((s) => s.logoutAdmin)
  const openPalette = usePresentationStore((s) => s.openPalette)
  const openInspector = useInspectorStore((s) => s.openInspector)

  // Smooth scroll handler for anchor links
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Contact form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !contactEmail.trim() || !message.trim()) {
      toast.error('Please complete all required fields')
      return
    }
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success('Inquiry Received', {
        description: `Thank you, ${firstName}. A taxpayer support officer from KADIRS will contact you shortly.`
      })
      setFirstName('')
      setLastName('')
      setContactEmail('')
      setContactPhone('')
      setMessage('')
    }, 700)
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-body antialiased transition-colors selection:bg-[#1AA260]/20 selection:text-[var(--ink)]">
      {/* Official State Announcement Bar — Plain Language Citizen Notice */}
      <div className="bg-[#123D35] text-white/90 text-xs py-2.5 px-4 border-b border-white/10 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1AA260] animate-pulse" />
            <span className="font-medium text-[11.5px] tracking-wide">
              Official Notice: 2026 Unified Tax Assessments and Vehicle Licensing renewals are now open online.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white/70">
            <span>Direct NIMC Verification</span>
            <span>&bull;</span>
            <span>14 Connected State MDAs</span>
            <span>&bull;</span>
            <span className="text-emerald-300 font-medium">Helpline: 0800-KADIRS (Toll Free)</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
        
        {/* ========================================================================= */}
        {/* NAVIGATION BAR — Pure Citizen Focus (Evaluator links moved to footer)    */}
        {/* ========================================================================= */}
        <nav className="flex items-center justify-between py-4 border-b border-[var(--gray-200)]/70">
          {/* Logo Mark: Green Scales of Justice & Official State Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#1AA260]/10 border border-[#1AA260]/30 flex items-center justify-center text-[#1AA260] group-hover:bg-[#1AA260] group-hover:text-white transition-colors shadow-2xs">
              <Scale className="w-5 h-5 transition-transform group-hover:scale-105" />
            </div>
            <div>
              <div className="font-display font-extrabold text-base tracking-tight text-[var(--ink)] leading-tight">
                KADIRS <span className="font-medium text-[#1AA260] text-xs">Portal</span>
              </div>
              <span className="block text-[10.5px] uppercase tracking-wider text-[var(--gray-500)] font-medium">
                Kaduna State Revenue Service
              </span>
            </div>
          </Link>

          {/* Nav Links with Smooth Scrolling */}
          <div className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-[var(--gray-700)]">
            <a
              href="#services"
              onClick={(e) => scrollToSection(e, 'services')}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Services
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              How It Works
            </a>
            <a
              href="#reviews"
              onClick={(e) => scrollToSection(e, 'reviews')}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Citizen Stories
            </a>
            <a
              href="#contact"
              onClick={(e) => scrollToSection(e, 'contact')}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Tax Offices &amp; Support
            </a>
          </div>

          {/* Nav Action Buttons — Theme Toggle + Clean Citizen CTA */}
          <div className="flex items-center gap-2.5">
            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] text-[var(--gray-700)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--gray-700)]" />
              )}
            </button>

            {/* Primary Action Button (Citizen Focused) */}
            {currentUser ? (
              <Link
                to="/paykaduna"
                className="px-5 py-2.5 rounded-full bg-[var(--black)] hover:bg-[#123D35] text-white text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-2"
              >
                <span>Dashboard ({identity?.legalName.split(' ')[0] || 'Citizen'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="px-5 py-2.5 rounded-full bg-[var(--black)] hover:bg-[#123D35] text-white text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-2"
              >
                <span>Sign In / Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </nav>

        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <section className="pt-12 sm:pt-16 pb-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Headlines & Tailored Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1AA260]/10 border border-[#1AA260]/20 text-[#1AA260] text-[11.5px] font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Unified Tax &amp; Identity Gateway</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-[66px] font-extrabold text-[var(--ink)] leading-[1.08] tracking-tight">
              Guiding You Through <br />
              <span className="text-[#1AA260]">State Taxes</span> <br />
              &amp; Identity
            </h1>

            <p className="text-[15.5px] sm:text-[17px] text-[var(--gray-700)] leading-relaxed max-w-xl font-normal">
              We simplify state taxes, revenue payments, and vehicle licensing with one verified digital identity. Direct National ID verification, automatic record matching, and zero paperwork.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/auth/register"
                className="px-7 py-3.5 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer group"
              >
                <span>Start with National ID (NIN)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/auth/login"
                className="px-6 py-3.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] text-[var(--ink)] text-sm font-semibold transition-colors cursor-pointer"
              >
                Sign In to Account
              </Link>
            </div>

            {/* Pill Tags Row */}
            <div className="pt-6">
              <span className="block text-[11px] font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-3">
                Supported State Services
              </span>
              <div className="flex flex-wrap gap-2.5">
                {[
                  'PayKaduna Revenue',
                  'Vehicle Licensing (KADVREG)',
                  'Personal Income Tax (PIT)',
                  'Direct National ID Verification',
                  '1-Click Record Linking'
                ].map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-1.5 rounded-full border border-[var(--gray-200)] bg-[var(--white)] text-[var(--gray-700)] text-xs font-medium hover:border-[#1AA260]/40 transition-colors shadow-2xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card (Deep Green Arch with Scales of Justice & Foliage) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[28px] sm:rounded-[36px] bg-[#123D35] overflow-hidden p-8 sm:p-10 shadow-2xl min-h-[460px] sm:min-h-[520px] flex flex-col justify-between text-white border border-white/10 group">
              
              {/* Background Architectural Fluting & Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0D2821] via-[#123D35] to-[#1AA260]/20 pointer-events-none" />
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#1AA260]/20 blur-3xl pointer-events-none" />

              {/* Decorative Subtle Vertical Lines */}
              <div className="absolute inset-0 opacity-10 pointer-events-none flex justify-around">
                <div className="w-px h-full bg-white" />
                <div className="w-px h-full bg-white" />
                <div className="w-px h-full bg-white" />
                <div className="w-px h-full bg-white" />
              </div>

              {/* Top Card Badge: Live NIMC Verification */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>NIMC Gateway Verified</span>
                </div>
                <span className="text-[11px] text-white/70 font-medium">
                  State Digital Gateway
                </span>
              </div>

              {/* Center Artwork: Classical Scales of Fair Revenue Assurance */}
              <div className="relative z-10 py-10 flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  {/* Outer Laurel Halo */}
                  <div className="w-36 h-36 rounded-full border-2 border-dashed border-[#1AA260]/40 flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
                    <div className="absolute -top-2 w-4 h-4 rounded-full bg-[#1AA260]" />
                    <div className="absolute -bottom-2 w-4 h-4 rounded-full bg-emerald-400" />
                  </div>
                  {/* Central Scale Emblem */}
                  <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-gradient-to-b from-[#1AA260] to-[#123D35] flex items-center justify-center text-white shadow-xl shadow-black/40 border-2 border-white/30">
                    <Scale className="w-12 h-12 text-white drop-shadow-md" />
                  </div>
                </div>

                <div className="space-y-1 max-w-[280px]">
                  <h3 className="font-display font-bold text-xl text-white tracking-tight">
                    Fair. Transparent. Unified.
                  </h3>
                  <p className="text-xs text-emerald-100/80 leading-relaxed">
                    Protecting taxpayer rights while powering Kaduna State revenue development.
                  </p>
                </div>
              </div>

              {/* Bottom Card Summary Pill */}
              <div className="relative z-10 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <span className="font-semibold block text-white">14 Connected MDAs</span>
                    <span className="text-[10.5px] text-white/70">Zero duplicate registrations</span>
                  </div>
                </div>
                <Link
                  to="/paykaduna/services"
                  className="px-3 py-1 rounded-full bg-white text-[#123D35] hover:bg-emerald-50 font-semibold text-[11px] transition-colors"
                >
                  Explore &rarr;
                </Link>
              </div>

            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* MISSION PULL-QUOTE BANNER                                                 */}
        {/* ========================================================================= */}
        <section className="my-10">
          <div className="rounded-[28px] bg-[var(--gray-100)] border border-[var(--gray-200)]/70 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xs">
            <span className="text-4xl sm:text-5xl text-[#1AA260] font-serif leading-none block mb-2 select-none">
              &ldquo;
            </span>
            <blockquote className="font-display italic text-lg sm:text-2xl font-bold text-[var(--ink)] max-w-3xl mx-auto leading-relaxed">
              Tax compliance is a public trust &mdash; one that, with transparent, unified digital systems, reveals a clear, effortless path forward for every citizen and enterprise in Kaduna State.
            </blockquote>
            <cite className="block mt-4 text-xs font-semibold tracking-wider text-[var(--gray-500)] uppercase not-italic font-body">
              Kaduna State Internal Revenue Service (KADIRS) &middot; Central Identity Initiative
            </cite>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* DISCOVER OUR UNIFIED PLATFORM                                             */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-16 sm:py-20 border-t border-[var(--gray-200)]/70">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1AA260]">
                <span>How The Unified System Works</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight leading-tight">
                No More Fragmented Accounts. <br />
                <span className="text-[#1AA260]">One National ID</span> Unlocks Everything.
              </h2>

              <p className="text-[15px] text-[var(--gray-700)] leading-relaxed">
                In the past, Kaduna citizens managed disconnected logins for PayKaduna, road vehicle licensing, and personal tax filing. Different emails and minor name discrepancies led to missing receipts and frustration.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    title: 'Direct National ID Verification (NIMC)',
                    desc: 'Your 11-digit NIN verifies your identity directly with NIMC. Name and birthdate are automatically confirmed without extra paperwork.'
                  },
                  {
                    title: 'Automatic Past Record Matching',
                    desc: 'The system links your previous vehicle registrations, tax receipts, and payment history to your account automatically.'
                  },
                  {
                    title: 'Strict Privacy & Data Protection',
                    desc: 'Protected under the Nigeria Data Protection Act 2023. Your personal data is encrypted, secure, and never shared without your permission.'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--white)] border border-[var(--gray-200)] shadow-2xs">
                    <div className="w-5 h-5 rounded-full bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-[var(--ink)] block">{item.title}</strong>
                      <span className="text-[12px] text-[var(--gray-700)] leading-normal">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#1AA260] hover:text-[#158A52] uppercase tracking-wider group"
                >
                  <span>Experience the 1-click citizen flow</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Card: Interactive Identity Portfolio Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-[28px] bg-[var(--white)] border border-[var(--gray-200)] p-7 sm:p-9 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--gray-200)] pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#123D35] text-white flex items-center justify-center font-display font-bold text-sm">
                      FA
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-[var(--ink)]">Fatima Abdullahi</h4>
                      <span className="text-[11px] text-[var(--gray-500)]">CIT-KAD-2024-00847 &middot; Verified Citizen</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>NIMC Linked</span>
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-[var(--gray-100)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-4 h-4 text-[#1AA260]" />
                      <div>
                        <span className="font-bold text-[var(--ink)] block">PayKaduna Revenue</span>
                        <span className="text-[11px] text-[var(--gray-500)]">State Taxpayer ID &amp; Payment Invoices</span>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600">Active</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--gray-100)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className="w-4 h-4 text-[#1AA260]" />
                      <div>
                        <span className="font-bold text-[var(--ink)] block">KADVREG Vehicle Licensing</span>
                        <span className="text-[11px] text-[var(--gray-500)]">Plate No: KAF-582-AA &middot; Honda Accord</span>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600">Auto-Linked</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--gray-100)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#1AA260]" />
                      <div>
                        <span className="font-bold text-[var(--ink)] block">Personal Income Tax (PIT)</span>
                        <span className="text-[11px] text-[var(--gray-500)]">Assessment &amp; Tax Clearance Certificate</span>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600">Unified</span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[var(--gray-200)] flex items-center justify-between text-xs text-[var(--gray-500)]">
                  <span>Kaduna State Internal Revenue Service</span>
                  <span className="text-[11px] font-medium text-emerald-600">State Certified Portal</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* PLATFORM PILLARS                                                          */}
        {/* ========================================================================= */}
        <section id="services" className="py-16 sm:py-20 border-t border-[var(--gray-200)]/70">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1AA260]">
              Built For Kaduna Citizens
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
              Built for Speed, Trust, and Inclusion
            </h2>
            <p className="text-sm text-[var(--gray-700)] leading-relaxed">
              Simplifying public services, eliminating queues, and giving you fast, transparent access to your tax and vehicle records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1 */}
            <div className="rounded-[24px] bg-[var(--white)] border border-[var(--gray-200)] p-8 shadow-xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--ink)] mb-2">
                Zero Duplicate Logins
              </h3>
              <p className="text-xs text-[var(--gray-700)] leading-relaxed">
                No more remembering three passwords for three different state websites. Your National Identity Number serves as your universal, secure key across all Kaduna public portals.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-[24px] bg-[var(--white)] border border-[var(--gray-200)] p-8 shadow-xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--ink)] mb-2">
                1-Click Record Linking
              </h3>
              <p className="text-xs text-[var(--gray-700)] leading-relaxed">
                The smart matching engine scans state databases. Previous tax payments and vehicle registrations registered under older emails are discovered and linked with one click.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-[24px] bg-[var(--white)] border border-[var(--gray-200)] p-8 shadow-xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1AA260] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--ink)] mb-2">
                Total Data Privacy
              </h3>
              <p className="text-xs text-[var(--gray-700)] leading-relaxed">
                Full statutory compliance with the Nigeria Data Protection Act 2023. You have complete transparency over authorized services, with one-click data export and account privacy controls.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CITIZEN VOICES / TESTIMONIALS                                             */}
        {/* ========================================================================= */}
        <section id="reviews" className="py-16 sm:py-20 border-t border-[var(--gray-200)]/70">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1AA260]">
              Citizen Feedback
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
              Trusted by Citizens &amp; Enterprises
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="rounded-[20px] bg-[var(--white)] border border-[var(--gray-200)] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[var(--gray-500)] block mb-3">September 18</span>
                <p className="text-xs text-[var(--gray-700)] leading-relaxed mb-4">
                  &ldquo;I had an old vehicle registered under my Kaduna North civil service email, and PayKaduna under my personal Gmail. The portal linked both records to my NIN in under 30 seconds. Outstanding!&rdquo;
                </p>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-[var(--gray-200)]">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#1AA260] font-bold text-xs flex items-center justify-center">
                  FA
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[var(--ink)]">Fatima Abdullahi</h4>
                  <span className="text-[10.5px] text-[var(--gray-500)]">Civil Servant &middot; Kaduna North</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="rounded-[20px] bg-[var(--white)] border border-[var(--gray-200)] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[var(--gray-500)] block mb-3">August 29</span>
                <p className="text-xs text-[var(--gray-700)] leading-relaxed mb-4">
                  &ldquo;As a business director in Kaduna South, linking my CAC company profile and managing our corporate TIN without queuing at the tax office was effortless. The new system is clean and fast.&rdquo;
                </p>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-[var(--gray-200)]">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center">
                  AY
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[var(--ink)]">Amina Yusuf</h4>
                  <span className="text-[10.5px] text-[var(--gray-500)]">SME Director &middot; Kaduna South</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="rounded-[20px] bg-[var(--white)] border border-[var(--gray-200)] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[var(--gray-500)] block mb-3">August 14</span>
                <p className="text-xs text-[var(--gray-700)] leading-relaxed mb-4">
                  &ldquo;Moving between PayKaduna and KADVREG without having to sign in repeatedly saves our transport logistics business hours every week. The digital receipts are generated instantly.&rdquo;
                </p>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-[var(--gray-200)]">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-xs flex items-center justify-center">
                  EO
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[var(--ink)]">Emeka Obi</h4>
                  <span className="text-[10.5px] text-[var(--gray-500)]">Logistics Operator &middot; Zaria</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SCHEDULE ASSISTANCE & TAX OFFICES                                         */}
        {/* ========================================================================= */}
        <section id="contact" className="py-16 sm:py-20 border-t border-[var(--gray-200)]/70">
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1AA260]">
              Get In Touch &amp; Tax Offices
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
              Taxpayer Support &amp; Zonal Centers
            </h2>
            <p className="text-sm text-[var(--gray-700)] mt-1">
              Have questions about your tax assessment, vehicle title, or NIN matching? Our taxpayer support team is ready to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Card: Offices & Hotline */}
            <div className="lg:col-span-5 rounded-[24px] bg-[var(--white)] border border-[var(--gray-200)] p-7 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h4 className="font-display font-bold text-sm text-[var(--ink)] mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#1AA260]" />
                  <span>Central Headquarters</span>
                </h4>
                <p className="text-xs text-[var(--gray-700)] leading-relaxed pl-6">
                  Revenue House, Muhammadu Buhari Way, <br />
                  Central Business District, Kaduna State, Nigeria
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--gray-200)]">
                <h4 className="font-display font-bold text-xs text-[var(--ink)] uppercase tracking-wider mb-2.5">
                  Zonal Tax Offices
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11.5px] text-[var(--gray-700)]">
                  <span>&bull; Kawo Tax Office</span>
                  <span>&bull; Barnawa Tax Office</span>
                  <span>&bull; Zaria Central Tax Office</span>
                  <span>&bull; Kafanchan Tax Office</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--gray-200)] space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[var(--gray-700)]">
                  <Mail className="w-4 h-4 text-[#1AA260]" />
                  <span>taxpayer.support@kadirs.gov.ng</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--gray-700)]">
                  <Phone className="w-4 h-4 text-[#1AA260]" />
                  <span>+234 800-KADIRS (Toll Free)</span>
                </div>
              </div>
            </div>

            {/* Right Card: Contact Form */}
            <div className="lg:col-span-7 rounded-[24px] bg-[var(--white)] border border-[var(--gray-200)] p-7 sm:p-8 shadow-xs">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Fatima"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--gray-200)] bg-[var(--paper)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#1AA260] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Abdullahi"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--gray-200)] bg-[var(--paper)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#1AA260] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="citizen@kaduna.gov.ng"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--gray-200)] bg-[var(--paper)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#1AA260] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--gray-200)] bg-[var(--paper)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#1AA260] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                    How can we help you? *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your tax inquiry or record linking question..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--gray-200)] bg-[var(--paper)] text-xs text-[var(--ink)] focus:outline-none focus:border-[#1AA260] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-3 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* EXPANDED EXECUTIVE FOOTER                                                 */}
      {/* ========================================================================= */}
      <footer className="bg-[var(--black)] text-white/90 rounded-t-[28px] sm:rounded-t-[36px] pt-16 pb-12 px-6 sm:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Main Footer Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Column 1: KADIRS Brand & Summary (Spans 2 on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1AA260]/20 border border-[#1AA260]/40 flex items-center justify-center text-[#1AA260]">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-extrabold text-base tracking-tight text-white">
                    Kaduna State Internal Revenue Service
                  </div>
                  <span className="text-[11px] text-white/60">
                    Central Identity &amp; Revenue Gateway
                  </span>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed max-w-sm">
                Empowering citizens and businesses in Kaduna State with unified digital tax assessments, vehicle registration, and verified public revenue services.
              </p>
              <div className="pt-2 text-xs text-white/60 space-y-1">
                <div>Revenue House, Muhammadu Buhari Way, Kaduna</div>
                <div>Helpline: <span className="text-white font-medium">+234 800-KADIRS</span> (Toll Free)</div>
                <div>Email: <span className="text-white font-medium">taxpayer.support@kadirs.gov.ng</span></div>
              </div>
            </div>

            {/* Column 2: State Services */}
            <div className="space-y-3">
              <h5 className="font-display font-bold text-xs uppercase tracking-wider text-emerald-400">
                Citizen Portals
              </h5>
              <ul className="space-y-2 text-xs text-white/70">
                <li>
                  <Link to="/paykaduna" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>PayKaduna Revenue</span>
                  </Link>
                </li>
                <li>
                  <Link to="/kadvreg" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>Vehicle Licensing (KADVREG)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/pit" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>Personal Income Tax (PIT)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/paykaduna/services" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>Connected State MDAs</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Zonal Centers */}
            <div className="space-y-3">
              <h5 className="font-display font-bold text-xs uppercase tracking-wider text-emerald-400">
                Zonal Tax Offices
              </h5>
              <ul className="space-y-2 text-xs text-white/70">
                <li>Kawo Zonal Center (Kaduna North)</li>
                <li>Barnawa Zonal Center (Kaduna South)</li>
                <li>Zaria Central Tax Office</li>
                <li>Kafanchan Zonal Office</li>
                <li>Mando Integrated Revenue Station</li>
              </ul>
            </div>

            {/* Column 4: Privacy & Governance */}
            <div className="space-y-3">
              <h5 className="font-display font-bold text-xs uppercase tracking-wider text-emerald-400">
                Privacy &amp; Compliance
              </h5>
              <ul className="space-y-2 text-xs text-white/70">
                <li>
                  <Link to="/auth/profile" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>Citizen Privacy Center</span>
                  </Link>
                </li>
                <li>
                  <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>NDPA 2023 Compliance</span>
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>NIMC Identity Safeguards</span>
                  </a>
                </li>
                <li>
                  <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-400" />
                    <span>Taxpayer Bill of Rights</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DEDICATED EVALUATOR, DEMO & ADMINISTRATIVE SUITE (Moved from Top & Overlay) */}
          {/* ========================================================================= */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 sm:p-6 backdrop-blur-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left: Section Context & Active Session Badges */}
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-emerald-300">
                    State Officers, Evaluators &amp; Architecture Suite
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  Switch between citizen and officer personas, access the administrative console, or inspect live security tokens and system architecture.
                </p>

                {/* Active Session Indicator */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {currentAdmin && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11.5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Officer Session: <strong>{currentAdmin.name}</strong> ({currentAdmin.role.replace('_', ' ')})</span>
                      <button
                        onClick={() => {
                          logoutAdmin()
                          toast.info('Admin officer logged out')
                        }}
                        className="hover:text-white ml-1 underline cursor-pointer text-[10.5px]"
                        title="Sign out officer"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}

                  {currentUser && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11.5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>Citizen Session: <strong>{identity?.legalName || 'Active'}</strong></span>
                      <button
                        onClick={() => {
                          logoutCitizen()
                          toast.info('Citizen session ended')
                        }}
                        className="hover:text-white ml-1 underline cursor-pointer text-[10.5px]"
                        title="Sign out citizen"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: The 3 Moved Utility Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* 1. Demo Quick Switcher Button */}
                <button
                  type="button"
                  onClick={openPalette}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:border-emerald-400/50"
                  title="Switch between Citizens, Directors, and Officers (Cmd+K)"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Demo Quick Switcher</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[9.5px] font-mono text-emerald-300 border border-white/10">⌘K</kbd>
                </button>

                {/* 2. Admin Officer Gateway Button */}
                <Link
                  to={currentAdmin ? "/admin/dashboard" : "/admin"}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold transition-all flex items-center gap-2 shadow-xs hover:border-emerald-400/50"
                  title="Open KADIRS Administrative & Maker/Checker Console"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentAdmin ? "Admin Console" : "Admin Gateway"}</span>
                  <ArrowRight className="w-3 h-3 text-white/50" />
                </Link>

                {/* 3. Architecture Inspector Button (Moved from Floating Overlay) */}
                <button
                  type="button"
                  onClick={() => openInspector()}
                  className="px-4 py-2.5 rounded-xl bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                  title="Inspect RS256 JWT Tokens, Event Streams & OAuth Flow (Alt+I)"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Inspect Architecture</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[9.5px] font-mono text-white/90">Alt+I</kbd>
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Legal & Security Attributions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-white/50 pt-2">
            <span>&copy; 2026 Kaduna State Internal Revenue Service. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-4">
              <span>NDPA 2023 Statutory Protection</span>
              <span>&bull;</span>
              <span>NIMC Official Identity Partner</span>
              <span>&bull;</span>
              <span>State Certified Portal</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  )
}

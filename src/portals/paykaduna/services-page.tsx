import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router'
import {
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Eye,
  Car,
  Wallet,
  FileText,
  ClipboardList,
  Home,
  ScrollText,
  AlertTriangle,
  User,
  CarFront
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { SSOTransitionModal } from '@/components/auth/sso-transition-modal'

interface ServiceItem {
  id: string
  name: string
  acronym: string
  agency: string
  category: 'revenue' | 'transport' | 'land' | 'commerce' | 'social' | 'utilities'
  description: string
  personas: ('Individual' | 'Corporate' | 'Government')[]
  icon: typeof Wallet
  isInteractive: boolean
  launchUrl?: string
  audience: string
  scopes: string[]
  statutoryBasis: string
}

const SERVICES_CATALOG: ServiceItem[] = [
  {
    id: 'paykaduna',
    name: 'PayKaduna Revenue Gateway',
    acronym: 'PayKaduna',
    agency: 'Kaduna State Internal Revenue Service (KADIRS)',
    category: 'revenue',
    description: 'Centralised digital collections engine for municipal levies, land charges, institutional fees, and unified billing across Kaduna State.',
    personas: ['Individual', 'Corporate', 'Government'],
    icon: Wallet,
    isInteractive: true,
    launchUrl: '/paykaduna',
    audience: 'paykaduna',
    scopes: ['profile:read', 'services:access', 'receipts:view'],
    statutoryBasis: 'Kaduna State Tax Codification and Consolidation Law'
  },
  {
    id: 'kadvreg',
    name: 'Kaduna Automated Vehicle Registration',
    acronym: 'KADVREG',
    agency: 'Directorate of Motor Vehicle Administration & Licensing',
    category: 'transport',
    description: 'Digital vehicle registration, number plate allocation, roadworthiness certificates, and Hackney carriage commercial transport permits.',
    personas: ['Individual', 'Corporate'],
    icon: Car,
    isInteractive: true,
    launchUrl: '/kadvreg',
    audience: 'kadvreg',
    scopes: ['profile:read', 'vehicles:manage', 'licensing:renew'],
    statutoryBasis: 'Kaduna State Road Traffic Law & National Road Traffic Regulations'
  },
  {
    id: 'pit',
    name: 'Personal Income Tax Portal',
    acronym: 'PIT e-Tax',
    agency: 'KADIRS Direct Assessment & PAYE Directorate',
    category: 'revenue',
    description: 'Digital tax filing platform for direct assessment taxpayers and formal sector PAYE with real-time tax calculator and digital e-TCC generation.',
    personas: ['Individual'],
    icon: FileText,
    isInteractive: true,
    launchUrl: '/pit',
    audience: 'pit',
    scopes: ['profile:read', 'tax:read', 'tax:file', 'tcc:generate'],
    statutoryBasis: 'Personal Income Tax Act (PITA) 2011 & KD Revenue Law'
  },
  {
    id: 'land-reg',
    name: 'Kaduna Geographic Information Service',
    acronym: 'KADGIS',
    agency: 'Kaduna Geographic Information Service (KADGIS)',
    category: 'land',
    description: 'Digital cadastral mapping, Certificate of Occupancy (C of O) verification, land title registration, and automated ground rent settlement.',
    personas: ['Individual', 'Corporate', 'Government'],
    icon: Home,
    isInteractive: false,
    audience: 'kadgis',
    scopes: ['profile:read', 'property:read', 'c-of-o:verify'],
    statutoryBasis: 'Kaduna Geographic Information Service Law 2015'
  },
  {
    id: 'biz-reg',
    name: 'Kaduna Business Registration Service',
    acronym: 'KADBR',
    agency: 'Ministry of Business, Innovation & Technology',
    category: 'commerce',
    description: 'Formal registration of state micro, small and medium enterprises (MSMEs), annual business operating permits, and industrial zoning clearance.',
    personas: ['Corporate'],
    icon: ClipboardList,
    isInteractive: false,
    audience: 'biz-reg',
    scopes: ['profile:read', 'corporate:read', 'permits:apply'],
    statutoryBasis: 'Kaduna State Business Licensing Act'
  },
  {
    id: 'subeb',
    name: 'Universal Basic Education Management',
    acronym: 'KAD-SUBEB',
    agency: 'Kaduna State Universal Basic Education Board',
    category: 'social',
    description: 'Public school pupil enrolment registry, institutional school levy verification, teacher licensure records, and educational infrastructure permits.',
    personas: ['Individual', 'Government'],
    icon: ScrollText,
    isInteractive: false,
    audience: 'subeb',
    scopes: ['profile:read', 'education:read'],
    statutoryBasis: 'Universal Basic Education (UBE) Law'
  },
  {
    id: 'zakat',
    name: 'Kaduna State Zakat & Endowment Board',
    acronym: 'ZAKAT',
    agency: 'Kaduna State Zakat and Waqf Board',
    category: 'social',
    description: 'Statutory religious endowment administration, wealth assessment guidelines, voluntary charitable contributions, and beneficiary disbursements.',
    personas: ['Individual'],
    icon: ShieldCheck,
    isInteractive: false,
    audience: 'zakat',
    scopes: ['profile:read', 'zakat:calculate'],
    statutoryBasis: 'Kaduna State Zakat and Endowment Law'
  },
  {
    id: 'water',
    name: 'Kaduna State Water Corporation',
    acronym: 'KADSWAC',
    agency: 'Kaduna State Water Corporation',
    category: 'utilities',
    description: 'Public utility metering, domestic water billing, commercial bulk water permits, and municipal infrastructure connection fees.',
    personas: ['Individual', 'Corporate', 'Government'],
    icon: Home,
    isInteractive: false,
    audience: 'kadswac',
    scopes: ['profile:read', 'utilities:water:bill'],
    statutoryBasis: 'Kaduna State Water Board Enactment'
  },
  {
    id: 'kasepa',
    name: 'Environmental Protection Authority',
    acronym: 'KASEPA',
    agency: 'Kaduna State Environmental Protection Authority',
    category: 'land',
    description: 'Environmental impact assessments (EIA), commercial waste management licenses, industrial effluent monitoring, and sanitation permits.',
    personas: ['Corporate', 'Government'],
    icon: AlertTriangle,
    isInteractive: false,
    audience: 'kasepa',
    scopes: ['profile:read', 'environment:audit'],
    statutoryBasis: 'Kaduna State Environmental Protection Enactment'
  },
  {
    id: 'kirmas',
    name: 'Kaduna Infrastructure & Road Agency',
    acronym: 'KIRMAS',
    agency: 'Kaduna Infrastructure and Roads Management Agency',
    category: 'transport',
    description: 'Right-of-way excavation permits, highway signage levies, heavy truck axle weight certification, and road asset maintenance fees.',
    personas: ['Corporate', 'Government'],
    icon: Car,
    isInteractive: false,
    audience: 'kirmas',
    scopes: ['profile:read', 'haulage:license'],
    statutoryBasis: 'Kaduna State Roads Infrastructure Development Law'
  },
  {
    id: 'tsp-11',
    name: 'Kaduna State Health Insurance Scheme',
    acronym: 'KADHIS',
    agency: 'Kaduna State Contributory Health Management Authority',
    category: 'social',
    description: 'State contributory health scheme registration, primary health facility selection, monthly premium verification, and beneficiary photo cards.',
    personas: ['Individual', 'Corporate'],
    icon: User,
    isInteractive: false,
    audience: 'kadhis',
    scopes: ['profile:read', 'health:enrol'],
    statutoryBasis: 'Kaduna State Contributory Health Scheme Law'
  },
  {
    id: 'tsp-12',
    name: 'Kaduna Agricultural Development Project',
    acronym: 'KADP',
    agency: 'Ministry of Agriculture & Food Security',
    category: 'commerce',
    description: 'Farmer identity enumeration, subsidized fertilizer and tractor allocations, livestock registration, and agro-commodity market permits.',
    personas: ['Individual', 'Corporate'],
    icon: Home,
    isInteractive: false,
    audience: 'kadp',
    scopes: ['profile:read', 'agric:farmer_id'],
    statutoryBasis: 'Kaduna Agricultural Transformation Agenda'
  },
  {
    id: 'tsp-13',
    name: 'State Transport Authority Inter-State Manifest',
    acronym: 'KSTA',
    agency: 'Kaduna State Transport Authority',
    category: 'transport',
    description: 'Commercial motor park ticketing, interstate digital passenger manifest verification, and unified route licensing for commercial operators.',
    personas: ['Individual', 'Corporate'],
    icon: CarFront,
    isInteractive: false,
    audience: 'ksta',
    scopes: ['profile:read', 'transport:manifest'],
    statutoryBasis: 'Kaduna State Transport Authority Edict'
  },
  {
    id: 'tsp-14',
    name: 'Kaduna Social Investment Agency',
    acronym: 'KADSIPA',
    agency: 'Kaduna State Social Investment Programmes Agency',
    category: 'social',
    description: 'Unified state social register, micro-business livelihood grants, social safety net disbursements, and vulnerable citizen identity verification.',
    personas: ['Individual'],
    icon: User,
    isInteractive: false,
    audience: 'kadsipa',
    scopes: ['profile:read', 'social:register'],
    statutoryBasis: 'Kaduna State Social Protection Policy'
  }
]

export default function ServicesPage() {
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const connectedTsps = useAuthEngine((s) => s.connectedTsps)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPersona, setSelectedPersona] = useState<string>('all')
  const [inspectingService, setInspectingService] = useState<ServiceItem | null>(null)

  // SSO Transition Modal State
  const [transitioningTsp, setTransitioningTsp] = useState<{
    name: string
    url: string
    audience: string
  } | null>(null)

  const handleCloseTransition = useCallback(() => {
    setTransitioningTsp(null)
  }, [])

  const citizenName = identity?.legalName || currentUser?.email.split('@')[0] || 'Citizen'
  const citizenId = currentUser?.citizenId || 'CIT-KAD-2024-00847'

  // Filter logic
  const filteredServices = useMemo(() => {
    return SERVICES_CATALOG.filter((item) => {
      // Search filter
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

      // Persona filter
      const matchesPersona =
        selectedPersona === 'all' ||
        item.personas.some((p) => p.toLowerCase() === selectedPersona.toLowerCase())

      return matchesSearch && matchesCategory && matchesPersona
    })
  }, [searchQuery, selectedCategory, selectedPersona])

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'revenue', label: 'Taxes & Revenue' },
    { id: 'transport', label: 'Motor & Transport' },
    { id: 'land', label: 'Land & Property' },
    { id: 'commerce', label: 'Business & Commerce' },
    { id: 'social', label: 'Social & Education' },
    { id: 'utilities', label: 'Utilities & Environment' }
  ]

  const personas = [
    { id: 'all', label: 'All Personas' },
    { id: 'individual', label: 'Individual Citizens' },
    { id: 'corporate', label: 'Corporate Entities' },
    { id: 'government', label: 'Government MDAs' }
  ]

  return (
    <div className="p-6 sm:p-9 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* HEADER BREADCRUMB & HERO BANNER                                           */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/paykaduna"
            className="text-[var(--ink-soft)] hover:text-[var(--green)] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>PayKaduna Dashboard</span>
          </Link>
          <span className="text-[var(--line)]">/</span>
          <span className="text-[var(--ink)] font-semibold">State Services Directory</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 font-semibold">
            14 MDAs Integrated
          </span>
        </div>
      </div>

      {/* Hero Welcome Card */}
      <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-6 sm:p-8 rounded-[var(--radius)] relative overflow-hidden shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Auth 2.0 Central SSO Mesh
              </span>
              <span className="text-xs text-[var(--ink-soft)]">&middot;</span>
              <span className="text-xs font-mono text-[var(--ink-soft)]">{citizenId}</span>
            </div>

            <h1 className="font-sans font-semibold text-[24px] sm:text-[28px] text-[var(--ink)] tracking-tight leading-tight">
              Kaduna State Digital Services Directory
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1.5 max-w-[70ch] leading-relaxed">
              Every connected Touchpoint Service Provider (TSP) in Kaduna State is accessible using your single verified citizen credential. Under NDPA 2023 guidelines, each agency receives only audience-scoped, pseudonymized security tokens.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex md:flex-col gap-3 shrink-0 text-xs">
            <div className="bg-[var(--paper)] border border-[var(--line)] p-3 rounded-[var(--radius)] min-w-[150px]">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-soft)]">
                Active SSO Tokens
              </div>
              <div className="font-mono text-base font-bold text-[var(--green)] mt-0.5">
                RS256 &middot; Scoped
              </div>
            </div>
            <div className="bg-[var(--paper)] border border-[var(--line)] p-3 rounded-[var(--radius)] min-w-[150px]">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-soft)]">
                Citizen Privacy Bar
              </div>
              <div className="font-sans text-xs font-semibold text-[var(--ink)] mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--green)]" />
                <span>NIN Segregated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH AND FILTERS BAR                                                    */}
      {/* ========================================================================= */}
      <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 sm:p-5 rounded-[var(--radius)] space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--ink-soft)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service name, agency (e.g. KADGIS, KADVREG), or description..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:border-[var(--green)] transition-colors"
            />
          </div>

          {/* Persona Filter Dropdown/Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {personas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPersona(p.id)}
                className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedPersona === p.id
                    ? 'bg-[var(--green)] text-white shadow-2xs'
                    : 'bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[var(--line)]">
          <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mr-2 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Categories:
          </span>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-[var(--radius)] text-[11.5px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[var(--ink)] text-white font-semibold'
                  : 'bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FEATURED INTERACTIVE PROTOCOLS (KADVREG & PIT e-Tax)                      */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-semibold text-[16px] text-[var(--ink)] tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--green)]" />
            <span>Featured Live Applications in Prototype</span>
          </h2>
          <span className="text-xs text-[var(--ink-soft)]">
            Full external standalone portals with dedicated branding
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KADVREG Highlight Card */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-6 rounded-[var(--radius)] border border-blue-800 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <Car className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Motor Licensing TSP
                </span>
              </div>

              <div>
                <h3 className="font-bold text-lg text-white">KADVREG — Motor Vehicle Administration</h3>
                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Vehicle fleet renewals, roadworthiness certificate validation, digital plate allocations, and automated driver records.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-blue-300 font-mono">
                <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800">aud: kadvreg</span>
                <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800">RS256 JWT</span>
                <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800">Zero-Friction SSO</span>
              </div>
            </div>

            <div className="pt-5 border-t border-blue-800/80 mt-4 flex items-center justify-between relative z-10">
              <button
                type="button"
                onClick={() =>
                  setInspectingService(
                    SERVICES_CATALOG.find((s) => s.id === 'kadvreg') || null
                  )
                }
                className="text-xs text-blue-300 hover:text-white underline cursor-pointer"
              >
                Inspect Token Scopes
              </button>

              <button
                type="button"
                onClick={() =>
                  setTransitioningTsp({
                    name: 'KADVREG Vehicle Licensing',
                    url: '/kadvreg',
                    audience: 'kadvreg'
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch KADVREG Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PIT Highlight Card */}
          <div className="bg-gradient-to-br from-slate-950 via-[#0B1E36] to-amber-950 text-white p-6 rounded-[var(--radius)] border border-amber-800/60 shadow-md flex flex-col justify-between">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Direct Assessment TSP
                </span>
              </div>

              <div>
                <h3 className="font-bold text-lg text-white">PIT Portal — Personal Income Tax Platform</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Interactive PITA tax calculator, annual self-assessment returns, Remita RRR settlement, electronic Tax Clearance Certificate (e-TCC), and progressive profiling.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-amber-300 font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-amber-900/60">aud: pit</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-amber-900/60">Progressive Profiling</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-amber-900/60">e-TCC Verified</span>
              </div>
            </div>

            <div className="pt-5 border-t border-amber-900/60 mt-4 flex items-center justify-between relative z-10">
              <button
                type="button"
                onClick={() =>
                  setInspectingService(
                    SERVICES_CATALOG.find((s) => s.id === 'pit') || null
                  )
                }
                className="text-xs text-amber-300 hover:text-white underline cursor-pointer"
              >
                Inspect Token Scopes
              </button>

              <button
                type="button"
                onClick={() =>
                  setTransitioningTsp({
                    name: 'PIT Personal Income Tax',
                    url: '/pit',
                    audience: 'pit'
                  })
                }
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch PIT e-Tax Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ALL 14 STATE SERVICES GRID                                                */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sans font-semibold text-[18px] text-[var(--ink)] tracking-tight">
              State Services Directory ({filteredServices.length} Results)
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Click any service card to view its cryptographic permission scope, or launch directly into the application.
            </p>
          </div>

          <div className="hidden sm:block text-xs font-mono text-[var(--ink-soft)]">
            AAL2 Active Session
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            const Icon = service.icon
            const isConnected = connectedTsps.includes(service.id) || service.id === 'paykaduna'

            return (
              <div
                key={service.id}
                className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-5 hover:border-[var(--green)]/60 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  {/* Card Top: Icon & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-[var(--radius)] bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center shrink-0 border border-[var(--green)]/20 group-hover:bg-[var(--green)] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Authorized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium bg-[var(--paper)] text-[var(--ink-soft)] border border-[var(--line)]">
                          <Lock className="w-3 h-3" />
                          SSO Ready
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase">
                        {service.acronym}
                      </span>
                    </div>
                  </div>

                  {/* Title & Agency */}
                  <div>
                    <h3 className="font-sans font-semibold text-[15px] text-[var(--ink)] leading-snug">
                      {service.name}
                    </h3>
                    <div className="text-[11px] font-medium text-[var(--ink-soft)] mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 shrink-0 text-[var(--green)]" />
                      <span className="truncate">{service.agency}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--ink-soft)] leading-relaxed line-clamp-3">
                    {service.description}
                  </p>

                  {/* Personas & Audience */}
                  <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--line-soft)]">
                    {service.personas.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 rounded bg-[var(--paper)] border border-[var(--line)] text-[10px] text-[var(--ink)] font-medium"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="px-1.5 py-0.5 rounded bg-[var(--line-soft)] text-[10px] font-mono text-[var(--ink-soft)] ml-auto">
                      aud: {service.audience}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-[var(--line)] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setInspectingService(service)}
                    className="text-[var(--ink-soft)] hover:text-[var(--ink)] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Claims</span>
                  </button>

                  {service.isInteractive ? (
                    <button
                      type="button"
                      onClick={() =>
                        setTransitioningTsp({
                          name: service.name,
                          url: service.launchUrl || '/paykaduna',
                          audience: service.audience
                        })
                      }
                      className="px-3 py-1.5 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white font-semibold rounded-[var(--radius)] transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span>Launch Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInspectingService(service)}
                      className="px-2.5 py-1.5 bg-[var(--paper)] hover:bg-[var(--line-soft)] border border-[var(--line)] text-[var(--ink)] font-medium rounded-[var(--radius)] transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Simulate Access</span>
                      <ExternalLink className="w-3 h-3 text-[var(--ink-soft)]" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TOKEN SCOPE & PERMISSIONS INSPECTOR MODAL                                */}
      {/* ========================================================================= */}
      {inspectingService && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center shrink-0 border border-[var(--green)]/20">
                  <inspectingService.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-[17px] text-[var(--ink)]">
                    {inspectingService.name}
                  </h3>
                  <span className="text-xs text-[var(--ink-soft)]">
                    Cryptographic Token &amp; NDPA Scopes &middot; <code>aud: {inspectingService.audience}</code>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingService(null)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-lg cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-[var(--radius)] flex items-start gap-2.5 text-xs text-[var(--ink)]">
              <ShieldCheck className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>The Golden Rule Enforced:</strong> Your raw 11-digit National Identity Number (NIN) is never transferred to {inspectingService.agency}. Instead, this service receives an audience-locked RS256 JWT using your internal Citizen ID (<code>{citizenId}</code>).
              </p>
            </div>

            {/* Decoded Claims Box */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--ink)] flex items-center justify-between">
                <span>Simulated RS256 JWT Claims Payload:</span>
                <span className="font-mono text-[11px] text-[var(--green)] font-bold">AAL2 Biometric Verified</span>
              </div>

              <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] p-4 font-mono text-xs space-y-1.5 text-[var(--ink)]">
                <div><span className="text-[var(--ink-soft)]">"iss":</span> "https://auth.kaduna.gov.ng"</div>
                <div><span className="text-[var(--ink-soft)]">"aud":</span> <strong className="text-[var(--green)]">"{inspectingService.audience}"</strong></div>
                <div><span className="text-[var(--ink-soft)]">"sub":</span> "{citizenId}"</div>
                <div><span className="text-[var(--ink-soft)]">"legal_name":</span> "{citizenName}"</div>
                <div><span className="text-[var(--ink-soft)]">"acr":</span> "2" <span className="text-[var(--ink-soft)]">// Assurance Level 2 (2FA)</span></div>
                <div><span className="text-[var(--ink-soft)]">"scopes":</span> {JSON.stringify(inspectingService.scopes)}</div>
                <div><span className="text-[var(--ink-soft)]">"ndpa_statutory_basis":</span> "{inspectingService.statutoryBasis}"</div>
                <div><span className="text-[var(--ink-soft)]">"nin_masked":</span> true <span className="text-[var(--ink-soft)]">// Raw NIN Segregated</span></div>
              </div>
            </div>

            {/* Permitted Scopes Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-[var(--ink)]">Authorized Functional Capabilities:</div>
              <ul className="space-y-1 text-[var(--ink-soft)]">
                {inspectingService.scopes.map((scope) => (
                  <li key={scope} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                    <span><code className="text-[var(--ink)]">{scope}</code> &mdash; authorized under state revenue compliance guidelines.</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--ink-soft)]">
                Issuing Agency: {inspectingService.agency}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingService(null)}
                  className="px-3.5 py-2 border border-[var(--line)] text-xs font-semibold rounded-[var(--radius)] hover:bg-[var(--line-soft)] cursor-pointer transition-colors"
                >
                  Close
                </button>

                {inspectingService.isInteractive && (
                  <button
                    type="button"
                    onClick={() => {
                      const s = inspectingService
                      setInspectingService(null)
                      setTransitioningTsp({
                        name: s.name,
                        url: s.launchUrl || '/paykaduna',
                        audience: s.audience
                      })
                    }}
                    className="px-4 py-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-[var(--radius)] cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Launch {inspectingService.acronym}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SSO TRANSITION MODAL (For KADVREG & PIT Launches)                         */}
      {/* ========================================================================= */}
      {transitioningTsp && (
        <SSOTransitionModal
          isOpen={true}
          targetTspName={transitioningTsp.name}
          targetTspUrl={transitioningTsp.url}
          targetAudience={transitioningTsp.audience}
          onClose={handleCloseTransition}
        />
      )}
    </div>
  )
}

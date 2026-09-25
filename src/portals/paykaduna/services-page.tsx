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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      
      {/* ── Page Header & Navigation Breadcrumb ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--gray-200)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--gray-500)] mb-1">
            <Link
              to="/paykaduna"
              className="hover:text-[var(--ink)] flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#1AA260]" />
              <span>Dashboard</span>
            </Link>
            <span className="text-[var(--gray-300)]">/</span>
            <span className="text-[var(--ink)] font-semibold">Services Directory</span>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[var(--ink)] tracking-tight leading-tight">
            Kaduna State Services Directory
          </h1>
          <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-0.5">
            Single sign-on access across all 14 connected state revenue, transport, and municipal agencies.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NIN Segregated &middot; RS256 Scoped</span>
          </span>
          <span className="text-xs font-mono text-[var(--gray-500)] px-3 py-1 bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-full">
            {citizenId}
          </span>
        </div>
      </div>

      {/* ── Search & Filters Bar (Rounded Card) ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] p-4 sm:p-5 rounded-[22px] space-y-3.5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--gray-400)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service name, agency (e.g. KADGIS, KADVREG), or description..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--paper)]/50 dark:bg-white/[0.03] border border-[var(--gray-200)] rounded-full text-xs text-[var(--ink)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all shadow-xs"
            />
          </div>

          {/* Persona Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 bg-black/[0.02] dark:bg-white/[0.04] p-1 rounded-full border border-[var(--gray-200)] text-xs">
            {personas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPersona(p.id)}
                className={`px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedPersona === p.id
                    ? 'bg-[#1AA260] text-white shadow-xs font-semibold'
                    : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 border-t border-[var(--gray-200)] dark:border-white/5">
          <span className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mr-1.5 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#1AA260]" />
          </span>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-full text-[11.5px] whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[var(--ink)] text-white font-semibold shadow-xs'
                  : 'bg-[var(--paper)]/70 dark:bg-white/[0.04] text-[var(--gray-500)] hover:text-[var(--ink)] border border-[var(--gray-200)] font-medium'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── All 14 State Services Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              State Services Directory ({filteredServices.length} Results)
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-0.5">
              Click any service card to view its cryptographic permission scope, or launch directly into the application.
            </p>
          </div>

          <div className="hidden sm:block text-xs font-mono text-[var(--gray-500)]">
            AAL2 Active Session
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredServices.map((service) => {
            const Icon = service.icon
            const isConnected = connectedTsps.includes(service.id) || service.id === 'paykaduna'

            return (
              <div
                key={service.id}
                className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[22px] p-5 hover:border-emerald-400 dark:hover:border-emerald-600/70 hover:shadow-md transition-all flex flex-col justify-between group shadow-sm gap-4"
              >
                <div className="space-y-3">
                  
                  {/* Card Top: Icon & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40 group-hover:bg-[#1AA260] group-hover:text-white transition-all shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" />
                          Authorized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[var(--paper)] text-[var(--gray-500)] border border-[var(--gray-200)]">
                          <Lock className="w-3 h-3" />
                          SSO Ready
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[var(--gray-400)] uppercase">
                        {service.acronym}
                      </span>
                    </div>
                  </div>

                  {/* Title & Agency */}
                  <div>
                    <h3 className="font-semibold text-[15px] sm:text-[16px] text-[var(--ink)] leading-snug group-hover:text-[#1AA260] transition-colors">
                      {service.name}
                    </h3>
                    <div className="text-xs font-medium text-[var(--gray-500)] mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-[#1AA260]" />
                      <span className="truncate">{service.agency}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--gray-500)] leading-relaxed line-clamp-3">
                    {service.description}
                  </p>

                  {/* Personas & Audience */}
                  <div className="pt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[var(--gray-200)] dark:border-white/5">
                    {service.personas.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--gray-200)] text-[10.5px] text-[var(--gray-700)] dark:text-[var(--gray-300)] font-medium"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50/50 dark:bg-emerald-950/30 text-[10px] font-mono text-[#1AA260] border border-emerald-200/40 dark:border-emerald-800/30 ml-auto">
                      aud: {service.audience}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3.5 mt-2 border-t border-[var(--gray-200)] dark:border-white/5 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setInspectingService(service)}
                    className="text-[var(--gray-500)] hover:text-[#1AA260] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Claims</span>
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
                      className="px-4 py-2 bg-[#1AA260] hover:bg-[#158A52] text-white font-semibold rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer text-xs"
                    >
                      <span>Launch Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInspectingService(service)}
                      className="px-3.5 py-1.5 bg-[var(--paper)] hover:bg-[var(--line-soft)] border border-[var(--gray-200)] text-[var(--ink)] font-medium rounded-full transition-colors inline-flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <span>Simulate Access</span>
                      <ExternalLink className="w-3 h-3 text-[var(--gray-400)]" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Token Scope & Permissions Inspector Modal ── */}
      {inspectingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[26px] max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-float animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--gray-200)] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
                  <inspectingService.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)]">
                    {inspectingService.name}
                  </h3>
                  <span className="text-xs text-[var(--gray-500)]">
                    Cryptographic Token &amp; NDPA Scopes &middot; <code>aud: {inspectingService.audience}</code>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingService(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--gray-400)] hover:text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-lg cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl flex items-start gap-3 text-xs text-[var(--ink)] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#1AA260] shrink-0 mt-0.5" />
              <p>
                <strong>The Golden Rule Enforced:</strong> Your raw 11-digit National Identity Number (NIN) is never transferred to {inspectingService.agency}. Instead, this service receives an audience-locked RS256 JWT using your internal Citizen ID (<code>{citizenId}</code>).
              </p>
            </div>

            {/* Decoded Claims Box */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--ink)] flex items-center justify-between">
                <span>Simulated RS256 JWT Claims Payload:</span>
                <span className="font-mono text-[11px] text-[#1AA260] font-bold">AAL2 Biometric Verified</span>
              </div>

              <div className="bg-[var(--paper)] border border-[var(--gray-200)] rounded-2xl p-4 font-mono text-xs space-y-1.5 text-[var(--ink)]">
                <div><span className="text-[var(--gray-500)]">"iss":</span> "https://auth.kaduna.gov.ng"</div>
                <div><span className="text-[var(--gray-500)]">"aud":</span> <strong className="text-[#1AA260]">"{inspectingService.audience}"</strong></div>
                <div><span className="text-[var(--gray-500)]">"sub":</span> "{citizenId}"</div>
                <div><span className="text-[var(--gray-500)]">"legal_name":</span> "{citizenName}"</div>
                <div><span className="text-[var(--gray-500)]">"acr":</span> "2" <span className="text-[var(--gray-400)]">// Assurance Level 2 (2FA)</span></div>
                <div><span className="text-[var(--gray-500)]">"scopes":</span> {JSON.stringify(inspectingService.scopes)}</div>
                <div><span className="text-[var(--gray-500)]">"ndpa_statutory_basis":</span> "{inspectingService.statutoryBasis}"</div>
                <div><span className="text-[var(--gray-500)]">"nin_masked":</span> true <span className="text-[var(--gray-400)]">// Raw NIN Segregated</span></div>
              </div>
            </div>

            {/* Permitted Scopes Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-[var(--ink)]">Authorized Functional Capabilities:</div>
              <ul className="space-y-1 text-[var(--gray-600)] dark:text-[var(--gray-400)]">
                {inspectingService.scopes.map((scope) => (
                  <li key={scope} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1AA260] shrink-0" />
                    <span><code className="text-[var(--ink)] font-mono">{scope}</code> &mdash; authorized under state revenue compliance guidelines.</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3.5 border-t border-[var(--gray-200)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--gray-500)]">
                Issuing Agency: {inspectingService.agency}
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setInspectingService(null)}
                  className="px-4 py-2 border border-[var(--gray-200)] text-xs font-semibold rounded-full hover:bg-black/[0.03] dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
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
                    className="px-5 py-2 bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold rounded-full cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
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

      {/* ── SSO Transition Modal (For KADVREG & PIT Launches) ── */}
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

import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router'
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Layers,
  User,
  Sparkles,
  Lock,
  Plus
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { TSP_REGISTRY } from '@/components/layout/portal-branding'
import { SSOTransitionModal } from '@/components/auth/sso-transition-modal'
import type { PersonaType } from '@/types'

export default function PayKadunaDashboard() {
  const navigate = useNavigate()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const activePersona = useAuthEngine((s) => s.activePersona)
  const switchPersona = useAuthEngine((s) => s.switchPersona)
  const currentToken = useAuthEngine((s) => s.currentToken)
  const connectedTsps = useAuthEngine((s) => s.connectedTsps)
  const reconciledRecordIds = useAuthEngine((s) => s.reconciledRecordIds)

  // Service filter: 'all' | 'individual' | 'corporate' | 'government'
  const [filterCategory, setFilterCategory] = useState<'all' | 'individual' | 'corporate' | 'government'>('all')

  // Quick state for viewing TSP token details modal
  const [inspectingTsp, setInspectingTsp] = useState<typeof TSP_REGISTRY[number] | null>(null)

  // State for SSO Transition Handshake Modal with delay
  const [transitioningTsp, setTransitioningTsp] = useState<{
    name: string
    url: string
    audience: string
  } | null>(null)

  const handleCloseTransition = useCallback(() => {
    setTransitioningTsp(null)
  }, [])

  // Fallback defaults for safety
  const citizenName = identity?.legalName || currentUser?.email.split('@')[0] || 'Citizen'
  const citizenId = currentUser?.citizenId || 'CIT-KAD-2024-00847'
  const lga = currentUser?.lga || 'Kaduna North'
  const taxOffice = currentUser?.taxOffice || 'Kaduna Central Revenue Office'

  // Initials from name
  const initials = citizenName
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')

  // Masked NIN
  const maskedNin = identity?.nin
    ? `${identity.nin.slice(0, 3)}••••${identity.nin.slice(-3)}`
    : '123••••901'

  // Is this Fatima with un-reconciled legacy accounts?
  const isFatima = currentUser?.email.toLowerCase().includes('fatima') || identity?.nin === '12345678901'
  const hasUnreconciledAccounts = isFatima && reconciledRecordIds.length === 0

  // Filter TSPs — show only connected TSPs on the dashboard
  const connectedTspsList = TSP_REGISTRY.filter(
    (tsp) => connectedTsps.includes(tsp.id) || tsp.id === 'paykaduna'
  )

  const filteredTsps = connectedTspsList.filter((tsp) => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'individual') return tsp.personas.includes('Individual') || tsp.personas.includes('All')
    if (filterCategory === 'corporate') return tsp.personas.includes('Corporate') || tsp.personas.includes('All')
    if (filterCategory === 'government') return tsp.personas.includes('Government') || tsp.personas.includes('All')
    return true
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      
      {/* ── Citizen Master Hero Banner ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[24px] p-6 sm:p-7 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            
            {/* Top Verification & ID badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Identity Verified (NIMC)
              </span>
              <span className="text-xs text-[var(--gray-300)]">&bull;</span>
              <span className="text-xs font-mono text-[var(--gray-500)]">{citizenId}</span>
            </div>

            {/* Avatar + Heading */}
            <div className="flex items-center gap-3.5 pt-1">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-base font-bold shrink-0 shadow-xs">
                {initials}
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[var(--ink)] tracking-tight leading-tight">
                  Good day, {citizenName}
                </h1>
                <p className="text-xs text-[var(--gray-500)] mt-0.5">
                  Welcome to your Unified Kaduna State Citizen Portal
                </p>
              </div>
            </div>

            {/* Metadata Pills / Line */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-2 text-xs text-[var(--gray-500)]">
              <span><strong className="text-[var(--ink)] font-semibold">NIN:</strong> <code className="font-mono text-[var(--ink)]">{maskedNin}</code></span>
              <span className="text-[var(--gray-300)] hidden sm:inline">&bull;</span>
              <span><strong className="text-[var(--ink)] font-semibold">Tax Office:</strong> {taxOffice}</span>
              <span className="text-[var(--gray-300)] hidden sm:inline">&bull;</span>
              <span><strong className="text-[var(--ink)] font-semibold">LGA:</strong> {lga}</span>
              <span className="text-[var(--gray-300)] hidden sm:inline">&bull;</span>
              <span><strong className="text-[var(--ink)] font-semibold">Security:</strong> Level 2 (2FA Protected)</span>
              <span className="text-[var(--gray-300)] hidden sm:inline">&bull;</span>
              <Link
                to="/auth/profile"
                className="inline-flex items-center gap-1 font-semibold text-[#1AA260] hover:underline"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile &amp; Privacy &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Active Persona Badge & Switcher */}
          <div className="md:text-right shrink-0">
            <div className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold mb-2">
              Active Context
            </div>
            <div className="inline-flex rounded-full border border-[var(--gray-200)] p-1 bg-black/[0.02] dark:bg-white/[0.04]">
              {(['individual', 'corporate', 'agency'] as PersonaType[]).map((p) => {
                const isActive = activePersona === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => switchPersona(p)}
                    className={`px-3.5 py-1 text-xs rounded-full capitalize transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1AA260] text-white shadow-xs font-semibold'
                        : 'text-[var(--gray-500)] hover:text-[var(--ink)] font-medium'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Reconciliation Banner (For Fatima & Legacy Users) ── */}
      {hasUnreconciledAccounts && (
        <div className="bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 p-5 sm:p-6 rounded-[22px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-[17px] text-[var(--ink)] tracking-tight">
                3 Pre-Migration Accounts Detected Across Kaduna Agencies
              </h2>
              <p className="text-xs text-[var(--gray-600)] dark:text-[var(--gray-400)] mt-1 max-w-[70ch] leading-relaxed">
                The KADIRS Reconciliation Engine discovered existing historical records on <strong>KADVREG</strong> and <strong>PIT Portal</strong> that match your identity attributes. Unify them under your citizen ID to preserve historical receipts and payment certificates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/auth/reconciliation')}
            className="bg-[#1AA260] hover:bg-[#158A52] text-white font-semibold px-5 py-2.5 rounded-full text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <span>Review &amp; Unify Accounts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Quick Stats Grid (4 Metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Stat 1: Revenue Contributed */}
        <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] p-5 rounded-[22px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold">Total State Revenue Paid</span>
              <div className="w-8 h-8 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-[26px] text-[var(--ink)] tracking-tight mt-1.5">
              {activePersona === 'corporate' ? '₦285,000.00' : '₦15,000.00'}
            </div>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 pt-3 border-t border-[var(--gray-200)] dark:border-white/5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1AA260]"></span>
            <span>Verified receipts active</span>
          </div>
        </div>

        {/* Stat 2: Active Identity Level */}
        <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] p-5 rounded-[22px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold">Identity Assurance</span>
              <div className="w-8 h-8 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-[26px] text-[var(--ink)] tracking-tight mt-1.5">
              Level 2 (NIMC)
            </div>
          </div>
          <div className="text-xs text-[var(--gray-500)] mt-3 pt-3 border-t border-[var(--gray-200)] dark:border-white/5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1AA260]"></span>
            <span>Biometric NIN anchor</span>
          </div>
        </div>

        {/* Stat 3: Connected Portals */}
        <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] p-5 rounded-[22px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold">Connected Services</span>
              <div className="w-8 h-8 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-[26px] text-[var(--ink)] tracking-tight mt-1.5">
              {connectedTsps.length} of 14 Portals
            </div>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 pt-3 border-t border-[var(--gray-200)] dark:border-white/5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1AA260]"></span>
            <span>Single sign-on active</span>
          </div>
        </div>

        {/* Stat 4: Tax Compliance */}
        <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] p-5 rounded-[22px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold">Tax Assessment 2024</span>
              <div className="w-8 h-8 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-[26px] text-[var(--ink)] tracking-tight mt-1.5">
              In Good Standing
            </div>
          </div>
          <div className="text-xs text-[var(--gray-500)] mt-3 pt-3 border-t border-[var(--gray-200)] dark:border-white/5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1AA260]"></span>
            <span>Next assessment: Dec 2024</span>
          </div>
        </div>
      </div>

      {/* ── Connected Services Section (Only Connected TSPs) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--gray-200)] pb-3">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              Connected Services ({connectedTspsList.length})
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-0.5">
              Kaduna State portals authorized with your single citizen identity and active SSO session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Pills (if multiple connected) */}
            {connectedTspsList.length > 3 && (
              <div className="flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--gray-200)] p-1 rounded-full text-xs shadow-2xs">
                {(['all', 'individual', 'corporate', 'government'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3.5 py-1 rounded-full capitalize font-medium transition-all cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-[#1AA260] text-white shadow-xs font-semibold'
                        : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Link to full 14 services catalog */}
            <Link
              to="/paykaduna/services"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <span>Explore All Services (14)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Connected TSP Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredTsps.map((tsp) => {
            const isCurrent = tsp.id === 'paykaduna'
            const isKadvreg = tsp.id === 'kadvreg'
            const isPit = tsp.id === 'pit'

            return (
              <div
                key={tsp.id}
                className={`p-5 rounded-[22px] border transition-all flex flex-col justify-between gap-4 shadow-sm hover:shadow-md ${
                  isCurrent
                    ? 'border-[#1AA260]/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-[var(--gray-200)] bg-[var(--card-bg)] hover:border-emerald-300 dark:hover:border-emerald-700/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                        <tsp.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-[15px] text-[var(--ink)] leading-snug">
                          {tsp.name}
                        </h3>
                        <span className="text-[11px] font-mono text-[var(--gray-500)] uppercase block mt-0.5">
                          {tsp.id}
                        </span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="text-[10.5px] font-semibold text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full shrink-0">
                        Current Portal
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-semibold text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        SSO Connected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--gray-500)] line-clamp-2 leading-relaxed">
                    {tsp.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--gray-200)] dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--gray-500)] font-medium">
                    {tsp.personas}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setInspectingTsp(tsp)}
                      className="text-[var(--gray-400)] hover:text-[#1AA260] text-[11.5px] font-medium cursor-pointer transition-colors"
                      title="Inspect Token Details"
                    >
                      Token
                    </button>

                    {isKadvreg ? (
                      <button
                        type="button"
                        onClick={() =>
                          setTransitioningTsp({
                            name: 'KADVREG Vehicle Administration',
                            url: '/kadvreg',
                            audience: 'kadvreg'
                          })
                        }
                        className="text-[#1AA260] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Launch KADVREG</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isPit ? (
                      <button
                        type="button"
                        onClick={() =>
                          setTransitioningTsp({
                            name: 'PIT Personal Income Tax',
                            url: '/pit',
                            audience: 'pit'
                          })
                        }
                        className="text-[#1AA260] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Launch PIT Portal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isCurrent ? (
                      <span className="text-[#1AA260] font-semibold text-xs">
                        Active Portal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setTransitioningTsp({
                            name: tsp.name,
                            url: '/paykaduna/services',
                            audience: tsp.id
                          })
                        }
                        className="text-[#1AA260] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Launch Portal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Connect More Services Card */}
          <Link
            to="/paykaduna/services"
            className="p-5 rounded-[22px] border-2 border-dashed border-[var(--gray-200)] hover:border-emerald-400 dark:hover:border-emerald-600/70 bg-black/[0.01] dark:bg-white/[0.01] hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all flex flex-col items-center justify-center text-center gap-3 group cursor-pointer min-h-[170px]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--ink)] group-hover:text-[#1AA260] transition-colors">
                Connect More Services
              </h3>
              <p className="text-xs text-[var(--gray-500)] mt-0.5 max-w-[26ch]">
                Explore 14 Kaduna State MDAs &amp; authorize new TSP applications
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Recent Unified Revenue Receipts Table ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[24px] p-6 sm:p-7 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)] tracking-tight">
              Unified Revenue Receipts
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-0.5">
              Verified transactions aggregated across Kaduna State revenue agencies under your citizen ID.
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Receipt printing and CSV export will be active in full release.')}
            className="text-xs font-semibold text-[#1AA260] hover:underline cursor-pointer self-start sm:self-auto"
          >
            Export Statement &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--gray-200)] text-[var(--gray-500)] text-[11px] uppercase tracking-wider">
                <th className="py-3 font-semibold">Receipt Ref</th>
                <th className="py-3 font-semibold">Origin Agency</th>
                <th className="py-3 font-semibold">Description</th>
                <th className="py-3 font-semibold">Date</th>
                <th className="py-3 font-semibold text-right">Amount (NGN)</th>
                <th className="py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gray-200)] text-[var(--ink)]">
              <tr className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 font-mono text-[12px] text-[var(--gray-700)] dark:text-[var(--gray-300)]">RCP-KD-2024-0982</td>
                <td className="py-3.5 font-semibold text-[13px] text-[var(--ink)]">PayKaduna Gateway</td>
                <td className="py-3.5 text-[12.5px] text-[var(--gray-600)] dark:text-[var(--gray-400)]">Vehicle Registration &amp; Plate Licensing</td>
                <td className="py-3.5 text-[12px] text-[var(--gray-500)]">14 Mar 2024</td>
                <td className="py-3.5 font-mono font-bold text-right text-[13px]">₦15,000.00</td>
                <td className="py-3.5 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50">
                    Settled
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 font-mono text-[12px] text-[var(--gray-700)] dark:text-[var(--gray-300)]">RCP-KD-2024-0411</td>
                <td className="py-3.5 font-semibold text-[13px] text-[var(--ink)]">Kaduna Central Revenue</td>
                <td className="py-3.5 text-[12.5px] text-[var(--gray-600)] dark:text-[var(--gray-400)]">State Signage &amp; Municipal Development Charge</td>
                <td className="py-3.5 text-[12px] text-[var(--gray-500)]">22 Jan 2024</td>
                <td className="py-3.5 font-mono font-bold text-right text-[13px]">₦5,000.00</td>
                <td className="py-3.5 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50">
                    Settled
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Institutional Seal Footer ── */}
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--gray-500)] pt-2 pb-4">
        <Lock className="w-3.5 h-3.5 text-[#1AA260] shrink-0" />
        <span>Kaduna State Internal Revenue Service &middot; Unified Citizen Gateway</span>
      </div>

      {/* ── Inspecting TSP Modal ── */}
      {inspectingTsp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-float animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--gray-200)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                  <inspectingTsp.icon className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  {inspectingTsp.name} SSO Bridge
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTsp(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--gray-400)] hover:text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-base"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[var(--gray-600)] dark:text-[var(--gray-400)] leading-relaxed">
              When a citizen navigates to <strong>{inspectingTsp.name}</strong>, KADIRS Central Auth issues an audience-scoped security token scoped strictly to <code>aud: {inspectingTsp.id}</code> with minimum necessary permissions.
            </p>

            <div className="bg-[var(--paper)] border border-[var(--gray-200)] p-4 rounded-2xl text-xs font-mono space-y-1.5 text-[var(--ink)]">
              <div><strong className="text-[var(--gray-500)]">Audience:</strong> {inspectingTsp.id}</div>
              <div><strong className="text-[var(--gray-500)]">Subject ID:</strong> {citizenId}</div>
              <div><strong className="text-[var(--gray-500)]">Data Protection:</strong> NDPA Compliant (NIN masked)</div>
              <div><strong className="text-[var(--gray-500)]">Assurance Level:</strong> Level {currentToken?.acr || '2'}</div>
              <div><strong className="text-[var(--gray-500)]">Token Ref:</strong> {currentToken?.jti || 'tok-live-01'}</div>
              <div><strong className="text-[var(--gray-500)]">Permitted Scopes:</strong> profile:read, services:access</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingTsp(null)}
                className="bg-[#1AA260] hover:bg-[#158A52] text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SSO Handshake Transition Modal with delay */}
      {transitioningTsp && (
        <SSOTransitionModal
          isOpen={Boolean(transitioningTsp)}
          targetTspName={transitioningTsp.name}
          targetTspUrl={transitioningTsp.url}
          targetAudience={transitioningTsp.audience}
          onClose={handleCloseTransition}
        />
      )}
    </div>
  )
}

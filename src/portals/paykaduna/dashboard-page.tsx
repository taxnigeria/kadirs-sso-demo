import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router'
import {
  ShieldCheck,
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Layers,
  User
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

  // Is this Fatima with un-reconciled legacy accounts?
  const isFatima = currentUser?.email.toLowerCase().includes('fatima') || identity?.nin === '12345678901'
  const hasUnreconciledAccounts = isFatima && reconciledRecordIds.length === 0

  // Filter TSPs
  const filteredTsps = TSP_REGISTRY.filter((tsp) => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'individual') return tsp.personas.includes('Individual') || tsp.personas.includes('All')
    if (filterCategory === 'corporate') return tsp.personas.includes('Corporate') || tsp.personas.includes('All')
    if (filterCategory === 'government') return tsp.personas.includes('Government') || tsp.personas.includes('All')
    return true
  })

  return (
    <div className="p-6 sm:p-9 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-6 sm:p-8 rounded-[var(--radius)] relative overflow-hidden shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                <CheckCircle2 className="w-3 h-3" />
                Identity Verified (NIMC)
              </span>
              <span className="text-xs text-[var(--ink-soft)]">&middot;</span>
              <span className="text-xs font-mono text-[var(--ink-soft)]">{citizenId}</span>
            </div>

            <h1 className="font-sans font-semibold text-[24px] sm:text-[28px] text-[var(--ink)] tracking-tight leading-tight">
              Good day, {citizenName}
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1.5 max-w-[65ch] leading-relaxed">
              Welcome to PayKaduna. All municipal levies, land charges, and state taxes are reconciled under your verified citizen identity.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs text-[var(--ink-soft)]">
              <span><strong className="text-[var(--ink)]">Tax Office:</strong> {taxOffice}</span>
              <span className="text-[var(--line)]">&bull;</span>
              <span><strong className="text-[var(--ink)]">LGA:</strong> {lga}</span>
              <span className="text-[var(--line)]">&bull;</span>
              <span><strong className="text-[var(--ink)]">Security:</strong> Level 2 (2FA Protected)</span>
              <span className="text-[var(--line)]">&bull;</span>
              <Link
                to="/auth/profile"
                className="inline-flex items-center gap-1 font-semibold text-[var(--green)] hover:underline"
              >
                <User className="w-3 h-3" />
                <span>Citizen Profile &amp; NDPA Privacy &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Active Persona Badge & Switcher */}
          <div className="md:text-right shrink-0">
            <div className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
              Active Context
            </div>
            <div className="inline-flex rounded-[var(--radius)] border border-[var(--line)] p-1 bg-[var(--paper)]">
              {(['individual', 'corporate', 'agency'] as PersonaType[]).map((p) => {
                const isActive = activePersona === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => switchPersona(p)}
                    className={`px-3 py-1 text-xs rounded-[var(--radius)] font-medium capitalize transition-all ${
                      isActive
                        ? 'bg-[var(--green)] text-white shadow-2xs font-semibold'
                        : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
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

      {/* HERO RECONCILIATION NOTICE (For Fatima & Legacy Users) */}
      {hasUnreconciledAccounts && (
        <div className="bg-[var(--paper-raised)] border border-[var(--gold)]/40 p-6 rounded-[var(--radius)] flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xs animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--gold)]/15 text-[var(--gold)] flex items-center justify-center shrink-0 mt-0.5 border border-[var(--gold)]/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-[16px] text-[var(--ink)]">
                3 Pre-Migration Accounts Detected Across Kaduna Agencies
              </h2>
              <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-[70ch] leading-relaxed">
                The KADIRS Reconciliation Engine discovered existing historical records on <strong>KADVREG</strong> and <strong>PIT Portal</strong> that match your identity attributes. Unify them under your citizen ID to preserve historical receipts and payment certificates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/auth/reconciliation')}
            className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white font-medium px-5 py-2.5 rounded-[var(--radius)] text-xs flex items-center gap-2 shrink-0 transition-colors shadow-2xs"
          >
            <span>Review &amp; Unify Accounts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Revenue Contributed */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-5 rounded-[var(--radius)] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium">Total State Revenue Paid</span>
              <div className="p-1.5 rounded-[var(--radius)] bg-[var(--green)]/10 text-[var(--green)]">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="font-sans font-semibold text-2xl text-[var(--ink)] tracking-tight">
              {activePersona === 'corporate' ? '₦285,000.00' : '₦15,000.00'}
            </div>
          </div>
          <div className="text-[12px] text-[var(--ink-soft)] mt-2 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]"></span>
            <span className="text-[var(--green)]">Verified receipts active</span>
          </div>
        </div>

        {/* Stat 2: Active Identity Level */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-5 rounded-[var(--radius)] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium">Identity Assurance</span>
              <div className="p-1.5 rounded-[var(--radius)] bg-[var(--green)]/10 text-[var(--green)]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-sans font-semibold text-2xl text-[var(--ink)] tracking-tight">
              Level 2 (NIMC)
            </div>
          </div>
          <div className="text-[12px] text-[var(--ink-soft)] mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]"></span>
            <span>Biometric NIN anchor</span>
          </div>
        </div>

        {/* Stat 3: Connected Portals */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-5 rounded-[var(--radius)] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium">Connected Services</span>
              <div className="p-1.5 rounded-[var(--radius)] bg-[var(--green)]/10 text-[var(--green)]">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="font-sans font-semibold text-2xl text-[var(--ink)] tracking-tight">
              {connectedTsps.length} of 14 Portals
            </div>
          </div>
          <div className="text-[12px] text-[var(--ink-soft)] mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]"></span>
            <span>Single sign-on active</span>
          </div>
        </div>

        {/* Stat 4: Tax Compliance */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-5 rounded-[var(--radius)] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium">Tax Assessment 2024</span>
              <div className="p-1.5 rounded-[var(--radius)] bg-[var(--green)]/10 text-[var(--green)]">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-sans font-semibold text-2xl text-[var(--ink)] tracking-tight">
              In Good Standing
            </div>
          </div>
          <div className="text-[12px] text-[var(--ink-soft)] mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]"></span>
            <span>Next assessment: Dec 2024</span>
          </div>
        </div>
      </div>

      {/* Service Directory Section (14 TSPs) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-3">
          <div>
            <h2 className="font-sans font-semibold text-[18px] sm:text-[20px] text-[var(--ink)] tracking-tight">
              Kaduna State Revenue &amp; Service Directory (14 TSPs)
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Access any Kaduna State service instantly using your single authenticated SSO token.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 bg-[var(--paper)] border border-[var(--line)] p-1 rounded-[var(--radius)] text-xs">
            {(['all', 'individual', 'corporate', 'government'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-[var(--radius)] capitalize font-medium transition-all ${
                  filterCategory === cat
                    ? 'bg-[var(--paper-raised)] text-[var(--ink)] shadow-2xs font-semibold'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 14 TSP Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTsps.map((tsp) => {
            const isCurrent = tsp.id === 'paykaduna'
            const isKadvreg = tsp.id === 'kadvreg'
            const isPit = tsp.id === 'pit'
            const isConnected = connectedTsps.includes(tsp.id)

            return (
              <div
                key={tsp.id}
                className={`p-5 rounded-[var(--radius)] border transition-all flex flex-col justify-between shadow-2xs ${
                  isCurrent
                    ? 'border-[var(--green)]/60 bg-[var(--green)]/5'
                    : 'border-[var(--line)] bg-[var(--paper-raised)] hover:border-[var(--green)]/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--line-soft)] border border-[var(--line)] flex items-center justify-center text-[var(--green)] shrink-0">
                        <tsp.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[var(--ink)]">
                          {tsp.name}
                        </h3>
                        <span className="text-[11px] font-mono text-[var(--ink-soft)] uppercase">
                          {tsp.id}
                        </span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="text-[11px] font-medium text-[var(--green)] bg-[var(--green)]/10 border border-[var(--green)]/20 px-2 py-0.5 rounded-[var(--radius)]">
                        Current Portal
                      </span>
                    ) : isConnected ? (
                      <span className="text-[11px] font-medium text-[var(--green)] bg-[var(--green)]/10 border border-[var(--green)]/20 px-2 py-0.5 rounded-[var(--radius)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        SSO Connected
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--ink-soft)] bg-[var(--line-soft)] border border-[var(--line)] px-2 py-0.5 rounded-[var(--radius)]">
                        Single Sign-On
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--ink-soft)] line-clamp-2 mb-4 leading-relaxed">
                    {tsp.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--line-soft)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--ink-soft)] font-medium">
                    {tsp.personas}
                  </span>

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
                      className="text-[var(--green)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
                      className="text-[var(--green)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Launch PIT Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : isCurrent ? (
                    <span className="text-[var(--green)] font-medium">
                      Active Portal
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInspectingTsp(tsp)}
                      className="text-[var(--ink-soft)] hover:text-[var(--green)] font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Simulate Access</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity / Receipts Section */}
      <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-sans font-semibold text-[18px] sm:text-[20px] text-[var(--ink)] tracking-tight">
              Unified Revenue Receipts
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Verified transactions aggregated across Kaduna State revenue agencies under your citizen ID.
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Receipt printing and CSV export will be active in full release.')}
            className="text-xs text-[var(--green)] hover:underline font-medium"
          >
            Export Statement &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] text-[11px] uppercase tracking-wider">
                <th className="py-2.5 font-medium">Receipt Ref</th>
                <th className="py-2.5 font-medium">Origin Agency</th>
                <th className="py-2.5 font-medium">Description</th>
                <th className="py-2.5 font-medium">Date</th>
                <th className="py-2.5 font-medium text-right">Amount (NGN)</th>
                <th className="py-2.5 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)] text-[var(--ink)]">
              <tr>
                <td className="py-3 font-mono text-[12px]">RCP-KD-2024-0982</td>
                <td className="py-3 font-medium text-[13px]">PayKaduna Gateway</td>
                <td className="py-3 text-[12.5px] text-[var(--ink-soft)]">Vehicle Registration &amp; Plate Licensing</td>
                <td className="py-3 text-[12px] text-[var(--ink-soft)]">14 Mar 2024</td>
                <td className="py-3 font-mono font-medium text-right text-[13px]">₦15,000.00</td>
                <td className="py-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                    Settled
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-[12px]">RCP-KD-2024-0411</td>
                <td className="py-3 font-medium text-[13px]">Kaduna Central Revenue</td>
                <td className="py-3 text-[12.5px] text-[var(--ink-soft)]">State Signage &amp; Municipal Development Charge</td>
                <td className="py-3 text-[12px] text-[var(--ink-soft)]">22 Jan 2024</td>
                <td className="py-3 font-mono font-medium text-right text-[13px]">₦5,000.00</td>
                <td className="py-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                    Settled
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspecting TSP Modal */}
      {inspectingTsp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <inspectingTsp.icon className="w-5 h-5 text-[var(--green)]" />
                <h3 className="font-sans font-semibold text-[16px] text-[var(--ink)]">
                  {inspectingTsp.name} SSO Bridge
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTsp(null)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              When a citizen navigates to <strong>{inspectingTsp.name}</strong>, KADIRS Central Auth issues an audience-scoped security token scoped strictly to <code>aud: {inspectingTsp.id}</code> with minimum necessary permissions.
            </p>

            <div className="bg-[var(--paper)] border border-[var(--line)] p-3.5 rounded-[var(--radius)] text-xs font-mono space-y-1 text-[var(--ink)]">
              <div><strong className="text-[var(--ink-soft)]">Audience:</strong> {inspectingTsp.id}</div>
              <div><strong className="text-[var(--ink-soft)]">Subject ID:</strong> {citizenId}</div>
              <div><strong className="text-[var(--ink-soft)]">Data Protection:</strong> NDPA Compliant (NIN masked)</div>
              <div><strong className="text-[var(--ink-soft)]">Assurance Level:</strong> Level {currentToken?.acr || '2'}</div>
              <div><strong className="text-[var(--ink-soft)]">Token Ref:</strong> {currentToken?.jti || 'tok-live-01'}</div>
              <div><strong className="text-[var(--ink-soft)]">Permitted Scopes:</strong> profile:read, services:access</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingTsp(null)}
                className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-4 py-2 rounded-[var(--radius)] text-xs font-medium"
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

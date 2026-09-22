import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Car,
  CreditCard,
  FileText,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  XCircle,
  ExternalLink
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import {
  findLegacyMatches,
  executeReconciliation,
  type ReconciliationCandidate
} from '@/engine/reconciliation-engine'

export default function ReconciliationPage() {
  const navigate = useNavigate()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const reconciledRecordIds = useAuthEngine((s) => s.reconciledRecordIds)

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [disputedIds, setDisputedIds] = useState<string[]>([])

  // Determine active identity for matching
  const activeIdentity = useMemo(() => {
    return (
      identity || {
        nin: '12345678901',
        legalName: 'Fatima Aminu Abdullahi',
        dateOfBirth: '1989-07-14',
        gender: 'female' as const,
        photoUrl: '',
        verificationProvider: 'nimc' as const,
        verifiedAt: new Date().toISOString()
      }
    )
  }, [identity])

  const activeProfile = useMemo(() => {
    return (
      currentUser || {
        citizenId: 'CIT-KAD-2024-00847',
        email: 'fatimah.a@gmail.com',
        phone: '+234 803 123 4567',
        lga: 'Kaduna North',
        taxOffice: 'Kaduna North Tax Office — Kawo',
        personas: ['individual' as const],
        profileCompleteness: 85,
        createdAt: new Date().toISOString()
      }
    )
  }, [currentUser])

  // Get matching candidate records from the 3 legacy databases
  const candidates = useMemo(() => {
    return findLegacyMatches(activeIdentity, activeProfile)
  }, [activeIdentity, activeProfile])

  // Count how many are already reconciled
  const linkedCount = candidates.filter((c) =>
    reconciledRecordIds.includes(c.record.id)
  ).length
  const allLinked = candidates.length > 0 && linkedCount === candidates.length

  // Link single record
  const handleLinkRecord = (candidate: ReconciliationCandidate) => {
    const res = executeReconciliation(candidate, activeProfile.citizenId, activeIdentity.nin)
    setFeedbackMessage(res.message)
    setTimeout(() => setFeedbackMessage(null), 4000)
  }

  // Link all verified records at once (Hero 1-click action)
  const handleLinkAll = () => {
    let count = 0
    for (const c of candidates) {
      if (c.matchTier !== 'tier_3_conflict' && !reconciledRecordIds.includes(c.record.id)) {
        executeReconciliation(c, activeProfile.citizenId, activeIdentity.nin)
        count++
      }
    }
    setFeedbackMessage(`Unified ${count} legacy service records under citizen ID ${activeProfile.citizenId}.`)
  }

  // Dispute record
  const handleDispute = (candidateId: string) => {
    setDisputedIds((prev) => [...prev, candidateId])
    setFeedbackMessage('Record flagged as disputed. An audit ticket has been routed to the KADIRS Maker/Checker Queue.')
    setTimeout(() => setFeedbackMessage(null), 4000)
  }

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Official Header */}
      <div className="text-center max-w-[620px] mx-auto">
        <div className="w-12 h-12 rounded-full border border-[var(--green)] flex items-center justify-center text-[var(--green)] font-sans font-semibold text-base mb-3.5 mx-auto bg-[var(--paper-raised)] shadow-2xs">
          KD
        </div>
        <h1 className="font-sans font-semibold text-[24px] sm:text-[30px] leading-tight text-[var(--ink)] tracking-tight mb-2">
          Account Reconciliation &amp; Unification
        </h1>
        <p className="text-[13.5px] text-[var(--ink-soft)] leading-relaxed max-w-[54ch] mx-auto">
          We matched pre-migration records across Kaduna State revenue agencies.
          <br className="hidden sm:inline" />
          Review and unify them under your single authenticated citizen identity.
        </p>
      </div>

      {/* Floating feedback message alert */}
      {feedbackMessage && (
        <div className="p-4 bg-[var(--green)]/10 border border-[var(--green)]/30 text-[var(--green)] rounded-[var(--radius)] text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Verified Citizen Master Identity Banner */}
      <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-6 sm:p-7 rounded-[var(--radius)] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Master Identity Anchor (NIMC Level 2)
            </span>
          </div>
          <h2 className="font-sans font-semibold text-[22px] sm:text-[24px] text-[var(--ink)] tracking-tight">
            {activeIdentity.legalName}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--ink-soft)]">
            <span><strong className="text-[var(--ink)]">Citizen ID:</strong> <code className="font-mono">{activeProfile.citizenId}</code></span>
            <span className="text-[var(--line)]">&bull;</span>
            <span><strong className="text-[var(--ink)]">Verified NIN:</strong> <code className="font-mono">{activeIdentity.nin.slice(0, 3)}••••{activeIdentity.nin.slice(-3)}</code></span>
            <span className="text-[var(--line)]">&bull;</span>
            <span><strong className="text-[var(--ink)]">Primary Contact:</strong> {activeProfile.email}</span>
          </div>
        </div>

        {/* Statutory Consent Event 3 Indicator */}
        <div className="sm:text-right shrink-0">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-soft)] block">
            Statutory Consent Event 3
          </span>
          <span className="text-xs text-[var(--ink)] font-medium block mt-0.5">
            Individual Card Review Required
          </span>
          <span className="text-[11px] text-[var(--ink-soft)] block mt-0.5 max-w-[28ch] sm:ml-auto">
            NDPA 2023 mandates deliberate individual consent per service record.
          </span>
        </div>
      </div>

      {/* Completion Banner (When all accounts are unified) */}
      {allLinked && (
        <div className="bg-[var(--green)]/10 border border-[var(--green)]/30 p-7 rounded-[var(--radius)] text-center space-y-3 animate-in fade-in shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[var(--green)]/20 text-[var(--green)] flex items-center justify-center mx-auto border border-[var(--green)]/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-sans font-semibold text-[20px] sm:text-[22px] text-[var(--ink)] tracking-tight">
            All Legacy Accounts Successfully Unified!
          </h3>
          <p className="text-xs text-[var(--ink-soft)] max-w-[55ch] mx-auto leading-relaxed">
            Your single login credentials now seamlessly authorize PayKaduna, KADVREG vehicle licensing, and the PIT Personal Income Tax portal.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/paykaduna')}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-5 py-2 rounded-[var(--radius)] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Return to PayKaduna</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/kadvreg')}
              className="border border-[var(--line)] bg-[var(--paper-raised)] hover:bg-[var(--paper)] text-[var(--ink)] px-5 py-2 rounded-[var(--radius)] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Car className="w-3.5 h-3.5 text-[var(--green)]" />
              <span>Inspect Linked Vehicle in KADVREG</span>
            </button>
          </div>
        </div>
      )}

      {/* RECOGNITION CARDS LIST */}
      <div className="space-y-4">
        {!allLinked && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[var(--paper-raised)] border border-dashed border-[var(--line)] rounded-[var(--radius)] text-xs mb-2">
            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <Info className="w-4 h-4 text-[var(--gold)] shrink-0" />
              <span>
                <strong className="text-[var(--ink)]">NDPA 2023 Rule:</strong> Each record requires individual review and confirmation (Consent Event 3).
              </span>
            </div>
            <button
              type="button"
              onClick={handleLinkAll}
              className="text-[11.5px] font-semibold text-[var(--green)] hover:underline flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span>[⚡ Demo Shortcut] Fast-track link verified records &rarr;</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <h2 className="font-sans font-semibold text-[18px] sm:text-[20px] text-[var(--ink)] tracking-tight">
              Discovered Agency Records ({candidates.length})
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              The matching algorithm automatically mapped disparate emails and name variations to your NIN.
            </p>
          </div>
          <span className="text-xs text-[var(--ink-soft)] font-mono">
            {linkedCount} of {candidates.length} Linked
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {candidates.map((candidate) => {
            const isLinked = reconciledRecordIds.includes(candidate.record.id)
            const isDisputed = disputedIds.includes(candidate.record.id)
            const isConflict = candidate.matchTier === 'tier_3_conflict'

            return (
              <div
                key={candidate.record.id}
                className={`border rounded-[var(--radius)] p-5 sm:p-6 transition-all ${
                  isLinked
                    ? 'bg-[var(--green)]/5 border-[var(--green)]/40 shadow-2xs'
                    : isConflict
                    ? 'bg-[var(--paper-raised)] border-[var(--danger)]/30 shadow-2xs'
                    : 'bg-[var(--paper-raised)] border-[var(--line)] hover:border-[var(--green)]/60 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Origin & Attributes */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--line-soft)] border border-[var(--line)] flex items-center justify-center text-[var(--green)] shrink-0">
                        {candidate.record.tspId === 'paykaduna' && <CreditCard className="w-4 h-4" />}
                        {candidate.record.tspId === 'kadvreg' && <Car className="w-4 h-4" />}
                        {candidate.record.tspId === 'pit' && <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-[var(--ink)]">
                            {candidate.tspName}
                          </h3>
                          <span className="font-mono text-[11px] text-[var(--ink-soft)]">
                            &middot; {candidate.record.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--ink-soft)] block">
                          Legacy account created on {candidate.record.accountCreated}
                        </span>
                      </div>
                    </div>

                    {/* Attribute Comparison Grid */}
                    <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-[var(--radius)] text-xs space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[var(--ink)]">
                        <div>
                          <span className="text-[var(--ink-soft)] block text-[11px] font-medium">Legacy Name on File:</span>
                          <strong className="text-[var(--ink)]">{candidate.record.name}</strong>
                          {candidate.record.name !== activeIdentity.legalName && (
                            <span className="text-[11px] text-[var(--ink-soft)] block mt-0.5">
                              (Spelling variation verified via name similarity index)
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[var(--ink-soft)] block text-[11px] font-medium">Registered Contact:</span>
                          <span className="font-mono text-[12px]">{candidate.record.email}</span>
                          <span className="block text-[11px] text-[var(--ink-soft)]">{candidate.record.phone}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--line-soft)] text-[var(--ink)] flex flex-wrap items-center gap-1.5">
                        <span className="text-[var(--ink-soft)] text-[11px]">Verified Historical Activity:</span>
                        <span className="font-medium text-[var(--ink)]">{candidate.record.lastActivity}</span>
                        <span className="text-[11px] text-[var(--ink-soft)] font-mono">({candidate.record.lastActivityDate})</span>
                      </div>
                    </div>

                    {/* Matching Evidence Pills */}
                    <div className="space-y-1.5">
                      <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[var(--ink-soft)]">
                        Reconciliation Evidence:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.matchReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-[var(--radius)] bg-[var(--line-soft)] text-[var(--ink)] border border-[var(--line)]"
                          >
                            <Info className="w-3 h-3 text-[var(--green)]" />
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Confidence Score & Action */}
                  <div className="sm:text-right shrink-0 space-y-3 min-w-[200px]">
                    <div>
                      {candidate.matchTier === 'tier_1_exact_nin' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius)] bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tier 1: Exact Cryptographic Match
                        </span>
                      )}
                      {candidate.matchTier === 'tier_2_strong_fuzzy' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius)] bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
                          <Sparkles className="w-3.5 h-3.5" />
                          Tier 2: {candidate.confidenceScore}% Attribute Match
                        </span>
                      )}
                      {candidate.matchTier === 'tier_3_conflict' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius)] bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Tier 3: Conflicting Identity Details
                        </span>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="pt-2">
                      {isLinked ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--green)] bg-[var(--green)]/10 px-3 py-1.5 rounded-[var(--radius)] border border-[var(--green)]/20">
                          <Check className="w-4 h-4" />
                          <span>Linked &amp; Anchored to Citizen ID</span>
                        </div>
                      ) : isDisputed ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--danger)] bg-[var(--danger)]/10 px-3 py-1.5 rounded-[var(--radius)] border border-[var(--danger)]/20">
                          <XCircle className="w-4 h-4" />
                          <span>Flagged for Admin Review</span>
                        </div>
                      ) : isConflict ? (
                        <div className="space-y-2">
                          <p className="text-[11.5px] text-[var(--danger)] max-w-[32ch] text-left sm:text-right leading-relaxed">
                            Conflicting Record: Account is registered to NIN {candidate.record.nin}. Auto-bind forbidden by security policy.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleDispute(candidate.record.id)}
                            className="bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white text-xs px-3.5 py-2 rounded-[var(--radius)] font-medium transition-colors w-full sm:w-auto shadow-2xs"
                          >
                            Route to Dispute Queue
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:items-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleLinkRecord(candidate)}
                            className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs px-4 py-2 rounded-[var(--radius)] font-medium transition-colors shadow-2xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                          >
                            <span>Yes, This Is Me &mdash; Link Record</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDispute(candidate.record.id)}
                            className="text-[11.5px] text-[var(--ink-soft)] hover:text-[var(--danger)] transition-colors underline"
                          >
                            Not my record &middot; Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--line)] text-xs text-[var(--ink-soft)]">
        <Link
          to="/paykaduna"
          className="hover:text-[var(--ink)] flex items-center gap-1 font-medium"
        >
          &larr; Back to PayKaduna Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/kadvreg"
            className="hover:text-[var(--green)] font-medium flex items-center gap-1"
          >
            <span>Proceed to KADVREG Vehicles</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <span>&middot;</span>
          <Link
            to="/pit"
            className="hover:text-[var(--green)] font-medium flex items-center gap-1"
          >
            <span>Proceed to PIT Portal</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

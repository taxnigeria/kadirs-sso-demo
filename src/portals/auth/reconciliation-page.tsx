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
        <div className="w-12 h-12 rounded-full border border-emerald-200 flex items-center justify-center text-[#1AA260] font-sans font-semibold text-base mb-3.5 mx-auto bg-emerald-50">
          KD
        </div>
        <h1 className="font-sans font-semibold text-[24px] sm:text-[30px] leading-tight text-[var(--ink)] tracking-tight mb-2">
          Account Reconciliation &amp; Unification
        </h1>
        <p className="text-[13.5px] text-[var(--gray-600)] leading-relaxed max-w-[54ch] mx-auto">
          We matched pre-migration records across Kaduna State revenue agencies.
          <br className="hidden sm:inline" />
          Review and unify them under your single authenticated citizen identity.
        </p>
      </div>

      {/* Floating feedback message alert */}
      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-[#1AA260] rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Verified Citizen Master Identity Banner */}
      <div className="bg-[var(--card-bg)] text-[var(--ink)] shadow-float p-6 sm:p-7 rounded-[28px] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-[#1AA260] border border-emerald-500/25">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Citizen Profile (NIMC Verified)
            </span>
          </div>
          <h2 className="font-sans font-semibold text-[22px] sm:text-[24px] text-[var(--ink)] tracking-tight">
            {activeIdentity.legalName}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--gray-500)]">
            <span><strong className="text-[var(--ink)]">Citizen ID:</strong> <code className="font-mono">{activeProfile.citizenId}</code></span>
            <span>&bull;</span>
            <span><strong className="text-[var(--ink)]">Verified NIN:</strong> <code className="font-mono">{activeIdentity.nin.slice(0, 3)}••••{activeIdentity.nin.slice(-3)}</code></span>
            <span>&bull;</span>
            <span><strong className="text-[var(--ink)]">Primary Contact:</strong> {activeProfile.email}</span>
          </div>
        </div>

        {/* Action Status Indicator */}
        <div className="sm:text-right shrink-0">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--gray-500)] block">
            Account Matching Review
          </span>
          <span className="text-xs text-[var(--ink)] font-medium block mt-0.5">
            Individual Card Review Required
          </span>
        </div>
      </div>

      {/* Completion Banner (When all accounts are unified) */}
      {allLinked && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 sm:p-10 rounded-[28px] text-center space-y-4 animate-in fade-in shadow-float">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-[#1AA260] flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-[20px] sm:text-[22px] text-[var(--ink)] tracking-tight">
              All Legacy Accounts Successfully Unified!
            </h3>
            <p className="text-xs sm:text-sm text-[var(--gray-600)] max-w-[55ch] mx-auto mt-1 leading-relaxed">
              Your single login credentials now seamlessly authorize PayKaduna, KADVREG vehicle licensing, and the PIT Personal Income Tax portal.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/paykaduna')}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Return to PayKaduna</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/kadvreg')}
              className="border border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[var(--ink)] px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 text-[#1AA260]" />
              <span>Inspect Linked Vehicle in KADVREG</span>
            </button>
          </div>
        </div>
      )}

      {/* RECOGNITION CARDS LIST */}
      <div className="space-y-4">
        {!allLinked && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[var(--card-bg)] text-[var(--ink)] shadow-float rounded-2xl text-xs mb-2">
            <div className="flex items-center gap-2 text-[var(--gray-600)]">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong className="text-[var(--ink)]">Privacy &amp; Security:</strong> Each discovered record requires your explicit confirmation before it is linked to your central ID.
              </span>
            </div>
            <button
              type="button"
              onClick={handleLinkAll}
              className="text-[11.5px] font-semibold text-[#1AA260] hover:underline flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>[Demo Shortcut] Fast-track link verified records &rarr;</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[var(--gray-200)] pb-3">
          <div>
            <h2 className="font-sans font-semibold text-[18px] sm:text-[20px] text-[var(--ink)] tracking-tight">
              Discovered Agency Records ({candidates.length})
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">
              The matching algorithm automatically mapped disparate emails and name variations to your NIN.
            </p>
          </div>
          <span className="text-xs text-[var(--gray-500)] font-mono">
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
                className={`rounded-[24px] p-5 sm:p-6 transition-all bg-[var(--card-bg)] text-[var(--ink)] shadow-float hover:shadow-float-hover ${
                  isLinked
                    ? 'ring-2 ring-[#1AA260]'
                    : isConflict
                    ? 'ring-2 ring-rose-400'
                    : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Origin & Attributes */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] flex items-center justify-center text-[#1AA260] shrink-0">
                        {candidate.record.tspId === 'paykaduna' && <CreditCard className="w-5 h-5" />}
                        {candidate.record.tspId === 'kadvreg' && <Car className="w-5 h-5" />}
                        {candidate.record.tspId === 'pit' && <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base text-[var(--ink)]">
                            {candidate.tspName}
                          </h3>
                          <span className="font-mono text-xs text-[var(--gray-500)]">
                            &middot; {candidate.record.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--gray-500)] block">
                          Legacy account created on {candidate.record.accountCreated}
                        </span>
                      </div>
                    </div>

                    {/* Attribute Comparison Grid */}
                    <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--input-border)] p-4 rounded-2xl text-xs space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[var(--ink)]">
                        <div>
                          <span className="text-[var(--gray-500)] block text-[11px] font-medium">Legacy Name on File:</span>
                          <strong className="text-[var(--ink)]">{candidate.record.name}</strong>
                          {candidate.record.name !== activeIdentity.legalName && (
                            <span className="text-[11px] text-[var(--gray-500)] block mt-0.5">
                              (Spelling variation verified via name similarity index)
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[var(--gray-500)] block text-[11px] font-medium">Registered Contact:</span>
                          <span className="font-mono text-[12px]">{candidate.record.email}</span>
                          <span className="block text-[11px] text-[var(--gray-500)]">{candidate.record.phone}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--input-border)] text-[var(--ink)] flex flex-wrap items-center gap-1.5">
                        <span className="text-[var(--gray-500)] text-[11px]">Historical Activity:</span>
                        <span className="font-medium text-[var(--ink)]">{candidate.record.lastActivity}</span>
                        <span className="text-[11px] text-[var(--gray-500)] font-mono">({candidate.record.lastActivityDate})</span>
                      </div>
                    </div>

                    {/* Matching Evidence Pills */}
                    <div className="space-y-1.5">
                      <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[var(--gray-500)]">
                        Verification Indicators:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.matchReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full bg-[var(--input-bg)] text-[var(--ink)] border border-[var(--input-border)] font-medium"
                          >
                            <Info className="w-3 h-3 text-[#1AA260]" />
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
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-[#1AA260] border border-emerald-500/25">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Exact Verified Match (NIN)
                        </span>
                      )}
                      {candidate.matchTier === 'tier_2_strong_fuzzy' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          <Sparkles className="w-3.5 h-3.5" />
                          Strong Match ({candidate.confidenceScore}%)
                        </span>
                      )}
                      {candidate.matchTier === 'tier_3_conflict' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Manual Review Required
                        </span>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="pt-2">
                      {isLinked ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1AA260] bg-emerald-500/15 px-4 py-2 rounded-full border border-emerald-500/25">
                          <Check className="w-4 h-4" />
                          <span>Linked to Citizen Account</span>
                        </div>
                      ) : isDisputed ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/15 px-4 py-2 rounded-full border border-rose-500/25">
                          <XCircle className="w-4 h-4" />
                          <span>Flagged for Review</span>
                        </div>
                      ) : isConflict ? (
                        <div className="space-y-2">
                          <p className="text-[11.5px] text-rose-600 dark:text-rose-400 max-w-[32ch] text-left sm:text-right leading-relaxed">
                            Conflicting Record: Account is registered to NIN {candidate.record.nin}. Auto-bind forbidden by security policy.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleDispute(candidate.record.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 rounded-full font-semibold transition-colors w-full sm:w-auto cursor-pointer"
                          >
                            Route to Dispute Queue
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:items-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleLinkRecord(candidate)}
                            className="bg-[#1AA260] hover:bg-[#158A52] text-white text-xs px-5 py-2.5 rounded-full font-semibold transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer"
                          >
                            <span>Yes, This Is Me &mdash; Link Record</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDispute(candidate.record.id)}
                            className="text-[11.5px] text-[var(--gray-500)] hover:text-rose-600 transition-colors underline cursor-pointer"
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

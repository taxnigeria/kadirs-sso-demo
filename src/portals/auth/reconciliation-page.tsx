import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  CheckCircle2,
  AlertTriangle,
  Check,
  XCircle,
  Wallet,
  Car,
  FileText,
  ArrowRight,
  Lock
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

  // Dispute record
  const handleDispute = (candidateId: string) => {
    setDisputedIds((prev) => [...prev, candidateId])
    setFeedbackMessage('Record flagged as disputed. An audit ticket has been routed to the KADIRS Maker/Checker Queue.')
    setTimeout(() => setFeedbackMessage(null), 4000)
  }

  // Initials from name
  const initials = activeIdentity.legalName
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')

  // Masked NIN
  const maskedNin = `${activeIdentity.nin.slice(0, 3)}•••${activeIdentity.nin.slice(-3)}`

  // Icon resolver for each TSP
  const TspIcon = ({ tspId }: { tspId: string }) => {
    switch (tspId) {
      case 'paykaduna': return <Wallet className="w-5 h-5" />
      case 'kadvreg': return <Car className="w-5 h-5" />
      case 'pit': return <FileText className="w-5 h-5" />
      default: return <Wallet className="w-5 h-5" />
    }
  }

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 flex items-start justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">

        {/* Floating feedback message */}
        {feedbackMessage && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-[#1AA260] rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{feedbackMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-semibold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Citizen Identity Card ── */}
        <div className="bg-[var(--card-bg)] rounded-[20px] p-5 sm:p-6 border border-[var(--gray-200)] shadow-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 mb-3">
            <CheckCircle2 className="w-3 h-3" />
            NIMC Verified
          </span>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)] tracking-tight leading-tight">
                {activeIdentity.legalName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-[var(--gray-500)]">
                <span>Citizen ID: <span className="font-mono text-[var(--ink)]">{activeProfile.citizenId}</span></span>
                <span className="hidden sm:inline text-[var(--gray-300)]">|</span>
                <span>NIN: <span className="font-mono text-[var(--ink)]">{maskedNin}</span></span>
                <span className="hidden sm:inline text-[var(--gray-300)]">|</span>
                <span className="text-[var(--ink)]">{activeProfile.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section Heading ── */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              {allLinked
                ? 'All accounts linked!'
                : `${candidates.length} account${candidates.length !== 1 ? 's' : ''} found under your NIN`}
            </h1>
            {!allLinked && (
              <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-0.5">
                Each one needs your confirmation before it joins your profile.
              </p>
            )}
          </div>
          <span className="text-xs text-[var(--gray-500)] font-medium shrink-0 pb-0.5">
            {linkedCount} of {candidates.length} linked
          </span>
        </div>

        {/* ── All Linked Success State ── */}
        {allLinked && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-6 sm:p-8 rounded-[20px] text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[#1AA260] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[var(--ink)] tracking-tight">
                All legacy accounts successfully unified
              </h3>
              <p className="text-xs text-[var(--gray-500)] max-w-md mx-auto mt-1 leading-relaxed">
                Your single login now authorizes PayKaduna, KADVREG vehicle licensing, and the Personal Income Tax portal.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/paykaduna')}
                className="bg-[#1AA260] hover:bg-[#158A52] text-white h-10 px-6 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Account Cards Grid ── */}
        {!allLinked && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {candidates.map((candidate) => {
              const isLinked = reconciledRecordIds.includes(candidate.record.id)
              const isDisputed = disputedIds.includes(candidate.record.id)
              const isConflict = candidate.matchTier === 'tier_3_conflict'

              return (
                <div
                  key={candidate.record.id}
                  className={`bg-[var(--card-bg)] rounded-[20px] border transition-all flex flex-col ${
                    isLinked
                      ? 'border-[#1AA260] ring-1 ring-[#1AA260]/20'
                      : isConflict
                      ? 'border-rose-300 dark:border-rose-700/50'
                      : 'border-[var(--gray-200)] shadow-sm hover:shadow'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 pb-0">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1AA260]/8 dark:bg-[#1AA260]/15 text-[#1AA260] flex items-center justify-center shrink-0">
                          <TspIcon tspId={candidate.record.tspId} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-[var(--ink)]">
                            {candidate.tspName}
                          </h3>
                          <span className="text-[11px] text-[var(--gray-500)]">
                            Opened {candidate.record.accountCreated}
                          </span>
                        </div>
                      </div>

                      {/* Match badge */}
                      {candidate.matchTier === 'tier_1_exact_nin' && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#1AA260] shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          NIN match
                        </span>
                      )}
                      {candidate.matchTier === 'tier_2_strong_fuzzy' && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          {candidate.confidenceScore}% match
                        </span>
                      )}
                      {candidate.matchTier === 'tier_3_conflict' && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          Conflict
                        </span>
                      )}
                    </div>

                    {/* Attribute Details */}
                    <div className="border-t border-[var(--gray-200)] pt-3 space-y-2 text-xs">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[var(--gray-500)] shrink-0">Name on file</span>
                        <span className="text-[var(--ink)] font-medium text-right truncate">{candidate.record.name}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[var(--gray-500)] shrink-0">Contact</span>
                        <span className="text-[var(--ink)] font-medium text-right truncate">{candidate.record.email}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[var(--gray-500)] shrink-0">Last activity</span>
                        <span className="text-[var(--ink)] font-medium text-right truncate">
                          {candidate.record.lastActivity} &middot; {candidate.record.lastActivityDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer / Actions */}
                  <div className="p-4 sm:p-5 pt-4 mt-auto">
                    {isLinked ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/30 h-10 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                        <Check className="w-4 h-4" />
                        <span>Linked to your account</span>
                      </div>
                    ) : isDisputed ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 h-10 rounded-full border border-rose-200 dark:border-rose-800/40">
                        <XCircle className="w-4 h-4" />
                        <span>Flagged for review</span>
                      </div>
                    ) : isConflict ? (
                      <div className="space-y-2">
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-relaxed">
                          NIN mismatch — this record belongs to a different identity. Cannot auto-link.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDispute(candidate.record.id)}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white h-10 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Report to Dispute Queue
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleLinkRecord(candidate)}
                          className="flex-1 bg-[#1AA260] hover:bg-[#158A52] text-white h-10 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Yes, link this account
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDispute(candidate.record.id)}
                          className="text-xs text-[var(--gray-500)] hover:text-rose-600 dark:hover:text-rose-400 transition-colors underline cursor-pointer shrink-0 px-1"
                        >
                          Not mine
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--gray-500)] pt-2 pb-4">
          <Lock className="w-3.5 h-3.5 text-[#1AA260] shrink-0" />
          <span>Kaduna State Internal Revenue Service &middot; Unified Citizen Gateway</span>
        </div>
      </div>
    </div>
  )
}

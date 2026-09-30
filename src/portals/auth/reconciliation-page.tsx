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
  Lock,
  Home,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Building2
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import {
  findLegacyMatches,
  executeReconciliation,
  type ReconciliationCandidate
} from '@/engine/reconciliation-engine'
import { toast } from 'sonner'

// Helper for partner system authentication metadata
function getPartnerAuthSpec(candidate: ReconciliationCandidate) {
  const tspId = candidate.record.tspId
  switch (tspId) {
    case 'kadtaxonrent':
      return {
        brandTitle: 'Kad Tax on Rent',
        systemSubtitle: 'Withholding Tax (WHT) Property Platform',
        idLabel: 'Property ID (PIN) or Kaduna State TIN',
        idPlaceholder: 'e.g. PROP-2024-8819 or KAD-TIN-8829104',
        defaultId: 'PROP-2024-8819',
        secretLabel: 'Rental Portal Password / Landlord PIN',
        secretPlaceholder: 'Enter portal password or PIN',
        defaultSecret: 'Kaduna2024!',
        demoHint: 'Barnawa Luxury Apartment (PROP-2024-8819)',
        accentBg: 'bg-[#0A5C36]',
        badgeStyle: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#0A5C36] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
        icon: Home
      }
    case 'paykaduna':
      return {
        brandTitle: 'PayKaduna Revenue Gateway',
        systemSubtitle: 'Central Digital Collections Engine',
        idLabel: 'PayKaduna Email, Phone, or Payer ID',
        idPlaceholder: 'e.g. fatimah.a@gmail.com or 08031234567',
        defaultId: candidate.record.email || 'fatimah.a@gmail.com',
        secretLabel: 'PayKaduna Password or Receipt Ref',
        secretPlaceholder: 'Enter password or assessment receipt number',
        defaultSecret: 'Kaduna2024!',
        demoHint: 'Receipt: Paid ₦15,000 vehicle registration fee',
        accentBg: 'bg-[#1AA260]',
        badgeStyle: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border-emerald-200 dark:border-emerald-800/40',
        icon: Wallet
      }
    case 'pit':
      return {
        brandTitle: 'Personal Income Tax Portal',
        systemSubtitle: 'KADIRS Direct Assessment & PAYE Directorate',
        idLabel: 'State Tax Identification Number (State TIN)',
        idPlaceholder: 'e.g. KAD-TIN-8829104',
        defaultId: 'KAD-TIN-8829104',
        secretLabel: 'e-Tax Assessment Password / Filing PIN',
        secretPlaceholder: 'Enter e-Tax password',
        defaultSecret: 'Kaduna2024!',
        demoHint: 'Annual PIT Returns on file',
        accentBg: 'bg-amber-600',
        badgeStyle: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
        icon: FileText
      }
    case 'kadvreg':
      return {
        brandTitle: 'KADVREG Vehicle Licensing',
        systemSubtitle: 'Motor Vehicle Administration & Fleet Platform',
        idLabel: 'Vehicle Plate Number or VIN / Chassis Number',
        idPlaceholder: 'e.g. KD-123-ABC or CH-99210-KD',
        defaultId: 'KD-123-ABC',
        secretLabel: 'Vehicle License Security PIN',
        secretPlaceholder: 'Enter 4-digit PIN',
        defaultSecret: '1234',
        demoHint: 'Vehicle: Registered Toyota Corolla (Plate: KD-123-ABC)',
        accentBg: 'bg-blue-600',
        badgeStyle: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
        icon: Car
      }
    default:
      return {
        brandTitle: candidate.tspName,
        systemSubtitle: 'Authorized KADIRS Partner System',
        idLabel: 'Partner Account Identifier',
        idPlaceholder: 'Enter registered ID or email',
        defaultId: candidate.record.email || 'fatimah.a@gmail.com',
        secretLabel: 'Account Password / PIN',
        secretPlaceholder: 'Enter password or PIN',
        defaultSecret: 'Kaduna2024!',
        demoHint: 'Verified partner record',
        accentBg: 'bg-[#1AA260]',
        badgeStyle: 'bg-emerald-50 text-[#1AA260] border-emerald-200',
        icon: Building2
      }
  }
}

// Partner Authentication Modal
interface PartnerAuthModalProps {
  candidate: ReconciliationCandidate
  citizenId: string
  citizenNin: string
  onClose: () => void
  onSuccess: (candidate: ReconciliationCandidate) => void
}

function PartnerAuthModal({
  candidate,
  citizenId,
  citizenNin,
  onClose,
  onSuccess
}: PartnerAuthModalProps) {
  const spec = getPartnerAuthSpec(candidate)
  const Icon = spec.icon

  const [identifier, setIdentifier] = useState(spec.defaultId)
  const [secret, setSecret] = useState(spec.defaultSecret)
  const [showSecret, setShowSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'idle' | 'querying' | 'validating' | 'merging' | 'success'>('idle')

  const handlePrefillDemo = () => {
    setIdentifier(spec.defaultId)
    setSecret(spec.defaultSecret)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!identifier.trim() || !secret.trim()) {
      setError('Please provide both the partner identifier and password/PIN to authenticate.')
      return
    }

    // Begin animated verification sequence
    setStep('querying')

    setTimeout(() => {
      setStep('validating')
    }, 450)

    setTimeout(() => {
      setStep('merging')
    }, 900)

    setTimeout(() => {
      setStep('success')
      setTimeout(() => {
        onSuccess(candidate)
      }, 500)
    }, 1350)
  }

  const maskedNin = `${citizenNin.slice(0, 3)}•••${citizenNin.slice(-3)}`

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[26px] p-6 sm:p-7 shadow-float animate-in zoom-in-95 duration-200 space-y-5 text-[var(--ink)]">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-[var(--gray-200)] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${spec.accentBg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-[var(--ink)]">
                  {spec.brandTitle}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${spec.badgeStyle}`}>
                  Partner Auth
                </span>
              </div>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">
                {spec.systemSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={step !== 'idle'}
            className="p-1.5 rounded-full text-[var(--gray-400)] hover:text-[var(--ink)] hover:bg-[var(--line-soft)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explain NDPA Merging Rule */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--gray-200)] text-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
            <ShieldCheck className="w-4 h-4 text-[#1AA260] shrink-0" />
            <span>NDPA 2023 Statutory Account Unification Protocol</span>
          </div>
          <p className="text-[11.5px] text-[var(--gray-500)] leading-relaxed">
            To prevent identity fraud, KADIRS requires authentication with your existing credentials on{' '}
            <strong>{spec.brandTitle}</strong>. Once verified, this partner account will be cryptographically bound to your single citizen profile (<strong>{citizenId}</strong> / NIN: <code className="font-mono">{maskedNin}</code>) and appear on your central SSO Dashboard.
          </p>
        </div>

        {/* Matched Record Snapshot */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-medium">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[var(--gray-500)]">Record on File:</span>
            <span className="font-semibold text-[var(--ink)]">{candidate.record.name}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[var(--gray-500)]">Contact on File:</span>
            <span className="font-mono text-[var(--ink)]">{candidate.record.email}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[var(--gray-500)]">Last Partner Activity:</span>
            <span className="text-[var(--ink)] truncate max-w-[240px]">{candidate.record.lastActivity}</span>
          </div>
        </div>

        {/* Form or Animated Verification State */}
        {step === 'idle' ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Identifier input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gray-600)]">
                  {spec.idLabel}
                </label>
                <span className="text-[10px] font-mono text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/50">
                  Demo Target
                </span>
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={spec.idPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] bg-black/[0.02] dark:bg-white/[0.04] text-xs text-[var(--ink)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[#1AA260]"
                required
              />
            </div>

            {/* Secret / Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gray-600)]">
                  {spec.secretLabel}
                </label>
                <span className="text-[10.5px] text-[var(--gray-400)] font-mono">{spec.demoHint}</span>
              </div>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder={spec.secretPlaceholder}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--input-border)] bg-black/[0.02] dark:bg-white/[0.04] text-xs text-[var(--ink)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[#1AA260]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--ink)] cursor-pointer"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Demo Helper Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handlePrefillDemo}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1AA260] hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Matching Demo Credentials</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--gray-200)]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-[var(--gray-300)] text-[var(--gray-600)] text-xs font-semibold hover:bg-[var(--line-soft)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Validate &amp; Merge Account</span>
              </button>
            </div>
          </form>
        ) : (
          /* Verification Progress Animation */
          <div className="py-6 space-y-5 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center mx-auto shadow-sm">
              {step === 'success' ? (
                <CheckCircle2 className="w-7 h-7 text-[#1AA260] animate-in zoom-in-75 duration-200" />
              ) : (
                <div className="w-6 h-6 border-3 border-[#1AA260] border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div className="space-y-1.5">
              <h4 className="font-display font-bold text-base text-[var(--ink)]">
                {step === 'querying' && `Connecting to ${spec.brandTitle}...`}
                {step === 'validating' && 'Verifying Partner Credentials...'}
                {step === 'merging' && 'Cryptographically Binding Legacy Account...'}
                {step === 'success' && 'Account Validated & Merged!'}
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                {step === 'querying' && 'Establishing secure handshake with partner legacy database.'}
                {step === 'validating' && `Checking credentials against record #${candidate.record.id}.`}
                {step === 'merging' && `Generating NDPA consent token and adding ${spec.brandTitle} to connected services.`}
                {step === 'success' && 'Your SSO Dashboard will now display this connected partner service.'}
              </p>
            </div>

            {/* Checkpoint list */}
            <div className="max-w-xs mx-auto text-left text-xs space-y-2 pt-2">
              <div className={`flex items-center gap-2 transition-colors ${step === 'validating' || step === 'merging' || step === 'success' ? 'text-[#1AA260] font-semibold' : 'text-[var(--gray-400)]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Partner Identity Verified</span>
              </div>
              <div className={`flex items-center gap-2 transition-colors ${step === 'merging' || step === 'success' ? 'text-[#1AA260] font-semibold' : 'text-[var(--gray-400)]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>NDPA Statutory Consent Attested</span>
              </div>
              <div className={`flex items-center gap-2 transition-colors ${step === 'success' ? 'text-[#1AA260] font-semibold' : 'text-[var(--gray-400)]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>SSO Dashboard Services Updated</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReconciliationPage() {
  const navigate = useNavigate()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const reconciledRecordIds = useAuthEngine((s) => s.reconciledRecordIds)

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [disputedIds, setDisputedIds] = useState<string[]>([])
  const [activeAuthCandidate, setActiveAuthCandidate] = useState<ReconciliationCandidate | null>(null)

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

  // Get matching candidate records from the legacy databases (includes Kad Tax on Rent, PayKaduna, PIT, KADVREG)
  const candidates = useMemo(() => {
    return findLegacyMatches(activeIdentity, activeProfile)
  }, [activeIdentity, activeProfile])

  // Count how many are already reconciled
  const linkedCount = candidates.filter((c) =>
    reconciledRecordIds.includes(c.record.id)
  ).length
  const allLinked = candidates.length > 0 && linkedCount === candidates.length

  // Check if every candidate has been acted on (linked or disputed)
  const allResolved = candidates.length > 0 && candidates.every(
    (c) => reconciledRecordIds.includes(c.record.id) || disputedIds.includes(c.record.id)
  )

  // Link single record after successful partner authentication
  const handleLinkRecord = (candidate: ReconciliationCandidate) => {
    const res = executeReconciliation(candidate, activeProfile.citizenId, activeIdentity.nin)
    setFeedbackMessage(res.message)
    toast.success('Account Successfully Merged', {
      description: `${candidate.tspName} has been unified into your central profile and added to your connected services.`
    })
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
      case 'kadtaxonrent': return <Home className="w-5 h-5 text-[#0A5C36] dark:text-emerald-400" />
      case 'paykaduna': return <Wallet className="w-5 h-5 text-[#1AA260]" />
      case 'kadvreg': return <Car className="w-5 h-5 text-blue-500" />
      case 'pit': return <FileText className="w-5 h-5 text-amber-500" />
      default: return <Wallet className="w-5 h-5 text-[#1AA260]" />
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
                ? 'All accounts linked & merged'
                : allResolved
                ? 'Review complete'
                : `${candidates.length} account${candidates.length !== 1 ? 's' : ''} found under your NIN`}
            </h1>
            {!allLinked && !allResolved && (
              <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-0.5">
                Authenticate with each partner system to verify ownership and merge into your single SSO profile.
              </p>
            )}
            {allLinked && (
              <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-0.5">
                All historical partner system records are cryptographically bound to your single Citizen SSO profile.
              </p>
            )}
            {allResolved && !allLinked && (
              <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-0.5">
                {linkedCount > 0
                  ? `${linkedCount} account${linkedCount !== 1 ? 's' : ''} merged. Disputed records have been routed to the KADIRS review queue.`
                  : 'All records have been flagged for review. You can continue to your dashboard.'}
              </p>
            )}
          </div>
          <span className="text-xs text-[var(--gray-500)] font-medium shrink-0 pb-0.5">
            {linkedCount} of {candidates.length} merged
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
                Your single login now authorizes PayKaduna, Kad Tax on Rent (WHT Property Platform), and connected state services. Your SSO Dashboard has been updated with your merged partner systems.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/paykaduna')}
                className="bg-[#1AA260] hover:bg-[#158A52] text-white h-10 px-6 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <span>Go to SSO Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Account Cards Grid ── */}
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
                        <div className="w-10 h-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center shrink-0 border border-[var(--gray-200)]">
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
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#1AA260] shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          <CheckCircle2 className="w-3 h-3" />
                          NIN match
                        </span>
                      )}
                      {candidate.matchTier === 'tier_2_strong_fuzzy' && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 shrink-0 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50">
                          <CheckCircle2 className="w-3 h-3" />
                          {candidate.confidenceScore}% match
                        </span>
                      )}
                      {candidate.matchTier === 'tier_3_conflict' && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-rose-600 dark:text-rose-400 shrink-0 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200/50">
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
                      <div className="flex flex-col items-center justify-center gap-0.5 text-xs font-semibold text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/30 py-2.5 px-3 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Linked &amp; Merged with SSO</span>
                        </div>
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
                          onClick={() => setActiveAuthCandidate(candidate)}
                          className="flex-1 bg-[#1AA260] hover:bg-[#158A52] text-white h-10 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Authenticate &amp; Link</span>
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

        {/* ── All Resolved (mix of linked + disputed) — Continue Action ── */}
        {allResolved && !allLinked && (
          <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] p-5 sm:p-6 rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {linkedCount > 0 ? `${linkedCount} merged, ${disputedIds.length} disputed` : `${disputedIds.length} record${disputedIds.length !== 1 ? 's' : ''} sent for review`}
                </p>
                <p className="text-xs text-[var(--gray-500)] mt-0.5">
                  Disputed records will be reviewed by the KADIRS administrative team.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/paykaduna')}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white h-10 px-6 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <span>Continue to SSO Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--gray-500)] pt-2 pb-4">
          <Lock className="w-3.5 h-3.5 text-[#1AA260] shrink-0" />
          <span>Kaduna State Internal Revenue Service &middot; Unified Citizen Gateway</span>
        </div>
      </div>

      {/* ── Interactive Partner System Authentication Modal ── */}
      {activeAuthCandidate && (
        <PartnerAuthModal
          candidate={activeAuthCandidate}
          citizenId={activeProfile.citizenId}
          citizenNin={activeIdentity.nin}
          onClose={() => setActiveAuthCandidate(null)}
          onSuccess={(cand) => {
            handleLinkRecord(cand)
            setActiveAuthCandidate(null)
          }}
        />
      )}
    </div>
  )
}

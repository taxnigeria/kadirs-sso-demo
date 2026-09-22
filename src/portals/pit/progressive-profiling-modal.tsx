import { useState } from 'react'
import {
  X,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Lock,
  Building2,
  Briefcase,
  FileCheck,
  BadgeAlert
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useEventLogger } from '@/engine/event-logger'
import {
  analyzeProfileGaps,
  generateKadunaTIN
} from '@/engine/progressive-profiling-engine'

interface ProgressiveProfilingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: {
    tin: string
    employmentType: 'employed' | 'self_employed' | 'contractor' | 'unemployed'
    employerName: string
    sector?: string
    incomeBand?: string
  }) => void
}

export function ProgressiveProfilingModal({
  isOpen,
  onClose,
  onSuccess
}: ProgressiveProfilingModalProps) {
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const updateProfile = useAuthEngine((s) => s.updateProfile)

  const gapAnalysis = analyzeProfileGaps(currentUser, identity, 'pit')

  // Form State
  const [tin, setTin] = useState(
    currentUser?.tin || generateKadunaTIN(currentUser?.citizenId)
  )
  const [employmentType, setEmploymentType] = useState<
    'employed' | 'self_employed' | 'contractor' | 'unemployed'
  >(currentUser?.employmentType || 'employed')
  const [employerName, setEmployerName] = useState(
    currentUser?.employerName || 'Ahmadu Bello University, Zaria'
  )
  const [sector, setSector] = useState(
    currentUser?.sector || 'Education & Research'
  )
  const [incomeBand, setIncomeBand] = useState(
    currentUser?.incomeBand || '₦1,800,000 — ₦3,500,000'
  )

  // Statutory NDPA Consent Event 2
  const [consentGranted, setConsentGranted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGenerateTIN = () => {
    const newTin = generateKadunaTIN(currentUser?.citizenId)
    setTin(newTin)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!tin.trim()) {
      setErrorMsg('State Tax Identification Number (TIN) is required.')
      return
    }
    if (!employerName.trim()) {
      setErrorMsg('Employer or Business Organization name is required.')
      return
    }
    if (!consentGranted) {
      setErrorMsg(
        'You must grant statutory consent under NDPA 2023 to authorize PIT data processing.'
      )
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Update citizen profile with delta fields
      updateProfile({
        tin,
        employmentType,
        employerName,
        sector,
        incomeBand,
        profileCompleteness: 100
      })

      // 2. Log Statutory Consent Event 2 & Progressive Profiling Completion
      const actorId = currentUser?.citizenId || 'CIT-UNKNOWN'

      useEventLogger.getState().logEvent({
        category: 'consent',
        action: 'CONSENT_EVENT_2_GRANTED',
        actor: actorId,
        tspId: 'pit',
        details: {
          tspName: 'Personal Income Tax Portal (PIT)',
          consentedScopes: ['tin', 'employmentType', 'employerName', 'sector', 'incomeBand'],
          statutoryFramework: 'NDPA 2023 Section 24',
          timestamp: new Date().toISOString()
        }
      })

      useEventLogger.getState().logEvent({
        category: 'profile',
        action: 'PROGRESSIVE_PROFILING_COMPLETED',
        actor: actorId,
        tspId: 'pit',
        details: {
          assignedTin: tin,
          employmentType,
          employerName,
          previousCompleteness: currentUser?.profileCompleteness || 65,
          newCompleteness: 100
        }
      })

      setTimeout(() => {
        setIsSubmitting(false)
        onSuccess({
          tin,
          employmentType,
          employerName,
          sector,
          incomeBand
        })
      }, 500)
    } catch (err: unknown) {
      setIsSubmitting(false)
      const message = err instanceof Error ? err.message : 'Failed to save tax profile'
      setErrorMsg(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden my-6">
        {/* Top Header Strip */}
        <div className="bg-gradient-to-r from-[#091a2e] via-[#0d2644] to-[#0f3057] p-5 text-white border-b-2 border-[#b45309]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                  <Sparkles className="w-3 h-3" />
                  Journey 5 &middot; Progressive Profiling
                </span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                  Complete Your PIT Tax Profile
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Kaduna State Internal Revenue Service Directorate of Personal Income Tax
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Explanation Alert */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-600 rounded-sm text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <BadgeAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-950 block">
                Automatic Gap Analysis Active:
              </strong>
              To access direct assessment and PAYE services, Kaduna State tax regulations require your Taxpayer Identification Number and employment details. No verified attributes already on file are requested again.
            </div>
          </div>

          {/* Section 1: Known / Verified Attributes (Read-only Proof) */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Identity Records (Already On File &mdash; Locked)
              </span>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                ✓ No Re-entry Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-[10.5px] text-slate-500 uppercase font-medium block">
                  Taxpayer Full Name
                </span>
                <span className="font-semibold text-slate-900 block truncate mt-0.5">
                  {identity?.legalName || currentUser?.citizenId}
                </span>
                <span className="text-[9.5px] text-emerald-600 font-medium">✓ NIMC Identity</span>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-[10.5px] text-slate-500 uppercase font-medium block">
                  National ID (NIN)
                </span>
                <span className="font-mono font-semibold text-slate-900 block mt-0.5">
                  {identity?.nin ? `${identity.nin.slice(0, 3)}•••••${identity.nin.slice(-3)}` : '•••••••••••'}
                </span>
                <span className="text-[9.5px] text-emerald-600 font-medium">✓ Master Anchor</span>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-[10.5px] text-slate-500 uppercase font-medium block">
                  Registered Email
                </span>
                <span className="font-semibold text-slate-900 block truncate mt-0.5">
                  {currentUser?.email || 'N/A'}
                </span>
                <span className="text-[9.5px] text-emerald-600 font-medium">✓ Verified Central</span>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-[10.5px] text-slate-500 uppercase font-medium block">
                  Assigned Tax Office
                </span>
                <span className="font-semibold text-slate-900 block truncate mt-0.5">
                  {currentUser?.taxOffice || 'Zaria Central Tax Office'}
                </span>
                <span className="text-[9.5px] text-slate-500">Jurisdiction Locked</span>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-[10.5px] text-slate-500 uppercase font-medium block">
                  Local Government Area
                </span>
                <span className="font-semibold text-slate-900 block truncate mt-0.5">
                  {currentUser?.lga || 'Zaria'} LGA
                </span>
                <span className="text-[9.5px] text-slate-500">Kaduna State</span>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-[10.5px] text-slate-500 uppercase font-medium block">
                  Citizen Identification No.
                </span>
                <span className="font-mono font-semibold text-slate-900 block truncate mt-0.5">
                  {currentUser?.citizenId}
                </span>
                <span className="text-[9.5px] text-emerald-600 font-medium">✓ Token Subject ID</span>
              </div>
            </div>
          </div>

          {/* Section 2: Missing Delta Fields */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-amber-700" />
                Required Delta Attributes (Missing from Central Profile)
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">
                {gapAnalysis.missingFields.length} Required Delta Fields
              </span>
            </div>

            {/* Field 1: State TIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Kaduna State Tax Identification Number (State TIN) *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTIN}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>[⚡ Generate New Kaduna TIN]</span>
                </button>
              </div>
              <input
                type="text"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="e.g. TIN-KD-2024-849201"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono focus:border-amber-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Required to link your personal assessments and Tax Clearance Certificate (TCC).
              </span>
            </div>

            {/* Field 2: Employment Status & Employer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1.5">
                  Employment Classification *
                </label>
                <select
                  value={employmentType}
                  onChange={(e) =>
                    setEmploymentType(
                      e.target.value as 'employed' | 'self_employed' | 'contractor' | 'unemployed'
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:border-amber-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  required
                >
                  <option value="employed">Employed (PAYE Withheld by Employer)</option>
                  <option value="self_employed">Self-Employed / Business Owner</option>
                  <option value="contractor">Independent Contractor / Consultant</option>
                  <option value="unemployed">Student / Unemployed / Retired</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1.5">
                  Employer / Enterprise Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder="e.g. Ahmadu Bello University, Zaria"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-amber-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Field 3: Sector & Income Band */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1.5">
                  Economic Sector / Industry
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:border-amber-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Education & Research">Education &amp; Research</option>
                  <option value="Agriculture & Food Processing">Agriculture &amp; Agro-Allied</option>
                  <option value="Public Administration & MDA">Public Service / State MDA</option>
                  <option value="Commerce & Retail Trading">Commerce &amp; Retail Trading</option>
                  <option value="Information Technology">Information Technology &amp; Telecom</option>
                  <option value="Healthcare & Pharmaceuticals">Healthcare &amp; Social Services</option>
                  <option value="Manufacturing & Transport">Manufacturing &amp; Logistics</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1.5">
                  Estimated Gross Annual Income Band
                </label>
                <select
                  value={incomeBand}
                  onChange={(e) => setIncomeBand(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:border-amber-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Below ₦1,200,000">Below ₦1,200,000 (Low Assessment Band)</option>
                  <option value="₦1,800,000 — ₦3,500,000">₦1,800,000 — ₦3,500,000 (Standard Band)</option>
                  <option value="₦3,500,000 — ₦7,500,000">₦3,500,000 — ₦7,500,000 (Executive Band)</option>
                  <option value="Above ₦7,500,000">Above ₦7,500,000 (High Net Assessment)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Statutory NDPA Consent Event 2 */}
          <div className="p-4 bg-slate-900 text-white rounded-md border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10.5px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Statutory Consent Event 2 &middot; NDPA 2023 Sec. 24
              </span>
              <span className="text-[10px] text-slate-400">Legal Audit Trail</span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300 leading-relaxed">
              <input
                type="checkbox"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="mt-0.5 rounded border-slate-600 text-amber-500 focus:ring-amber-400"
              />
              <span>
                I hereby grant deliberate statutory authorization to the{' '}
                <strong className="text-white">
                  Kaduna State Internal Revenue Service (KADIRS) Directorate of Personal Income Tax
                </strong>{' '}
                to receive my verified NIMC identity attributes and maintain my personal income tax assessment ledger in compliance with NDPA 2023.
              </span>
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel &amp; Return to Hub
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !consentGranted}
              className="w-full sm:w-auto px-6 py-2.5 rounded text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Registering Tax Profile...</span>
              ) : (
                <>
                  <span>Save &amp; Activate PIT e-Tax Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

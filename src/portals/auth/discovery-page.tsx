import { useNavigate } from 'react-router'
import {
  CheckCircle2,
  Sparkles,
  Wallet,
  Car,
  FileText,
  ArrowRight,
  Lock
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { DEMO_PERSONAS } from '@/data/personas'

export default function DiscoveryPage() {
  const navigate = useNavigate()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)

  // Resolve user's first name from current session or fallback to demo persona
  const firstName = (() => {
    if (identity?.legalName) {
      return identity.legalName.split(' ')[0]
    }
    if (currentUser?.email) {
      const matched = DEMO_PERSONAS.find(
        (p) => p.profile.email.toLowerCase() === currentUser.email.toLowerCase()
      )
      if (matched?.identity?.legalName) {
        return matched.identity.legalName.split(' ')[0]
      }
    }
    return 'Fatima'
  })()

  return (
    <div className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-[500px] mx-auto">
        <div className="bg-[var(--card-bg)] text-[var(--ink)] rounded-[24px] p-6 sm:p-8 shadow-float transition-all animate-in fade-in duration-300 slide-in-from-bottom-2">
          
          {/* Header & Verification Badge */}
          <div className="text-center pb-2">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1AA260] block mb-1">
              Identity Verified &middot; Welcome
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-[26px] text-[var(--ink)] tracking-tight">
              Welcome back, {firstName}!
            </h1>
            <p className="text-xs sm:text-[13px] text-[var(--gray-700)] max-w-[38ch] mx-auto mt-1.5 leading-relaxed">
              We discovered 3 past records linked to your National ID across state revenue databases.
            </p>
          </div>

          {/* Found Legacy Records Box */}
          <div className="mt-6 border border-[var(--gray-200)] bg-[var(--paper)] p-4 rounded-2xl space-y-3 text-xs">
            <div className="font-bold text-[var(--ink)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1AA260]" />
              <span>Discovered Historical Accounts:</span>
            </div>

            <div className="space-y-2">
              {/* PayKaduna Revenue */}
              <div className="p-3 rounded-xl bg-[var(--white)] border border-[var(--gray-200)] flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <strong className="text-[var(--ink)] block text-xs font-bold truncate">PayKaduna Revenue</strong>
                    <span className="text-[11px] text-[var(--gray-500)] truncate block">fatimah.a@gmail.com &middot; ₦15,000 paid</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full shrink-0">
                  Ready to link
                </span>
              </div>

              {/* KADVREG Vehicle Licensing */}
              <div className="p-3 rounded-xl bg-[var(--white)] border border-[var(--gray-200)] flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <strong className="text-[var(--ink)] block text-xs font-bold truncate">KADVREG Vehicle Licensing</strong>
                    <span className="text-[11px] text-[var(--gray-500)] truncate block">Plate: KD-123-ABC &middot; Honda Accord</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full shrink-0">
                  Ready to link
                </span>
              </div>

              {/* Personal Income Tax (PIT) */}
              <div className="p-3 rounded-xl bg-[var(--white)] border border-[var(--gray-200)] flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <strong className="text-[var(--ink)] block text-xs font-bold truncate">Personal Income Tax (PIT)</strong>
                    <span className="text-[11px] text-[var(--gray-500)] truncate block">TIN-PIT-008472 &middot; Prior filings</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full shrink-0">
                  Ready to link
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--gray-500)] pt-1 leading-normal">
              You can review and merge these into your single account now, or do it later from your profile.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-5">
            <button
              type="button"
              onClick={() => navigate('/auth/reconciliation')}
              className="w-full bg-[#1AA260] hover:bg-[#158A52] text-white py-3 rounded-full text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
            >
              <span>Review &amp; Link Past Accounts</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/paykaduna')}
              className="w-full border border-[var(--gray-200)] bg-[var(--white)] hover:bg-[var(--gray-100)] text-[var(--gray-700)] py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              Skip for now &rarr; Go to Dashboard
            </button>
          </div>

          {/* Institutional Trust Footer */}
          <div className="mt-6 pt-4 border-t border-[var(--gray-200)] flex items-center justify-center gap-2 text-xs text-[var(--gray-500)]">
            <Lock className="w-3.5 h-3.5 text-[#1AA260] shrink-0" />
            <span>KADIRS Unified Identity &middot; NDPA 2023 Statutory Protection</span>
          </div>

        </div>
      </div>
    </div>
  )
}

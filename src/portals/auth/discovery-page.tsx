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
    <div className="py-6 sm:py-8 lg:py-10 px-4 sm:px-6 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-[var(--card-bg)] text-[var(--ink)] rounded-[24px] p-6 sm:p-8 lg:p-10 shadow-float transition-all animate-in fade-in duration-300 slide-in-from-bottom-2">
          
          {/* Header & Verification Badge */}
          <div className="text-center pb-1">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] flex items-center justify-center mx-auto mb-2.5 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1AA260] block mb-1">
              Identity Verified &middot; Welcome
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
              Welcome back, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-[var(--gray-700)] max-w-lg mx-auto mt-1 leading-relaxed">
              We discovered 3 past records linked to your National ID across state revenue databases.
            </p>
          </div>

          {/* Discovered Historical Accounts Section */}
          <div className="mt-6 sm:mt-7">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--ink)] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#1AA260]" />
              <span>Discovered Historical Accounts</span>
            </div>

            {/* Horizontal 3-column Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* PayKaduna Revenue */}
              <div className="p-4 rounded-2xl bg-[var(--paper)]/50 dark:bg-white/[0.03] border border-[var(--gray-200)] flex flex-col justify-between gap-3 text-left transition-all hover:border-emerald-300/70 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full shrink-0">
                    Ready to link
                  </span>
                </div>
                <div>
                  <strong className="text-[var(--ink)] block text-xs font-bold truncate">PayKaduna Revenue</strong>
                  <span className="text-[11px] text-[var(--gray-500)] mt-0.5 block truncate">fatimah.a@gmail.com &middot; ₦15,000 paid</span>
                </div>
              </div>

              {/* KADVREG Vehicle Licensing */}
              <div className="p-4 rounded-2xl bg-[var(--paper)]/50 dark:bg-white/[0.03] border border-[var(--gray-200)] flex flex-col justify-between gap-3 text-left transition-all hover:border-emerald-300/70 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full shrink-0">
                    Ready to link
                  </span>
                </div>
                <div>
                  <strong className="text-[var(--ink)] block text-xs font-bold truncate">KADVREG Licensing</strong>
                  <span className="text-[11px] text-[var(--gray-500)] mt-0.5 block truncate">Plate: KD-123-ABC &middot; Honda Accord</span>
                </div>
              </div>

              {/* Personal Income Tax (PIT) */}
              <div className="p-4 rounded-2xl bg-[var(--paper)]/50 dark:bg-white/[0.03] border border-[var(--gray-200)] flex flex-col justify-between gap-3 text-left transition-all hover:border-emerald-300/70 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full shrink-0">
                    Ready to link
                  </span>
                </div>
                <div>
                  <strong className="text-[var(--ink)] block text-xs font-bold truncate">Personal Income Tax (PIT)</strong>
                  <span className="text-[11px] text-[var(--gray-500)] mt-0.5 block truncate">TIN-PIT-008472 &middot; Prior filings</span>
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons (Horizontal) */}
          <div className="pt-6 sm:pt-7 flex flex-col-reverse sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => navigate('/paykaduna')}
              className="w-full sm:w-1/2 border border-[var(--gray-200)] bg-[var(--white)] hover:bg-[var(--gray-100)] text-[var(--gray-700)] h-11 px-5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
            >
              Skip for now &rarr; Go to Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigate('/auth/reconciliation')}
              className="w-full sm:w-1/2 bg-[#1AA260] hover:bg-[#158A52] text-white h-11 px-5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
            >
              <span>Review &amp; Link Accounts</span>
              <ArrowRight className="w-4 h-4" />
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

import { Link } from 'react-router'
import { ShieldCheck, UserCheck, ArrowRight, Lock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-7 sm:p-9 shadow-xs text-center">
        <div className="w-12 h-12 rounded-full border border-[var(--green)] flex items-center justify-center text-[var(--green)] font-sans font-semibold text-base mb-3 mx-auto bg-[var(--paper-raised)] shadow-2xs">
          KD
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          KADIRS Auth System 2.0
        </span>

        <h1 className="font-sans font-semibold text-[20px] sm:text-[24px] text-[var(--ink)] tracking-tight mt-3 mb-2">
          Centralised Identity &amp; Access Platform
        </h1>

        <p className="text-xs sm:text-xs text-[var(--ink-soft)] leading-relaxed max-w-[55ch] mx-auto">
          One unified citizen account for all government services and tax filings.
        </p>

        <div className="mt-6 pt-5 border-t border-[var(--line-soft)] space-y-2.5">
          <Link
            to="/auth/login"
            className="w-full flex items-center justify-center gap-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-sm font-medium py-2.5 rounded-[var(--radius)] transition-colors shadow-2xs"
          >
            <span>Sign in to Citizen Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/auth/register"
              className="flex items-center justify-center gap-1.5 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-[var(--ink)] text-xs font-medium py-2.5 rounded-[var(--radius)] transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[var(--green)]" />
              <span>Register with NIN</span>
            </Link>

            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-1.5 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-[var(--ink)] text-xs font-medium py-2.5 rounded-[var(--radius)] transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-[var(--green)]" />
              <span>Admin Gateway</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--line-soft)] flex items-center justify-between text-[11px] text-[var(--ink-soft)]">
          <span>Kaduna State Government</span>
          <span className="font-mono">NDPA Compliant &middot; AAL2</span>
        </div>
      </div>
    </div>
  )
}

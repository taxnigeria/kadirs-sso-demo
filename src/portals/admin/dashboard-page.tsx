import { Link } from 'react-router'
import { ShieldCheck, CheckCircle2, ArrowLeft, SlidersHorizontal } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-7 sm:p-9 shadow-xs text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] flex items-center justify-center mb-3 mx-auto">
          <SlidersHorizontal className="w-6 h-6" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          KADIRS Administration &middot; Phase 10
        </span>

        <h1 className="font-sans font-semibold text-[22px] sm:text-[24px] text-[var(--ink)] tracking-tight mt-3 mb-2">
          Central Administration Console
        </h1>

        <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed max-w-[46ch] mx-auto">
          Maker/Checker queue for disputed reconciliations, tamper-evident audit logging, and TSP API credentials governance.
        </p>

        <div className="mt-6 pt-5 border-t border-[var(--line-soft)] space-y-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">Reconciliation Queue</span>
            <span className="text-[var(--ink)] font-mono">Maker/Checker active</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">Audit Compliance</span>
            <span className="inline-flex items-center gap-1 text-[var(--green)] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cryptographic logs active
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">Assigned Role</span>
            <span className="text-[var(--ink)] font-mono">KADIRS Revenue Officer</span>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[var(--line-soft)] flex justify-center">
          <Link
            to="/paykaduna"
            className="inline-flex items-center justify-center gap-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-medium px-5 py-2.5 rounded-[var(--radius)] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to PayKaduna</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

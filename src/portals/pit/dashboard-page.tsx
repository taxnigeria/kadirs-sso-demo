import { Link } from 'react-router'
import { FileText, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function PITDashboard() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-7 sm:p-9 shadow-xs text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] flex items-center justify-center mb-3 mx-auto">
          <FileText className="w-6 h-6" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
          <CheckCircle2 className="w-3 h-3" />
          Connected TSP &middot; Phase 8
        </span>

        <h1 className="font-sans font-semibold text-[22px] sm:text-[24px] text-[var(--ink)] tracking-tight mt-3 mb-2">
          Personal Income Tax Portal (PIT)
        </h1>

        <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed max-w-[46ch] mx-auto">
          File direct tax assessments, generate annual Tax Clearance Certificates (TCC), and reconcile PAYE withholdings under your citizen ID.
        </p>

        <div className="mt-6 pt-5 border-t border-[var(--line-soft)] space-y-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">SSO Single Sign-On</span>
            <span className="inline-flex items-center gap-1 font-medium text-[var(--green)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Authenticated (Audience: pit)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">Taxpayer ID (State TIN)</span>
            <span className="text-[var(--ink)] font-mono font-medium">TIN-PIT-008472</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">Filing Status</span>
            <span className="text-[var(--green)] font-medium">2024 Assessment (In Good Standing)</span>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[var(--line-soft)] flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to="/paykaduna"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-medium px-5 py-2.5 rounded-[var(--radius)] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to PayKaduna</span>
          </Link>
          <Link
            to="/auth/reconciliation"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-[var(--ink)] text-xs font-medium px-5 py-2.5 rounded-[var(--radius)] transition-colors"
          >
            <span>Reconciliation Hub</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

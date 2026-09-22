import { Link } from 'react-router'
import { ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-7 sm:p-9 shadow-xs text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] flex items-center justify-center mb-4 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--line-soft)] text-[var(--ink-soft)] border border-[var(--line)]">
          Phase 9 Integration
        </span>

        <h1 className="font-sans font-semibold text-[22px] sm:text-[24px] text-[var(--ink)] tracking-tight mt-3 mb-2">
          Profile Management &amp; NDPA Center
        </h1>

        <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed max-w-[44ch] mx-auto">
          Manage citizen consent lifecycle, biometric verification credentials, and statutory privacy controls under the Nigeria Data Protection Act (NDPA).
        </p>

        <div className="mt-6 pt-5 border-t border-[var(--line-soft)] space-y-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">Citizen Identity Status</span>
            <span className="inline-flex items-center gap-1 font-medium text-[var(--green)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified (NIMC Anchor)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">Data Privacy Framework</span>
            <span className="text-[var(--ink)] font-mono">NDPA 2023 Regulated</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] font-medium">Single Sign-On Level</span>
            <span className="text-[var(--ink)] font-mono">AAL2 Biometric Session</span>
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

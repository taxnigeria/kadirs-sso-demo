import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import {
  Lock,
  Flame,
  ShieldAlert,
  Cpu,
  Clock
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'

interface AdminConsoleLayoutProps {
  children: React.ReactNode
}

export function AdminConsoleLayout({ children }: AdminConsoleLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)
  const logoutAdmin = useAdminEngine((s) => s.logoutAdmin)
  const isBreakGlassActive = useAdminEngine((s) => s.isBreakGlassActive)
  const deactivateBreakGlass = useAdminEngine((s) => s.deactivateBreakGlass)

  const isDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin'

  // 15-Minute Idle Session Timer (900 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(892)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          logoutAdmin()
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [logoutAdmin, navigate])

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`
  }

  // =========================================================================
  // AUTH GUARD: STRICT REQUIREMENT — ADMIN MUST LOGIN TO ACCESS CONSOLE
  // =========================================================================
  if (!currentAdmin) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6 text-center animate-in fade-in">
        <div className="max-w-md w-full bg-[var(--paper-raised)] border border-red-200 rounded-[var(--radius)] p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-bold text-lg text-[var(--ink)]">
            Authentication Required
          </h2>
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
            The KADIRS Administrative Console is locked. You must authenticate using your authorized staff FIDO2 hardware key to view dashboard analytics and operational queues.
          </p>
          <div className="pt-3">
            <Link
              to="/admin"
              className="w-full py-2.5 px-4 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-[var(--radius)] transition-colors shadow-2xs inline-flex items-center justify-center gap-2"
            >
              Authenticate via FIDO2 Hardware Key &rarr;
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const keyIdMatch = currentAdmin.fido2KeyName.match(/#(KD-FIDO-\d+)/)
  const shortKeyId = keyIdMatch ? keyIdMatch[1] : 'KD-FIDO-9182'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* BREAK-GLASS HIGH PRIORITY EMERGENCY BANNER (If Active)                   */}
      {/* ========================================================================= */}
      {isBreakGlassActive && (
        <div className="bg-red-700 text-white p-4 rounded-[var(--radius)] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 shrink-0 text-amber-300" />
            <div>
              <div className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                <span>Critical Incident: Break-Glass Emergency Mode Active</span>
                <span className="px-2 py-0.5 rounded bg-black/30 text-xs font-mono">
                  #KD-BG-01
                </span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                All supervisory constraints bypassed under physical envelope protocol. Full high-priority telemetry logging is active.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={deactivateBreakGlass}
            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-800 text-xs font-bold rounded shadow-xs cursor-pointer shrink-0 transition-colors"
          >
            Deactivate &amp; Re-Seal Vault
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER CARD: ONLY SHOWN ON DASHBOARD AS REQUESTED                          */}
      {/* ========================================================================= */}
      {isDashboard && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 sm:p-5 rounded-[var(--radius)] shadow-2xs space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center font-bold text-sm shrink-0 border border-[var(--green)]/20 shadow-2xs">
                {currentAdmin.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--ink-soft)] font-medium">Operating as:</span>
                  <h1 className="font-sans font-bold text-base text-[var(--ink)] leading-snug">
                    {currentAdmin.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                    {currentAdmin.role.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    {shortKeyId}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-soft)] mt-1 flex flex-wrap items-center gap-1.5">
                  <span>Account: <code className="font-mono text-[var(--ink)] font-semibold">{currentAdmin.email}</code></span>
                  <span>&middot;</span>
                  <span>Staff: <code className="font-mono text-[var(--ink)]">{currentAdmin.staffId}</code></span>
                  <span>&middot;</span>
                  <span>{currentAdmin.department}</span>
                  <span>&middot;</span>
                  <span className="text-[var(--green)] flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    <span>{currentAdmin.fido2KeyName.split(' ')[0]}</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
              {/* Live Idle Countdown */}
              <div className="px-3 py-1.5 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="text-[var(--ink-soft)] font-medium">Locks in:</span>
                <span className="font-mono font-bold text-[var(--ink)]">{formatCountdown(secondsRemaining)}</span>
              </div>

              {/* Single Session Constraint Badge */}
              <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius)] text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                Single Active Session
              </span>
            </div>
          </div>

          {/* Hard Invariants Statutory Compliance Bar */}
          <div className="pt-2 border-t border-[var(--line-soft)] flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
            <div className="flex items-center gap-2 text-[var(--ink)]">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-semibold text-xs">Kaduna State Identity Invariants:</span>
              <span className="text-[var(--ink-soft)] hidden lg:inline text-[11px]">
                Unmasked NINs strictly blinded &middot; Audit logs immutable &middot; Self-auditing prohibited &middot; Logged before effect.
              </span>
            </div>
            <span className="font-mono text-[10px] text-[var(--green)] bg-[var(--green)]/10 border border-[var(--green)]/20 px-2 py-0.5 rounded font-semibold">
              NDPA 2023 Sec. 24 Compliant &middot; AAL3
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPOKE PAGE CONTENT SLOT (TAB ROW HIDDEN AS REQUESTED)                     */}
      {/* ========================================================================= */}
      <div className="animate-in fade-in duration-200">
        {children}
      </div>
    </div>
  )
}

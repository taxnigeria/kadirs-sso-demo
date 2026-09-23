import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Lock,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  Fingerprint,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Flame
} from 'lucide-react'
import { useAdminEngine, DEMO_ADMIN_STAFF } from '@/engine/admin-engine'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const loginAdminWithFido2 = useAdminEngine((s) => s.loginAdminWithFido2)
  const activateBreakGlass = useAdminEngine((s) => s.activateBreakGlass)

  const [selectedStaffId, setSelectedStaffId] = useState<string>(DEMO_ADMIN_STAFF[0].staffId)
  const [securityPin, setSecurityPin] = useState('9922')
  const [isCeremonyOpen, setIsCeremonyOpen] = useState(false)
  const [ceremonyStep, setCeremonyStep] = useState<'prompt' | 'pulsing' | 'verified'>('prompt')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Break-Glass Modal State
  const [isBreakGlassModalOpen, setIsBreakGlassModalOpen] = useState(false)
  const [breakGlassKey, setBreakGlassKey] = useState('')
  const [breakGlassReason, setBreakGlassReason] = useState('')
  const [breakGlassError, setBreakGlassError] = useState<string | null>(null)

  const activeOfficer = DEMO_ADMIN_STAFF.find((s) => s.staffId === selectedStaffId) || DEMO_ADMIN_STAFF[0]

  const handleStartFido2 = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (securityPin.length < 4) {
      setErrorMessage('Please enter your 4-digit staff PIN.')
      return
    }

    // Launch simulated WebAuthn ceremony
    setIsCeremonyOpen(true)
    setCeremonyStep('prompt')
  }

  const handleTouchSecurityKey = async () => {
    setCeremonyStep('pulsing')
    const simulatedSignature = `sig_ctap2_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`
    
    // Simulate CTAP2 hardware key communication
    const success = await loginAdminWithFido2(activeOfficer.staffId, simulatedSignature)

    if (success) {
      setCeremonyStep('verified')
      setTimeout(() => {
        setIsCeremonyOpen(false)
        navigate('/admin/dashboard')
      }, 1000)
    } else {
      setCeremonyStep('prompt')
      setErrorMessage('FIDO2 hardware key assertion rejected. Please verify your credentials.')
      setIsCeremonyOpen(false)
    }
  }

  const handleConfirmBreakGlass = (e: React.FormEvent) => {
    e.preventDefault()
    setBreakGlassError(null)

    if (!breakGlassKey.trim()) {
      setBreakGlassError('Please enter the physical envelope emergency keycode.')
      return
    }
    if (!breakGlassReason.trim() || breakGlassReason.trim().length < 10) {
      setBreakGlassError('Statutory justification requires minimum 10 characters for audit compliance.')
      return
    }

    const success = activateBreakGlass(breakGlassKey.trim(), breakGlassReason.trim())
    if (success) {
      setIsBreakGlassModalOpen(false)
      navigate('/admin/dashboard')
    } else {
      setBreakGlassError('Invalid emergency key. Use demo physical envelope key: EMERGENCY-KD-IT-HEAD-KEY')
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 sm:p-8 shadow-md">
        {/* Top Header Badge */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] flex items-center justify-center mx-auto shadow-2xs">
            <Lock className="w-6 h-6" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Kaduna Gov PKI &middot; AAL3 High Assurance
            </span>
          </div>

          <h1 className="font-sans font-semibold text-[22px] sm:text-[24px] text-[var(--ink)] tracking-tight">
            KADIRS Central Administration Console
          </h1>
          <p className="text-xs text-[var(--ink-soft)] max-w-[46ch] mx-auto leading-relaxed">
            Restricted to authorized Kaduna State revenue supervisors, compliance auditors, and dispute adjudicators.
          </p>
        </div>

        {/* Quick Officer Selector Cards */}
        <div className="space-y-2 mb-6">
          <label className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider block">
            Select Officer Profile (Demo Simulation):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_ADMIN_STAFF.map((staff) => {
              const isSelected = selectedStaffId === staff.staffId
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaffId(staff.staffId)
                    setErrorMessage(null)
                  }}
                  className={`p-3 rounded-[var(--radius)] border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--green)] bg-[var(--green)]/5 ring-1 ring-[var(--green)] shadow-2xs'
                      : 'border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)]'
                  }`}
                >
                  <div className="font-semibold text-xs text-[var(--ink)] truncate">
                    {staff.name}
                  </div>
                  <div className="text-[10px] text-[var(--green)] font-medium capitalize mt-0.5">
                    {staff.role.replace('_', ' ')}
                  </div>
                  <div className="text-[9.5px] font-mono text-[var(--ink-soft)] mt-1 truncate">
                    {staff.staffId}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleStartFido2} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-[var(--radius)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--ink)] block">
              Staff Official Email
            </label>
            <input
              type="email"
              value={activeOfficer.email}
              readOnly
              className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs font-mono text-[var(--ink)] cursor-not-allowed opacity-80"
            />
            <span className="text-[11px] text-[var(--ink-soft)] block">
              Department: {activeOfficer.department}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--ink)] block">
                Staff Security PIN
              </label>
              <span className="text-[10.5px] text-[var(--ink-soft)]">
                Demo PIN: <code className="font-bold text-[var(--ink)]">9922</code>
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[var(--ink-soft)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={6}
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                placeholder="Enter 4-6 digit PIN"
                className="w-full pl-9 pr-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs font-mono tracking-widest text-[var(--ink)] focus:outline-none focus:border-[var(--green)]"
              />
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius)] bg-[var(--paper)] border border-[var(--line)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--green)] shrink-0" />
              <div>
                <span className="font-medium text-[var(--ink)] block">Registered FIDO2 Key:</span>
                <span className="text-[10.5px] font-mono text-[var(--ink-soft)]">
                  {activeOfficer.fido2KeyName}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-[var(--green)]/10 text-[var(--green)] text-[10.5px] font-bold border border-[var(--green)]/20">
              CTAP2 Bound
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-[var(--radius)] transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Authenticate with FIDO2 Hardware Key &rarr;</span>
          </button>
        </form>

        {/* Break-Glass Emergency Access */}
        <div className="mt-6 pt-5 border-t border-[var(--line)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-semibold">Break-Glass Emergency:</span>
          </div>

          <button
            type="button"
            onClick={() => setIsBreakGlassModalOpen(true)}
            className="text-xs text-red-700 hover:text-red-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Physical Envelope Protocol #KD-BG-01</span>
          </button>
        </div>

        {/* Bottom Navigation Links */}
        <div className="mt-4 pt-4 border-t border-[var(--line-soft)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-soft)]">
          <Link
            to="/paykaduna"
            className="hover:text-[var(--ink)] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to PayKaduna</span>
          </Link>
          <Link
            to="/auth/login"
            className="hover:text-[var(--green)] font-medium transition-colors"
          >
            Citizen Sign In &rarr;
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIMULATED FIDO2 WEBAUTHN HARDWARE KEY CEREMONY MODAL                      */}
      {/* ========================================================================= */}
      {isCeremonyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--green)] font-bold">
                WebAuthn CTAP2 Protocol
              </span>
              <h3 className="font-sans font-semibold text-lg text-[var(--ink)]">
                Security Key Touch Verification
              </h3>
              <p className="text-xs text-[var(--ink-soft)]">
                Insert your registered token and press the gold contact to verify physical presence.
              </p>
            </div>

            {/* Hardware Key Animated Visual */}
            <div className="p-6 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
              {ceremonyStep === 'prompt' && (
                <div
                  onClick={handleTouchSecurityKey}
                  className="w-16 h-16 rounded-full bg-[var(--green)]/15 border-2 border-[var(--green)] text-[var(--green)] flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-md group animate-pulse"
                >
                  <Fingerprint className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
              )}

              {ceremonyStep === 'pulsing' && (
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-500 text-amber-600 flex items-center justify-center animate-spin">
                  <Cpu className="w-8 h-8" />
                </div>
              )}

              {ceremonyStep === 'verified' && (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center animate-in zoom-in">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-[var(--ink)]">
                  {ceremonyStep === 'prompt' && 'Click or touch sensor above'}
                  {ceremonyStep === 'pulsing' && 'Validating cryptographic signature...'}
                  {ceremonyStep === 'verified' && 'AAL3 Assurance Token Issued!'}
                </div>
                <div className="text-[11px] font-mono text-[var(--ink-soft)] mt-0.5">
                  Device: {activeOfficer.fido2KeyName}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-[var(--line)]">
              <span className="text-[11px] text-[var(--ink-soft)]">
                Staff: {activeOfficer.name} ({activeOfficer.staffId})
              </span>
              <button
                type="button"
                onClick={() => setIsCeremonyOpen(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BREAK-GLASS EMERGENCY ACCESS MODAL                                        */}
      {/* ========================================================================= */}
      {isBreakGlassModalOpen && (
        <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--paper-raised)] border border-red-300 rounded-[var(--radius)] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-700 border-b border-red-200 pb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-[var(--ink)]">
                  Break-Glass Emergency Protocol
                </h3>
                <span className="text-[10px] font-mono text-red-800 uppercase tracking-wider block">
                  Physical Envelope Ref: #KD-BG-01
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              This procedure is strictly reserved for critical outages or executive failover when standard FIDO2 tokens are inaccessible.
              <strong> Every break-glass session triggers high-priority tamper-evident audit logging.</strong>
            </p>

            {breakGlassError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-[var(--radius)]">
                {breakGlassError}
              </div>
            )}

            <form onSubmit={handleConfirmBreakGlass} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--ink)] block">
                  Physical Envelope Emergency Key *
                </label>
                <input
                  type="text"
                  value={breakGlassKey}
                  onChange={(e) => setBreakGlassKey(e.target.value)}
                  placeholder="e.g. EMERGENCY-KD-IT-HEAD-KEY"
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] font-mono text-xs text-[var(--ink)] focus:outline-none focus:border-red-600"
                />
                <span className="text-[10px] text-[var(--ink-soft)] block">
                  Demo code: <code className="font-mono font-bold text-red-700">EMERGENCY-KD-IT-HEAD-KEY</code>
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--ink)] block">
                  Statutory Incident Justification *
                </label>
                <textarea
                  rows={2}
                  value={breakGlassReason}
                  onChange={(e) => setBreakGlassReason(e.target.value)}
                  placeholder="Explain operational emergency justification..."
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs text-[var(--ink)] focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setIsBreakGlassModalOpen(false)}
                  className="px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] text-xs text-[var(--ink)] hover:bg-[var(--line-soft)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-[var(--radius)] text-xs shadow-xs cursor-pointer transition-colors"
                >
                  Activate Emergency Access &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

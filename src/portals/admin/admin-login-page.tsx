import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Lock,
  ShieldCheck,
  ArrowLeft,
  Fingerprint,
  Cpu,
  CheckCircle2,
  ShieldAlert,
  Flame,
  AlertTriangle,
  ArrowRight,
  Shield,
  Key,
  Loader2
} from 'lucide-react'
import { useAdminEngine, DEMO_ADMIN_STAFF } from '@/engine/admin-engine'
import { useAuthEngine } from '@/engine/auth-engine'
import { useEventLogger } from '@/engine/event-logger'

type LoginView = 'step1_auth' | 'step2_attribution' | 'break_glass' | 'unregistered_key'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)
  const loginAdminWithFido2 = useAdminEngine((s) => s.loginAdminWithFido2)
  const activateBreakGlass = useAdminEngine((s) => s.activateBreakGlass)

  // Selected key for simulation
  const [selectedKeyId, setSelectedKeyId] = useState<string>('KD-FIDO-9182')
  const [view, setView] = useState<LoginView>('step1_auth')
  const [isCeremonyPulsing, setIsCeremonyPulsing] = useState(false)

  // Break-Glass state
  const [envelopeRef, setEnvelopeRef] = useState('EMERGENCY-KD-IT-HEAD-KEY')
  const [breakGlassReason, setBreakGlassReason] = useState('')
  const [breakGlassError, setBreakGlassError] = useState<string | null>(null)

  // Active officer based on key
  const activeOfficer = DEMO_ADMIN_STAFF.find((s) => s.fido2KeyName.includes(selectedKeyId)) || DEMO_ADMIN_STAFF[0]

  // Step 2 auto-redirect timer (7 seconds)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (view === 'step2_attribution') {
      timer = setTimeout(() => {
        navigate('/admin/dashboard')
      }, 7000)
    }
    return () => clearTimeout(timer)
  }, [view, navigate])

  // FIDO2 Key Touch Handler
  const handleTouchSecurityKey = async () => {
    setIsCeremonyPulsing(true)

    // Simulate CTAP2 hardware key communication
    await new Promise((r) => setTimeout(r, 900))
    setIsCeremonyPulsing(false)

    if (selectedKeyId === 'UNREGISTERED-KEY') {
      // Unregistered key hard stop
      useEventLogger.getState().logEvent({
        category: 'security',
        action: 'UNREGISTERED_HARDWARE_KEY_REJECTED',
        actor: 'admin@kadirs.gov.ng',
        details: {
          keyAssertion: 'fido2_ctap2_unknown_cert_hash',
          ipAddress: '192.168.10.4',
          alertLevel: 'HIGH_PRIORITY_INCIDENT'
        }
      })
      setView('unregistered_key')
      return
    }

    const simulatedSignature = `sig_ctap2_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`
    const success = await loginAdminWithFido2(activeOfficer.staffId, simulatedSignature)

    if (success) {
      if (useAuthEngine.getState().currentUser) {
        useAuthEngine.getState().logout()
      }
      setView('step2_attribution')
    }
  }

  // Break-Glass Execution Handler
  const handleConfirmBreakGlass = (e: React.FormEvent) => {
    e.preventDefault()
    setBreakGlassError(null)

    if (!envelopeRef.trim()) {
      setBreakGlassError('Please enter the physical envelope reference number.')
      return
    }
    if (!breakGlassReason.trim() || breakGlassReason.trim().length < 10) {
      setBreakGlassError('Statutory justification requires minimum 10 characters for audit compliance.')
      return
    }

    const success = activateBreakGlass(envelopeRef.trim(), breakGlassReason.trim())
    if (success) {
      if (useAuthEngine.getState().currentUser) {
        useAuthEngine.getState().logout()
      }
      navigate('/admin/dashboard')
    } else {
      setBreakGlassError('Invalid emergency key. Use demo physical envelope key: EMERGENCY-KD-IT-HEAD-KEY')
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 sm:p-8 shadow-md">
        
        {/* Active Session Notice if already authenticated */}
        {currentAdmin && view === 'step1_auth' && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-[var(--radius)] flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Active Session: Operating as <strong>{currentAdmin.name}</strong> ({currentAdmin.role.replace('_', ' ')})
              </span>
            </div>
            <Link
              to="/admin/dashboard"
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[11px] shrink-0"
            >
              Resume Console &rarr;
            </Link>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: AUTHENTICATION (SPEC-LITERAL, INSTITUTIONAL ACCOUNT)               */}
        {/* ========================================================================= */}
        {view === 'step1_auth' && (
          <div className="space-y-6">
            {/* Header with Institutional Identity */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] flex items-center justify-center mx-auto shadow-2xs">
                <Lock className="w-6 h-6" />
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-semibold bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Kaduna Gov PKI &middot; AAL3 High Assurance
                </span>
              </div>

              <h1 className="font-sans font-semibold text-[22px] sm:text-[24px] text-[var(--ink)] tracking-tight">
                KADIRS Central Administration Console
              </h1>
              <p className="text-xs text-[var(--ink-soft)] max-w-[46ch] mx-auto leading-relaxed">
                Administrative session for authorized Kaduna State revenue supervisors, compliance auditors, and dispute adjudicators.
              </p>
            </div>

            {/* Institutional Identity Card (Shown, not typed) */}
            <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block">
                  Institutional Account
                </span>
                <div className="font-mono text-xs font-bold text-[var(--ink)] flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-[var(--green)]" />
                  <span>admin@kadirs.gov.ng</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                Single Account Rule
              </span>
            </div>

            {/* Demo Registered Key Selector (Reframed as Key Simulation) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider block">
                  Select Registered Hardware Key to Touch (Demo):
                </label>
                <span className="text-[10.5px] text-[var(--ink-soft)]">
                  Personal key &middot; Institutional account
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_ADMIN_STAFF.map((staff) => {
                  const keyId = staff.fido2KeyName.match(/#(KD-FIDO-\d+)/)?.[1] || 'KD-FIDO-9182'
                  const isSelected = selectedKeyId === keyId
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => setSelectedKeyId(keyId)}
                      className={`p-3 rounded-[var(--radius)] border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--green)] bg-[var(--green)]/5 ring-1 ring-[var(--green)] shadow-2xs'
                          : 'border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-[var(--ink)] flex items-center gap-1.5 truncate">
                          <Cpu className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                          <span>{staff.fido2KeyName.split(' #')[0]}</span>
                        </div>
                        <span className="font-mono text-[9px] text-[var(--ink-soft)] font-bold">
                          {keyId}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-[var(--ink-soft)] mt-1 truncate">
                        Bound to: <strong className="text-[var(--ink)]">{staff.name}</strong>
                      </div>
                      <div className="text-[9.5px] text-[var(--green)] font-medium capitalize mt-0.5">
                        {staff.role.replace('_', ' ')}
                      </div>
                    </button>
                  )
                })}

                {/* Unregistered Key Option to demonstrate rejection */}
                <button
                  type="button"
                  onClick={() => setSelectedKeyId('UNREGISTERED-KEY')}
                  className={`p-3 rounded-[var(--radius)] border text-left transition-all cursor-pointer ${
                    selectedKeyId === 'UNREGISTERED-KEY'
                      ? 'border-red-400 bg-red-50/50 ring-1 ring-red-400'
                      : 'border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Unregistered Key</span>
                    </div>
                    <span className="font-mono text-[9px] text-red-600 font-bold">
                      #UNKNOWN
                    </span>
                  </div>
                  <div className="text-[10px] text-red-600 mt-1">
                    Demonstrate rejection &amp; security incident log
                  </div>
                </button>
              </div>
            </div>

            {/* Hardware Key CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTouchSecurityKey}
                disabled={isCeremonyPulsing}
                className="w-full py-3 px-4 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-[var(--radius)] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCeremonyPulsing ? (
                  <>
                    <Fingerprint className="w-4 h-4 animate-ping text-white" />
                    <span>Communicating with Hardware Key (CTAP2)...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Insert and Touch Your Registered Hardware Key</span>
                  </>
                )}
              </button>
            </div>

            {/* Demoted Tertiary Link for Break-Glass */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs">
              <Link
                to="/"
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Citizen Portal</span>
              </Link>

              <button
                type="button"
                onClick={() => setView('break_glass')}
                className="text-[var(--ink-soft)] hover:text-red-700 text-[11px] underline cursor-pointer transition-colors"
              >
                Emergency access (break-glass) &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: OFFICER ATTRIBUTION (POST-KEY-TOUCH SCREEN)                       */}
        {/* ========================================================================= */}
        {view === 'step2_attribution' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                Hardware Key Assertion Verified &middot; CTAP2 Passed
              </span>
              <h2 className="font-sans font-bold text-xl text-[var(--ink)]">
                Key Recognized &mdash; {activeOfficer.name}
              </h2>
              <p className="text-xs text-[var(--ink-soft)]">
                {activeOfficer.role.replace('_', ' ')} &middot; {activeOfficer.department}
              </p>
            </div>

            {/* Attribution Statement Card */}
            <div className="p-4 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[var(--green)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[var(--ink)]">
                    Beginning session as operator of the KADIRS administrative account
                  </div>
                  <div className="text-[var(--ink-soft)] text-[11px] mt-0.5">
                    Account: <code className="font-mono text-[var(--ink)] font-bold">admin@kadirs.gov.ng</code>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded text-[11px] leading-relaxed text-[var(--ink-soft)]">
                <strong className="text-[var(--ink)]">Governance Invariant:</strong> This is an individual attribution step, not a separate administrative account. All supervisory actions, approvals, and dispute adjudications during this session will be cryptographically bound to <strong className="text-[var(--ink)]">{activeOfficer.name}</strong> ({activeOfficer.staffId}) in the immutable audit log.
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-[var(--ink-soft)] block text-[10px]">Registered Hardware Token:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">{activeOfficer.fido2KeyName}</span>
                </div>
                <div>
                  <span className="text-[var(--ink-soft)] block text-[10px]">Assurance Level:</span>
                  <span className="font-bold text-[var(--green)]">AAL3 High Assurance</span>
                </div>
              </div>
            </div>

            {/* Direct Proceed Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="w-full py-3 px-4 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-[var(--radius)] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Administrative Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--ink-soft)] pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--green)]" />
                <span>Redirecting to administrative console...</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* UNREGISTERED KEY REJECTION HARD STOP                                      */}
        {/* ========================================================================= */}
        {view === 'unregistered_key' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="font-sans font-bold text-xl text-red-800">
                Unregistered Hardware Key Detected
              </h2>
              <p className="text-xs text-red-600">
                Cryptographic assertion rejected &mdash; Key public key hash is not bound to institutional administrative account.
              </p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-[var(--radius)] text-xs text-left space-y-2 text-red-900">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                <span>Security Policy Enforcement:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Under Kaduna State Central Identity Policy, unauthenticated hardware devices are barred from administrative console access. This attempted assertion has been logged to the immutable security stream before effect.
              </p>
              <div className="font-mono text-[10.5px] bg-white p-2 rounded border border-red-200">
                EVENT: UNREGISTERED_HARDWARE_KEY_REJECTED &middot; ACTOR: admin@kadirs.gov.ng
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedKeyId('KD-FIDO-9182')
                setView('step1_auth')
              }}
              className="py-2.5 px-6 bg-[var(--ink)] hover:bg-slate-800 text-white text-xs font-semibold rounded-[var(--radius)] cursor-pointer transition-colors"
            >
              &larr; Return to Key Selection
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BREAK-GLASS EMERGENCY ACCESS INTERSTITIAL SCREEN                          */}
        {/* ========================================================================= */}
        {view === 'break_glass' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                <Flame className="w-6 h-6 text-red-700" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-red-100 text-red-800 border border-red-200">
                PROTOCOL #KD-BG-01
              </span>
              <h2 className="font-sans font-bold text-lg text-[var(--ink)]">
                Break-Glass Emergency Access
              </h2>
              <p className="text-xs text-[var(--ink-soft)] max-w-[46ch] mx-auto">
                For catastrophic hardware key loss, severe system incidents, or emergency disaster recovery.
              </p>
            </div>

            {/* Critical Warning Banner */}
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-[var(--radius)] text-xs text-red-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                <span>Supervisory Controls Bypassed:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Break-glass access bypasses standard approval chains. All actions taken during this session will be watermarked, flagged, and submitted directly to the Kaduna State Auditor General and NDPC.
              </p>
            </div>

            {breakGlassError && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-900 text-xs rounded-[var(--radius)]">
                {breakGlassError}
              </div>
            )}

            <form onSubmit={handleConfirmBreakGlass} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--ink)] block">
                  Physical Envelope Reference Code *
                </label>
                <input
                  type="text"
                  required
                  value={envelopeRef}
                  onChange={(e) => setEnvelopeRef(e.target.value)}
                  placeholder="e.g. EMERGENCY-KD-IT-HEAD-KEY"
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded font-mono text-xs text-[var(--ink)]"
                />
                <span className="text-[10.5px] text-[var(--ink-soft)] block">
                  Demo code: <code className="font-mono font-bold text-[var(--ink)]">EMERGENCY-KD-IT-HEAD-KEY</code>
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--ink)] block">
                  Statutory Incident Justification (Min 10 characters) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={breakGlassReason}
                  onChange={(e) => setBreakGlassReason(e.target.value)}
                  placeholder="State the incident ticket number, nature of emergency, and authorizing ministry..."
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setView('step1_auth')}
                  className="px-3 py-1.5 border border-[var(--line)] hover:bg-[var(--line-soft)] text-xs rounded cursor-pointer"
                >
                  &larr; Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4" />
                  <span>Activate Emergency Elevated Session</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

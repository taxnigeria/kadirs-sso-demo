import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ShieldCheck, ArrowRight, X, KeyRound, Loader2 } from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'

interface SSOTransitionModalProps {
  isOpen: boolean
  targetTspName: string
  targetTspUrl: string
  targetAudience: string
  onClose: () => void
}

interface ContentProps {
  targetTspName: string
  targetTspUrl: string
  targetAudience: string
  onClose: () => void
}

function SSOTransitionModalContent({
  targetTspName,
  targetTspUrl,
  targetAudience,
  onClose
}: ContentProps) {
  const navigate = useNavigate()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)

  const [isBarActive, setIsBarActive] = useState(false)

  const citizenName = identity?.legalName || currentUser?.email || 'Citizen'

  const handleProceedNow = () => {
    onClose()
    navigate(targetTspUrl)
  }

  // Mounts fresh every time the modal is opened — runs strictly ONCE on mount
  useEffect(() => {
    // 1. Trigger context switch in auth engine (locks token audience)
    try {
      useAuthEngine.getState().switchTspContext(targetAudience)
    } catch {
      // Safe fallback
    }

    // 2. Trigger smooth CSS progress bar transition
    const barFrame = requestAnimationFrame(() => {
      setIsBarActive(true)
    })

    // 3. Auto-redirect on complete (7 seconds)
    const navigateTimer = setTimeout(() => {
      onClose()
      navigate(targetTspUrl)
    }, 7000)

    return () => {
      cancelAnimationFrame(barFrame)
      clearTimeout(navigateTimer)
    }
  }, [targetAudience, targetTspUrl, navigate, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[var(--paper-raised)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* PayKaduna Forest Green Header with Kaduna Gold Accent */}
        <div className="bg-gradient-to-r from-[#164F35] via-[#1F6F4A] to-[#164F35] border-b-2 border-[#B98A2E] text-white p-5 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-emerald-200 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                  PayKaduna Central SSO
                </span>
                <h3 className="font-sans font-semibold text-base sm:text-lg text-white tracking-tight">
                  Signing you into {targetTspName.split(' ')[0]}...
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-emerald-100 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Cancel transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal, Instant-Read Body */}
        <div className="p-5 space-y-4">
          {/* Visual Handshake: PayKaduna -> Target TSP */}
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              {/* Source */}
              <div className="text-center w-24 sm:w-28 p-2.5 bg-[var(--paper-raised)] rounded-lg border border-[var(--line)] shadow-2xs">
                <span className="text-[9px] text-[var(--ink-soft)] uppercase font-semibold block">From</span>
                <strong className="text-[var(--ink)] text-xs truncate block font-semibold">PayKaduna</strong>
              </div>

              {/* Progress Stream */}
              <div className="flex-1 flex flex-col items-center px-1">
                <span className="text-[10px] text-[#1F6F4A] dark:text-emerald-400 font-medium mb-1.5 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />
                  Secure Token
                </span>
                <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full bg-gradient-to-r from-[#1F6F4A] via-[#4FAE80] to-[#1F6F4A] transition-all duration-[7000ms] ease-out ${
                      isBarActive ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              </div>

              {/* Target */}
              <div className="text-center w-24 sm:w-28 p-2.5 bg-[#1F6F4A]/10 rounded-lg border border-[#1F6F4A]/30 text-[#164F35] dark:text-emerald-300 shadow-2xs">
                <span className="text-[9px] uppercase font-semibold block opacity-75">To</span>
                <strong className="text-xs truncate block font-bold">{targetTspName.split(' ')[0]}</strong>
              </div>
            </div>

            {/* One Simple Status Line */}
            <div className="mt-3 pt-3 border-t border-[var(--line-soft)] flex items-center justify-between text-xs">
              <span className="text-[var(--ink-soft)] truncate">
                Session: <strong className="text-[var(--ink)]">{citizenName.split(' ')[0]}</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1F6F4A] dark:text-emerald-400">
                <span>✓</span> Privacy Protected
              </span>
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--ink-soft)] py-0.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F6F4A]" />
            <span>Redirecting to {targetTspName.split(' ')[0]}...</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-[var(--line-soft)]">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleProceedNow}
              className="bg-[#1F6F4A] hover:bg-[#164F35] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm cursor-pointer"
            >
              <span>Proceed Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SSOTransitionModal({
  isOpen,
  targetTspName,
  targetTspUrl,
  targetAudience,
  onClose
}: SSOTransitionModalProps) {
  if (!isOpen) return null

  return (
    <SSOTransitionModalContent
      targetTspName={targetTspName}
      targetTspUrl={targetTspUrl}
      targetAudience={targetAudience}
      onClose={onClose}
    />
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ShieldCheck, X } from 'lucide-react'
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
  const [isBarActive, setIsBarActive] = useState(false)

  // Mounts fresh every time the modal is opened — runs strictly ONCE on mount
  useEffect(() => {
    // 1. Trigger context switch in auth engine (locks token audience)
    try {
      useAuthEngine.getState().switchTspContext(targetAudience)
    } catch {
      // Safe fallback
    }

    // 2. Trigger smooth progress animation
    const barFrame = requestAnimationFrame(() => {
      setIsBarActive(true)
    })

    // 3. Auto-redirect on complete (snappy 2.2 seconds)
    const navigateTimer = setTimeout(() => {
      onClose()
      navigate(targetTspUrl)
    }, 2200)

    return () => {
      cancelAnimationFrame(barFrame)
      clearTimeout(navigateTimer)
    }
  }, [targetAudience, targetTspUrl, navigate, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1E2522] border border-gray-100 dark:border-white/10 rounded-[28px] p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Subtle top-right close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--gray-400)] hover:text-[var(--ink)] p-2 rounded-full hover:bg-[var(--gray-100)] dark:hover:bg-white/5 transition-colors cursor-pointer"
          title="Cancel transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modern Spinning Ring with Emerald Center */}
        <div className="relative w-16 h-16 my-2 flex items-center justify-center">
          <svg className="w-16 h-16 animate-spin text-[#1AA260]" viewBox="0 0 64 64" fill="none">
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeWidth="3.5"
              className="opacity-15 text-emerald-900 dark:text-emerald-200"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeDasharray="163"
              strokeDashoffset="115"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#1AA260]" />
          </div>
        </div>

        {/* Clean, low-noise text */}
        <div className="mt-4 space-y-1.5 max-w-[280px]">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#1AA260]">
            Single Sign-On
          </p>
          <h3 className="text-base sm:text-[17px] font-semibold text-[var(--ink)] leading-snug">
            Redirecting to {targetTspName}...
          </h3>
          <p className="text-xs text-[var(--gray-500)] leading-relaxed">
            Connecting your verified credentials securely
          </p>
        </div>

        {/* Subtle progress bar */}
        <div className="w-full max-w-[180px] h-1 bg-emerald-100 dark:bg-emerald-950/50 rounded-full overflow-hidden mt-5">
          <div
            className={`h-full bg-[#1AA260] rounded-full transition-all duration-[2200ms] ease-out ${
              isBarActive ? 'w-full' : 'w-0'
            }`}
          />
        </div>

        {/* Quiet cancel action */}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 text-xs text-[var(--gray-400)] hover:text-[var(--ink)] font-medium transition-colors cursor-pointer px-3 py-1 rounded-full hover:bg-[var(--gray-100)] dark:hover:bg-white/5"
        >
          Cancel
        </button>
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

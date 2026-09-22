import { Link } from 'react-router'
import { Sun, Moon, Search, RotateCcw } from 'lucide-react'
import { useThemeStore } from '@/engine/theme-store'
import { useAuthEngine } from '@/engine/auth-engine'
import { type PortalConfig } from './portal-branding'

interface TopbarProps {
  portal: PortalConfig
}

export function Topbar({ portal }: TopbarProps) {
  const { theme, toggleTheme } = useThemeStore()
  const resetDemo = useAuthEngine((s) => s.resetDemo)
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const activePersona = useAuthEngine((s) => s.activePersona)

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md px-6 py-3.5 flex items-center justify-between transition-colors">
      {/* Left: Official KD Seal + Org Heading */}
      <div className="flex items-center gap-3.5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-[30px] h-[30px] rounded-full border-[1.5px] border-[var(--green)] flex items-center justify-center text-[var(--green)] font-serif font-semibold text-xs tracking-tight">
            KD
          </div>
          <div>
            <div className="font-serif font-semibold text-[17px] leading-tight text-[var(--ink)] tracking-[0.01em]">
              Kaduna State Revenue Service
            </div>
            <span className="block font-sans font-normal text-[11.5px] text-[var(--ink-soft)] mt-0.5">
              Unified Identity & Access Platform &mdash; Auth 2.0
            </span>
          </div>
        </Link>

        {/* Portal Breadcrumb / Identifier */}
        {portal.id !== 'home' && portal.id !== 'auth' && (
          <div className="hidden md:flex items-center gap-2 pl-4 ml-4 border-l border-[var(--line)]">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--green)]">
              {portal.name}
            </span>
          </div>
        )}
      </div>

      {/* Center/Right: Navigation & User info */}
      <div className="flex items-center gap-3">

        {/* Current user pill if logged in */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius)] bg-[var(--line-soft)] border border-[var(--line)] text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            <span className="text-[var(--ink)] font-medium">
              {identity?.legalName.split(' ')[0] || currentUser.email.split('@')[0]}
            </span>
            <span className="text-[10px] text-[var(--ink-soft)] uppercase tracking-wider">
              ({activePersona})
            </span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Light / Dark Mode"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line-soft)] rounded-[var(--radius)] border border-[var(--line)] transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[var(--gold)]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--ink-soft)]" />
          )}
        </button>

        {/* Reset Demo button */}
        <button
          onClick={() => {
            if (confirm('Reset demo state back to pristine seed data?')) {
              resetDemo()
              window.location.href = '/'
            }
          }}
          title="Reset Demo Data"
          className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--danger)] hover:bg-[var(--line-soft)] rounded-[var(--radius)] border border-[var(--line)] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Inspector Button */}
        <button
          onClick={() => alert('Technical Architecture Inspector (RS256 JWT & Kafka Webhooks) will be active in Phase 11.')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)] rounded-[var(--radius)] hover:bg-[var(--line-soft)] transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[var(--green)]" />
          <span>Inspector</span>
        </button>
      </div>
    </header>
  )
}

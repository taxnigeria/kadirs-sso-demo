import { Link } from 'react-router'
import { Sun, Moon, Code2, RotateCcw, User, Search, Menu } from 'lucide-react'
import { useThemeStore } from '@/engine/theme-store'
import { useAuthEngine } from '@/engine/auth-engine'
import { useAdminEngine } from '@/engine/admin-engine'
import { useInspectorStore } from '@/engine/inspector-store'
import { usePresentationStore } from '@/engine/presentation-store'
import { LogoMark } from './universal-navbar'
import { type PortalConfig } from './portal-branding'

interface TopbarProps {
  portal: PortalConfig
  hasSidebar?: boolean
  onToggleMobileNav?: () => void
}

export function Topbar({ portal, hasSidebar, onToggleMobileNav }: TopbarProps) {
  const { theme, toggleTheme } = useThemeStore()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const activePersona = useAuthEngine((s) => s.activePersona)
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)
  const logoutAdmin = useAdminEngine((s) => s.logoutAdmin)

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between transition-colors w-full max-w-full overflow-hidden">
      {/* Left: Mobile Menu Trigger + Official KD Seal + Org Heading */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {hasSidebar && onToggleMobileNav && (
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] text-[var(--ink)] cursor-pointer shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <LogoMark />
          <div className="min-w-0">
            <div className="font-sans font-semibold text-sm sm:text-[16px] leading-tight text-[var(--ink)] tracking-tight truncate">
              Kaduna State Revenue Service
            </div>
            <span className="hidden sm:block font-sans font-normal text-[11.5px] text-[var(--ink-soft)] mt-0.5 truncate">
              Unified Identity &amp; Access Platform &mdash; Auth 2.0
            </span>
          </div>
        </Link>

        {/* Portal Breadcrumb / Identifier */}
        {portal.id !== 'home' && portal.id !== 'auth' && (
          <div className="hidden md:flex items-center gap-2 pl-4 ml-4 border-l border-[var(--line)] shrink-0">
            <span className={`text-xs uppercase tracking-wider font-semibold ${portal.textColor || 'text-[var(--green)]'}`}>
              {portal.name}
            </span>
          </div>
        )}
      </div>

      {/* Center/Right: Navigation & User info */}
      <div className="flex items-center gap-2.5">

        {/* Current user pill if logged in (Citizen Portals Only) */}
        {currentUser && portal.id !== 'admin' && (
          <Link
            to="/auth/profile"
            title="Manage Citizen Profile & NDPA Privacy Center"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius)] bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] border border-[var(--line)] text-xs transition-colors cursor-pointer group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            <User className="w-3.5 h-3.5 text-[var(--green)] group-hover:scale-110 transition-transform" />
            <span className="text-[var(--ink)] font-medium">
              {identity?.legalName.split(' ')[0] || currentUser.email.split('@')[0]}
            </span>
            <span className="text-[10px] text-[var(--ink-soft)] uppercase tracking-wider font-medium">
              ({activePersona})
            </span>
          </Link>
        )}

        {/* Admin Session Pill if logged into admin console */}
        {currentAdmin && portal.id === 'admin' && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius)] bg-[var(--paper-raised)] border border-[var(--line)] text-xs shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            <span className="text-[var(--ink)] font-medium">
              {currentAdmin.name}
            </span>
            <span className="text-[10px] text-[var(--green)] font-semibold uppercase tracking-wider">
              ({currentAdmin.role.replace('_', ' ')})
            </span>
            <button
              type="button"
              onClick={() => {
                logoutAdmin()
                window.location.href = '/'
              }}
              className="ml-1 text-red-600 hover:text-red-700 text-[11px] font-semibold cursor-pointer hover:underline"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Quick Persona Switcher & Command Palette Button */}
        <button
          type="button"
          onClick={() => usePresentationStore.getState().openPalette()}
          title="Quick Switch Persona or Portal (Cmd+K / Ctrl+K)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--ink)] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.14] rounded-full transition-colors cursor-pointer group border-0"
        >
          <Search className="w-3.5 h-3.5 text-[#1AA260] group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-medium">Quick Switch</span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1 py-0.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full text-[var(--gray-500)]">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Light / Dark Mode"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 text-[var(--gray-700)] dark:text-[var(--ink)] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.14] rounded-full transition-colors cursor-pointer border-0"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--gray-700)]" />
          )}
        </button>

        {/* Reset Demo button */}
        <button
          onClick={() => {
            if (confirm('Reset demo state back to pristine seed data? All modifications will be cleared.')) {
              usePresentationStore.getState().resetAllDemoData()
              window.location.href = '/'
            }
          }}
          title="Reset All Demo Data to Seed"
          aria-label="Reset Demo Data"
          className="p-2 text-[var(--gray-500)] hover:text-[var(--danger)] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.14] rounded-full transition-colors cursor-pointer border-0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Technical Architecture Inspector Button — Only shown to authenticated administrators */}
        {Boolean(currentAdmin) && (
          <button
            type="button"
            onClick={() => useInspectorStore.getState().openInspector()}
            title="Open Technical Architecture Inspector (Alt+I)"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] hover:bg-[var(--line-soft)] transition-colors cursor-pointer shadow-2xs group"
          >
            <Code2 className="w-3.5 h-3.5 text-[var(--green)] group-hover:rotate-12 transition-transform" />
            <span>Inspect Auth 2.0</span>
          </button>
        )}
      </div>
    </header>
  )
}

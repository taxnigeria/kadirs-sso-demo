import { Link } from 'react-router'
import { Sun, Moon, Code2, RotateCcw, User } from 'lucide-react'
import { useThemeStore } from '@/engine/theme-store'
import { useAuthEngine } from '@/engine/auth-engine'
import { useAdminEngine } from '@/engine/admin-engine'
import { useInspectorStore } from '@/engine/inspector-store'
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
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)
  const logoutAdmin = useAdminEngine((s) => s.logoutAdmin)

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md px-6 py-3.5 flex items-center justify-between transition-colors">
      {/* Left: Official KD Seal + Org Heading */}
      <div className="flex items-center gap-3.5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-[30px] h-[30px] rounded-full border-[1.5px] border-[var(--green)] flex items-center justify-center text-[var(--green)] font-sans font-semibold text-xs tracking-tight">
            KD
          </div>
          <div>
            <div className="font-sans font-semibold text-[16px] leading-tight text-[var(--ink)] tracking-tight">
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
            <span className={`text-xs uppercase tracking-wider font-semibold ${portal.textColor || 'text-[var(--green)]'}`}>
              {portal.name}
            </span>
          </div>
        )}
      </div>

      {/* Center/Right: Navigation & User info */}
      <div className="flex items-center gap-2.5">

        {/* Current user pill if logged in */}
        {currentUser && (
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
                window.location.href = '/admin'
              }}
              className="ml-1 text-red-600 hover:text-red-700 text-[11px] font-semibold cursor-pointer hover:underline"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Light / Dark Mode"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] rounded-[var(--radius)] border border-[var(--line)] transition-colors cursor-pointer"
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
          className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--danger)] bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] rounded-[var(--radius)] border border-[var(--line)] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Technical Architecture Inspector Button */}
        <button
          type="button"
          onClick={() => useInspectorStore.getState().openInspector()}
          title="Open Technical Architecture Inspector (Alt+I)"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] hover:bg-[var(--line-soft)] transition-colors cursor-pointer shadow-2xs group"
        >
          <Code2 className="w-3.5 h-3.5 text-[var(--green)] group-hover:rotate-12 transition-transform" />
          <span>Inspect Auth 2.0</span>
        </button>
      </div>
    </header>
  )
}

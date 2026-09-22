import { Link, useLocation } from 'react-router'
import { useAuthEngine } from '@/engine/auth-engine'
import { type PortalConfig } from './portal-branding'
import { ChevronRight } from 'lucide-react'

interface SidebarProps {
  portal: PortalConfig
}

export function Sidebar({ portal }: SidebarProps) {
  const location = useLocation()
  const currentUser = useAuthEngine((s) => s.currentUser)

  if (portal.navItems.length === 0) return null

  return (
    <aside className="w-60 shrink-0 h-full border-r border-[var(--line)] bg-[var(--paper)] flex flex-col transition-colors overflow-hidden">
      {/* Portal info */}
      <div className="p-4 border-b border-[var(--line)] shrink-0">
        <p className="font-serif font-semibold text-sm text-[var(--ink)]">
          {portal.name}
        </p>
        <p className="text-[11.5px] text-[var(--ink-soft)] mt-0.5 leading-snug">
          {portal.description}
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {portal.navItems
          .filter((item) => item.path !== '/auth/profile' || Boolean(currentUser))
          .map((item) => {
            const isActive = location.pathname === item.path
            const NavIcon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--green)] text-white font-semibold'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line-soft)]'
                }`}
              >
                <NavIcon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-80" />}
              </Link>
            )
          })}
      </nav>

      {/* Cross-portal navigation */}
      <div className="p-4 border-t border-[var(--line)] shrink-0">
        <p className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider mb-2">
          Connected State Services
        </p>
        <div className="space-y-1.5">
          {portal.id !== 'paykaduna' && (
            <Link
              to="/paykaduna"
              className="block text-xs text-[var(--ink-soft)] hover:text-[var(--green)] transition-colors"
            >
              &rarr; PayKaduna Dashboard
            </Link>
          )}
          {portal.id !== 'kadvreg' && (
            <Link
              to="/kadvreg"
              className="block text-xs text-[var(--ink-soft)] hover:text-[var(--green)] transition-colors"
            >
              &rarr; KADVREG Vehicles
            </Link>
          )}
          {portal.id !== 'pit' && (
            <Link
              to="/pit"
              className="block text-xs text-[var(--ink-soft)] hover:text-[var(--green)] transition-colors"
            >
              &rarr; Personal Income Tax
            </Link>
          )}
          {portal.id !== 'admin' && (
            <Link
              to="/admin/dashboard"
              className="block text-xs text-[var(--ink-soft)] hover:text-[var(--gold)] transition-colors pt-1 border-t border-[var(--line-soft)]"
            >
              &rarr; KADIRS Admin Console
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}

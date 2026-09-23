import { Link, useLocation } from 'react-router'
import { useAuthEngine } from '@/engine/auth-engine'
import { useAdminEngine } from '@/engine/admin-engine'
import { type PortalConfig } from './portal-branding'
import { ChevronRight, X } from 'lucide-react'

interface SidebarProps {
  portal: PortalConfig
  isOpenOnMobile?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({ portal, isOpenOnMobile, onCloseMobile }: SidebarProps) {
  const location = useLocation()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const makerCheckerItems = useAdminEngine((s) => s.makerCheckerItems)
  const pendingApprovalsCount = makerCheckerItems.filter((i) => i.status === 'pending').length

  if (portal.navItems.length === 0) return null

  const navContent = (onItemClick?: () => void) => (
    <nav className="p-3 space-y-1 overflow-y-auto">
      {portal.navItems
        .filter((item) => item.path !== '/auth/profile' || Boolean(currentUser))
        .map((item) => {
          const isActive = location.pathname === item.path
          const NavIcon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-xs transition-colors ${
                isActive
                  ? `${portal.color ? portal.color : 'bg-[var(--green)]'} text-white shadow-2xs font-semibold`
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line-soft)] font-medium'
              }`}
            >
              <NavIcon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.path === '/admin/approvals' && pendingApprovalsCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {pendingApprovalsCount}
                </span>
              )}
              {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-90" />}
            </Link>
          )
        })}
    </nav>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar (No duplicate header, no connected services block) */}
      <aside className="hidden md:flex w-60 shrink-0 h-full border-r border-[var(--line)] bg-[var(--paper)] flex-col transition-colors overflow-hidden">
        {navContent()}
      </aside>

      {/* Mobile Collapsible Slide-Over Drawer */}
      {isOpenOnMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-150"
        >
          <aside className="w-64 max-w-[80vw] h-full bg-[var(--paper)] border-r border-[var(--line)] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header with Close Button */}
            <div className="p-3.5 border-b border-[var(--line)] flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider">
                Navigation Menu
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list with auto-close on selection */}
            <div className="flex-1 overflow-y-auto">
              {navContent(onCloseMobile)}
            </div>
          </aside>

          {/* Backdrop dismiss click area */}
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  )
}

import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Topbar } from './topbar'
import { Sidebar } from './sidebar'
import { UniversalNavbar } from './universal-navbar'
import { type PortalConfig } from './portal-branding'
import { useAuthEngine } from '@/engine/auth-engine'

interface PortalShellProps {
  portal: PortalConfig
  noSidebar?: boolean
  children?: React.ReactNode
}

export function PortalShell({ portal, noSidebar, children }: PortalShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const location = useLocation()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const currentTspContext = useAuthEngine((s) => s.currentTspContext)
  const switchTspContext = useAuthEngine((s) => s.switchTspContext)

  // Auto-close mobile navigation on route change
  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location.pathname])

  // SSO Context Manager: Automatically exchange scoped audience token when entering TSP portal
  useEffect(() => {
    if (
      currentUser &&
      portal.id !== 'home' &&
      portal.id !== 'auth' &&
      portal.id !== 'admin' &&
      currentTspContext !== portal.id
    ) {
      switchTspContext(portal.id)
    }
  }, [currentUser, portal.id, currentTspContext, switchTspContext])

  const hasSidebar = !noSidebar && portal.navItems.length > 0

  // Public / Auth Standalone Layout: Use UniversalNavbar
  if (noSidebar || portal.id === 'auth') {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)] transition-colors w-full max-w-full">
        <UniversalNavbar />
        <main className="flex-1 w-full max-w-full">
          {children ?? <Outlet />}
        </main>
      </div>
    )
  }

  // Authenticated Portal Layout: Standard topbar + sidebar
  return (
    <div className="h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)] transition-colors overflow-hidden w-full max-w-full">
      <Topbar
        portal={portal}
        hasSidebar={hasSidebar}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden w-full max-w-full">
        {hasSidebar && (
          <Sidebar
            portal={portal}
            isOpenOnMobile={isMobileNavOpen}
            onCloseMobile={() => setIsMobileNavOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 w-full max-w-full">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}


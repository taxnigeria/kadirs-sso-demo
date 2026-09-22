import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { Topbar } from './topbar'
import { Sidebar } from './sidebar'
import { type PortalConfig } from './portal-branding'
import { useAuthEngine } from '@/engine/auth-engine'

interface PortalShellProps {
  portal: PortalConfig
  noSidebar?: boolean
  children?: React.ReactNode
}

export function PortalShell({ portal, noSidebar, children }: PortalShellProps) {
  const currentUser = useAuthEngine((s) => s.currentUser)
  const currentTspContext = useAuthEngine((s) => s.currentTspContext)
  const switchTspContext = useAuthEngine((s) => s.switchTspContext)

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

  return (
    <div className="h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)] transition-colors overflow-hidden">
      <Topbar portal={portal} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!noSidebar && <Sidebar portal={portal} />}
        <main className="flex-1 overflow-y-auto min-h-0">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}

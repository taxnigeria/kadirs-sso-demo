import { Navigate, useLocation } from 'react-router'
import { useAuthEngine } from '@/engine/auth-engine'

interface RequireAuthProps {
  children: React.ReactNode
}

/**
 * Route guard component.
 * Redirects unauthenticated users to /auth/login with a redirect query param.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthEngine((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Preserve the intended target route so we can redirect back after login
    const target = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth/login?redirect=${target}`} replace />
  }

  return <>{children}</>
}

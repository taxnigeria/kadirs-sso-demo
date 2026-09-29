import { Navigate, useLocation, useSearchParams } from 'react-router'
import { useAuthEngine } from '@/engine/auth-engine'
import { DEMO_PERSONAS } from '@/data/personas'

interface RequireAuthProps {
  children: React.ReactNode
}

/**
 * Route guard component.
 * Redirects unauthenticated users to /auth/login with a redirect query param,
 * but gracefully preserves and rehydrates authenticated partner sessions (e.g. from Kad Tax on Rent).
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthEngine((s) => s.isAuthenticated)
  const currentUser = useAuthEngine((s) => s.currentUser)
  const loginAsPersona = useAuthEngine((s) => s.loginAsPersona)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const returnUrl = searchParams.get('return_url')
  const citizenIdParam = searchParams.get('citizen_id') || searchParams.get('citizenId')
  const personaParam = searchParams.get('persona') || searchParams.get('persona_id') || searchParams.get('personaId')
  const emailParam = searchParams.get('email')

  // 1. If explicit persona requested via query params, activate that persona
  if (personaParam) {
    const match = DEMO_PERSONAS.find((p) => p.id === personaParam)
    if (match && currentUser?.citizenId !== match.profile.citizenId) {
      loginAsPersona(match.id)
      return <>{children}</>
    }
  }

  // 2. If explicit citizenId requested via query params (e.g. from Kad Tax on Rent modal)
  if (citizenIdParam) {
    const match = DEMO_PERSONAS.find(
      (p) => p.profile.citizenId.toLowerCase() === citizenIdParam.toLowerCase()
    )
    if (match && currentUser?.citizenId !== match.profile.citizenId) {
      loginAsPersona(match.id)
      return <>{children}</>
    }
  }

  // 3. If explicit email requested
  if (emailParam) {
    const match = DEMO_PERSONAS.find(
      (p) => p.profile.email.toLowerCase() === emailParam.toLowerCase()
    )
    if (match && currentUser?.citizenId !== match.profile.citizenId) {
      loginAsPersona(match.id)
      return <>{children}</>
    }
  }

  // 4. If arriving from an authorized partner TSP with return_url and no active session,
  // restore demo persona (Amina Yusuf) so the taxpayer lands directly on the profile management page!
  if (!isAuthenticated || !currentUser) {
    if (returnUrl) {
      const fallbackPersona = DEMO_PERSONAS.find((p) => p.id === 'amina') || DEMO_PERSONAS[0]
      loginAsPersona(fallbackPersona.id)
      return <>{children}</>
    }

    // Preserve the intended target route so we can redirect back after login
    const target = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth/login?redirect=${target}`} replace />
  }

  return <>{children}</>
}

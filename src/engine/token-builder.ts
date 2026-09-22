import type { TokenPayload, PersonaType } from '../types'

export interface BuiltToken {
  raw: string              // Base64-encoded "header.payload.signature" string
  header: Record<string, string>
  payload: TokenPayload
  signature: string
}

/**
 * Base64URL encoder helper
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Builds a realistic RS256-signed JWT token scoped to a specific TSP.
 * CRITICAL INVARIANT: NIN is NEVER permitted in any claim.
 */
export function buildToken(params: {
  citizenId: string
  tspId: string
  scopes: string[]
  personaType?: PersonaType
  authMethods?: string[]
  assuranceLevel?: '1' | '2' | '3'
  consentRef?: string
}): BuiltToken {
  const {
    citizenId,
    tspId,
    scopes,
    personaType = 'individual',
    authMethods = ['pwd', 'sms_otp'],
    assuranceLevel = '2',
    consentRef = `CNS-${Date.now().toString(36).toUpperCase()}`
  } = params

  // Safety Assertion: Ensure citizenId is NEVER a raw 11-digit NIN
  if (/^\d{11}$/.test(citizenId)) {
    throw new Error('SECURITY VIOLATION: Raw NIN cannot be used as token subject (sub)!')
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'kadirs-auth-2024-q3-key'
  }

  const payload: TokenPayload = {
    sub: citizenId,
    aud: tspId,
    scope: scopes.join(' '),
    persona_type: personaType,
    acr: assuranceLevel,
    amr: authMethods,
    jti: `tok_${Math.random().toString(36).substring(2, 12)}`,
    iat: nowSeconds,
    exp: nowSeconds + 15 * 60, // 15-minute access token lifetime as required by spec
    consent_ref: consentRef
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  
  // Realistic simulated RS256 signature
  const mockSignaturePart = base64UrlEncode(
    `sig_rs256_kadirs_${tspId}_${citizenId}_${nowSeconds}`
  ) + 'x9QeF_7mK1'

  const raw = `${encodedHeader}.${encodedPayload}.${mockSignaturePart}`

  return {
    raw,
    header,
    payload,
    signature: mockSignaturePart
  }
}

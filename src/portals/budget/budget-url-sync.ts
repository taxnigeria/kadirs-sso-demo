import type { BudgetItem, Currency } from './budget-types'

export interface BudgetDelta {
  p?: Record<string, number> // item ID -> custom unitRateNgn
  q?: Record<string, number> // item ID -> custom quantity
  u?: Record<string, string> // item ID -> custom unitLabel
  mMonths?: Record<string, number> // item ID -> custom periodMonths
  d?: string[]               // disabled item IDs
  a?: BudgetItem[]           // custom added items
  mau?: number               // Monthly Active Users
  c?: Currency               // 'NGN' | 'USD'
  r?: number                 // FX Rate
  s?: string                 // scenario ID
  t?: string                 // budget title
  as?: {                     // assumptions overrides
    lpu?: number
    otp?: number
    reg?: number
    months?: number
    devMonths?: number
    cont?: number
  }
}


function toBase64Url(str: string): string {
  try {
    const base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16))
    }))
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch {
    return ''
  }
}

function fromBase64Url(base64Url: string): string {
  try {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    const binary = atob(base64)
    const bytes = Array.from(binary, (char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
    return decodeURIComponent(bytes.join(''))
  } catch {
    return ''
  }
}

/**
 * Serialize a budget delta into a compact URL query string parameter
 */
export function serializeBudgetDelta(delta: BudgetDelta): string {
  const json = JSON.stringify(delta)
  return toBase64Url(json)
}

/**
 * Parse a budget delta from a URL search string or param
 */
export function deserializeBudgetDelta(searchOrParam: string): BudgetDelta | null {
  try {
    let token = searchOrParam.trim()
    if (token.includes('?')) {
      const params = new URLSearchParams(token.slice(token.indexOf('?')))
      token = params.get('b') || ''
    } else if (token.startsWith('b=')) {
      token = token.slice(2)
    }

    if (!token) return null

    const json = fromBase64Url(token)
    if (!json) return null

    return JSON.parse(json) as BudgetDelta
  } catch {
    return null
  }
}

/**
 * Build a full canonical shareable URL with the delta
 */
export function buildShareableUrl(delta: BudgetDelta): string {
  const token = serializeBudgetDelta(delta)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://auth.kadirs.kdsg.gov.ng'
  const baseUrl = `${origin}/budget`
  return token ? `${baseUrl}?b=${token}` : baseUrl
}

/**
 * Build relative URL with delta query param for safe replaceState
 */
export function buildRelativeUrl(delta: BudgetDelta): string {
  const token = serializeBudgetDelta(delta)
  return token ? `/budget?b=${token}` : '/budget'
}


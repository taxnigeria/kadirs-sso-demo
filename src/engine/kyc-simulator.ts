import { DEMO_PERSONAS } from '../data/personas'

export interface NIMCVerificationResponse {
  success: boolean
  legalName: string
  dateOfBirth: string
  gender: 'male' | 'female'
  photoUrl: string
  vnin: string
  registeredPhone: string
  provider: 'Dojah (NIMC Authorised)' | 'Prembly (Fallback)'
  verifiedAt: string
  error?: string
}

export interface CACLookupResponse {
  success: boolean
  rcNumber: string
  companyName: string
  tin: string
  status: 'active' | 'inactive' | 'dissolved'
  industry: string
  directors: string[]
  registeredAddress: string
  provider: 'Dojah CAC Lookup' | 'NIBSS-CAC'
  error?: string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Masks a Nigerian mobile number, strictly revealing the first 4 and last 3 digits.
 * e.g., '+234 814 555 1212' or '08145551212' -> '0814 •••• 212'
 */
export function maskNIMCPhone(phone: string): string {
  if (!phone) return ''
  const rawDigits = phone.replace(/\D/g, '')
  const digits = rawDigits.startsWith('234') ? '0' + rawDigits.slice(3) : rawDigits
  if (digits.length >= 7) {
    const first4 = digits.slice(0, 4)
    const last3 = digits.slice(-3)
    return `${first4} •••• ${last3}`
  }
  if (phone.length >= 7) {
    return `${phone.slice(0, 4)} •••• ${phone.slice(-3)}`
  }
  return phone
}

/**
 * Simulates asynchronous NIMC Verification via Dojah/Prembly
 * Validates 11-digit NIN or 16-character vNIN with authentic Nigerian latency.
 */
export async function verifyNINWithNIMC(input: string): Promise<NIMCVerificationResponse> {
  const cleanInput = input.replace(/\s+/g, '')
  
  // Simulate 1.2 - 2.0s network trip to Dojah / NIMC gateway
  await delay(1400)

  if (cleanInput.length !== 11 && cleanInput.length !== 16) {
    throw new Error('NIN must be an 11-digit number or 16-character virtual NIN (vNIN)')
  }

  // Check if matching any pre-seeded demo persona
  const persona = DEMO_PERSONAS.find((p) => p.identity.nin === cleanInput)

  if (persona) {
    return {
      success: true,
      legalName: persona.identity.legalName,
      dateOfBirth: persona.identity.dateOfBirth,
      gender: persona.identity.gender,
      photoUrl: persona.identity.photoUrl,
      vnin: `VNIN-${cleanInput.slice(0, 4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-KAD`,
      registeredPhone: persona.profile.phone,
      provider: 'Dojah (NIMC Authorised)',
      verifiedAt: new Date().toISOString()
    }
  }

  // Synthesize realistic verified Nigerian citizen data if random 11-digit NIN or 16-char vNIN is tested
  // Generate deterministic seed from cleanInput to ensure reproducible, valid, non-NaN attributes
  let seed = 0
  for (let i = 0; i < cleanInput.length; i++) {
    seed = (seed * 31 + cleanInput.charCodeAt(i)) >>> 0
  }

  const digits = cleanInput.replace(/\D/g, '')
  const randomFirstNames = ['Abubakar', 'Zainab', 'Mohammed', 'Grace', 'Usman', 'Bello', 'Khadija', 'Sunday']
  const randomLastNames = ['Sani', 'Garba', 'Shehu', 'Yakubu', 'Danjuma', 'Ali', 'Audu', 'Liman']
  
  const firstName = randomFirstNames[seed % randomFirstNames.length]
  const lastName = randomLastNames[(seed >>> 3) % randomLastNames.length]
  const randomGender: 'male' | 'female' = seed % 2 === 0 ? 'female' : 'male'

  const synthPrefixes = ['0803', '0806', '0814', '0802', '0805', '0703', '0901', '0812']
  const prefixIndex = digits.length >= 2
    ? Math.abs(parseInt(digits.slice(0, 2), 10) || seed) % synthPrefixes.length
    : seed % synthPrefixes.length
  const prefix = synthPrefixes[prefixIndex]

  const midNum = digits.length >= 5
    ? Math.abs(parseInt(digits.slice(2, 5), 10) || 0) % 900
    : (seed % 900)
  const phoneMid = String(100 + midNum).padStart(3, '0')

  const endNum = digits.length >= 9
    ? Math.abs(parseInt(digits.slice(5, 9), 10) || 0) % 9000
    : ((seed >>> 4) % 9000)
  const phoneEnd = String(1000 + endNum).padStart(4, '0')

  const synthPhone = `${prefix} ${phoneMid} ${phoneEnd}`

  const birthYear = 1970 + (seed % 32)
  const birthMonth = String(1 + ((seed >>> 5) % 12)).padStart(2, '0')
  const birthDay = String(1 + ((seed >>> 9) % 28)).padStart(2, '0')
  const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`

  return {
    success: true,
    legalName: `${firstName} ${lastName}`,
    dateOfBirth,
    gender: randomGender,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    vnin: `VNIN-${cleanInput.slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-KAD`,
    registeredPhone: synthPhone,
    provider: 'Dojah (NIMC Authorised)',
    verifiedAt: new Date().toISOString()
  }
}

/**
 * Simulates CAC Registry Lookup via Dojah CAC / NIBSS-CAC
 */
export async function lookupCAC(rcInput: string): Promise<CACLookupResponse> {
  const cleanRC = rcInput.trim().toUpperCase()
  
  // Realistic CAC query delay (1.5 - 2.5s)
  await delay(1600)

  // Match Amara Holdings or pre-seeded company
  const matchedPersona = DEMO_PERSONAS.find((p) => p.corporate?.rcNumber === cleanRC)
  if (matchedPersona && matchedPersona.corporate) {
    const corp = matchedPersona.corporate
    return {
      success: true,
      rcNumber: corp.rcNumber,
      companyName: corp.companyName,
      tin: corp.tin,
      status: corp.status,
      industry: corp.industry || 'Logistics & Distribution',
      directors: corp.directors,
      registeredAddress: 'Plot 7 Ali Akilu Road, Kaduna, Kaduna State',
      provider: 'Dojah CAC Lookup'
    }
  }

  // Synthesize corporate response
  const numPart = cleanRC.replace(/\D/g, '') || '1029384'
  const companySuffixes = ['Enterprises', 'Ventures', 'Integrated Services', 'Consulting']
  const suffixIndex = Math.abs(parseInt(numPart[0] || '1', 10) || 0) % companySuffixes.length
  return {
    success: true,
    rcNumber: `RC-${numPart}`,
    companyName: `Kaduna Prime ${companySuffixes[suffixIndex]} Ltd`,
    tin: `24${numPart.slice(0, 6).padEnd(6, '0')}-0001`,
    status: 'active',
    industry: 'Commercial Trade & Services',
    directors: ['Malam Haruna Bello', 'Hajiya Maryam Idris'],
    registeredAddress: 'Constitution Road, Kaduna Central, Kaduna State',
    provider: 'Dojah CAC Lookup'
  }
}

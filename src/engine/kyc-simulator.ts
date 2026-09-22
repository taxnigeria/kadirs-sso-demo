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

  // Synthesize realistic verified Nigerian citizen data if random 11-digit NIN is tested
  const randomFirstNames = ['Abubakar', 'Zainab', 'Mohammed', 'Grace', 'Usman', 'Bello', 'Khadija', 'Sunday']
  const randomLastNames = ['Sani', 'Garba', 'Shehu', 'Yakubu', 'Danjuma', 'Ali', 'Audu', 'Liman']
  const randomGender: 'male' | 'female' = parseInt(cleanInput[cleanInput.length - 1], 10) % 2 === 0 ? 'female' : 'male'
  const firstName = randomFirstNames[parseInt(cleanInput[0], 10) % randomFirstNames.length]
  const lastName = randomLastNames[parseInt(cleanInput[1], 10) % randomLastNames.length]

  const synthPrefixes = ['0803', '0806', '0814', '0802', '0805', '0703', '0901', '0812']
  const prefix = synthPrefixes[parseInt(cleanInput.slice(0, 2), 10) % synthPrefixes.length]
  const phoneMid = String(100 + (parseInt(cleanInput.slice(2, 5), 10) % 900))
  const phoneEnd = String(1000 + (parseInt(cleanInput.slice(5, 9), 10) % 9000))
  const synthPhone = `${prefix} ${phoneMid} ${phoneEnd}`

  return {
    success: true,
    legalName: `${firstName} ${lastName}`,
    dateOfBirth: `19${75 + (parseInt(cleanInput[2], 10) % 25)}-0${1 + (parseInt(cleanInput[3], 10) % 9)}-15`,
    gender: randomGender,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    vnin: `VNIN-${cleanInput.slice(0, 4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-KAD`,
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
  return {
    success: true,
    rcNumber: `RC-${numPart}`,
    companyName: `Kaduna Prime ${['Enterprises', 'Ventures', 'Integrated Services', 'Consulting'][parseInt(numPart[0], 10) % 4]} Ltd`,
    tin: `24${numPart.slice(0, 6)}-0001`,
    status: 'active',
    industry: 'Commercial Trade & Services',
    directors: ['Malam Haruna Bello', 'Hajiya Maryam Idris'],
    registeredAddress: 'Constitution Road, Kaduna Central, Kaduna State',
    provider: 'Dojah CAC Lookup'
  }
}

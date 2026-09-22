import type { CitizenProfile, IdentityRecord } from '../types'

export interface KnownAttribute {
  key: string
  label: string
  value: string
  isVerified: boolean
  source: 'NIMC' | 'Central Profile' | 'KADIRS Database'
}

export interface MissingAttribute {
  key: keyof CitizenProfile
  label: string
  description: string
  required: boolean
  category: 'tax_identity' | 'employment' | 'revenue'
}

export interface ProfileGapResult {
  hasGaps: boolean
  targetTsp: string
  targetTspName: string
  knownFields: KnownAttribute[]
  missingFields: MissingAttribute[]
  completenessScore: number
}

// Scoped profile requirements per Tax Service Provider
export const TSP_DATA_REQUIREMENTS: Record<
  string,
  { name: string; requiredKeys: (keyof CitizenProfile)[] }
> = {
  pit: {
    name: 'Personal Income Tax Portal (PIT)',
    requiredKeys: ['tin', 'employmentType', 'employerName']
  },
  kadvreg: {
    name: 'KADVREG Vehicle Administration',
    requiredKeys: ['phone', 'taxOffice']
  },
  paykaduna: {
    name: 'PayKaduna Revenue Portal',
    requiredKeys: ['email', 'phone', 'lga']
  }
}

/**
 * Deterministically or pseudo-randomly generate a realistic Kaduna State Tax Identification Number (State TIN)
 */
export function generateKadunaTIN(citizenId?: string): string {
  if (citizenId) {
    // Generate deterministic 8-digit numeric from citizen ID suffix
    const numericPart = citizenId.replace(/\D/g, '').padEnd(6, '7')
    return `TIN-KD-2024-${numericPart.slice(-6)}`
  }
  const randomSuffix = Math.floor(100000 + Math.random() * 900000)
  return `TIN-KD-2024-${randomSuffix}`
}

/**
 * Analyzes gaps between a citizen's Layer 2 profile and a TSP's statutory data requirements.
 * Enforces the NDPA principle: Citizens never re-supply attributes already captured and verified.
 */
export function analyzeProfileGaps(
  profile: CitizenProfile | null,
  identity: IdentityRecord | null,
  targetTsp: string = 'pit'
): ProfileGapResult {
  const tspConfig = TSP_DATA_REQUIREMENTS[targetTsp] || {
    name: 'Kaduna State Revenue Service',
    requiredKeys: []
  }

  const knownFields: KnownAttribute[] = []
  const missingFields: MissingAttribute[] = []

  // Collect verified identity (Layer 1)
  if (identity) {
    if (identity.legalName) {
      knownFields.push({
        key: 'legalName',
        label: 'Full Legal Name',
        value: identity.legalName,
        isVerified: true,
        source: 'NIMC'
      })
    }
    if (identity.nin) {
      const maskedNIN = `${identity.nin.slice(0, 3)}•••••${identity.nin.slice(-3)}`
      knownFields.push({
        key: 'nin',
        label: 'National Identity Number',
        value: maskedNIN,
        isVerified: true,
        source: 'NIMC'
      })
    }
    if (identity.dateOfBirth) {
      knownFields.push({
        key: 'dateOfBirth',
        label: 'Date of Birth',
        value: identity.dateOfBirth,
        isVerified: true,
        source: 'NIMC'
      })
    }
  }

  // Collect central profile (Layer 2)
  if (profile) {
    if (profile.email) {
      knownFields.push({
        key: 'email',
        label: 'Registered Email',
        value: profile.email,
        isVerified: true,
        source: 'Central Profile'
      })
    }
    if (profile.phone) {
      knownFields.push({
        key: 'phone',
        label: 'Mobile Phone',
        value: profile.phone,
        isVerified: true,
        source: 'Central Profile'
      })
    }
    if (profile.taxOffice) {
      knownFields.push({
        key: 'taxOffice',
        label: 'Assigned Tax Jurisdiction',
        value: profile.taxOffice,
        isVerified: true,
        source: 'KADIRS Database'
      })
    }
    if (profile.lga) {
      knownFields.push({
        key: 'lga',
        label: 'Local Government Area (LGA)',
        value: profile.lga,
        isVerified: true,
        source: 'Central Profile'
      })
    }

    // Check TSP required keys
    for (const key of tspConfig.requiredKeys) {
      const value = profile[key]
      if (value && typeof value === 'string' && value.trim().length > 0) {
        let label = key.toUpperCase()
        if (key === 'tin') label = 'State Tax Identification Number (TIN)'
        if (key === 'employmentType') label = 'Employment Status'
        if (key === 'employerName') label = 'Employer / Organization'

        knownFields.push({
          key,
          label,
          value: String(value),
          isVerified: true,
          source: 'KADIRS Database'
        })
      } else {
        if (key === 'tin') {
          missingFields.push({
            key: 'tin',
            label: 'State Tax Identification Number (TIN)',
            description: 'Required by Kaduna State Internal Revenue Service to open individual PIT assessment ledger.',
            required: true,
            category: 'tax_identity'
          })
        } else if (key === 'employmentType') {
          missingFields.push({
            key: 'employmentType',
            label: 'Employment Classification',
            description: 'Determines whether assessment is PAYE (withheld by employer) or Direct Assessment (self-employed).',
            required: true,
            category: 'employment'
          })
        } else if (key === 'employerName') {
          missingFields.push({
            key: 'employerName',
            label: 'Employer / Business Organization',
            description: 'Name of the paying establishment, ministry, or registered business name.',
            required: true,
            category: 'employment'
          })
        }
      }
    }
  }

  const totalRequired = knownFields.length + missingFields.length
  const completenessScore = totalRequired > 0 
    ? Math.round((knownFields.length / totalRequired) * 100) 
    : 100

  return {
    hasGaps: missingFields.length > 0,
    targetTsp,
    targetTspName: tspConfig.name,
    knownFields,
    missingFields,
    completenessScore
  }
}

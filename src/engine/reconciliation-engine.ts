import type { IdentityRecord, CitizenProfile, LegacyTspRecord } from '@/types'
import {
  PAYKADUNA_LEGACY_RECORDS,
  KADVREG_LEGACY_RECORDS,
  PIT_LEGACY_RECORDS
} from '@/data/tsp-legacy-databases'
import { useAuthEngine } from './auth-engine'
import { useEventLogger } from './event-logger'

export type MatchTier = 'tier_1_exact_nin' | 'tier_2_strong_fuzzy' | 'tier_3_conflict'

export interface ReconciliationCandidate {
  record: LegacyTspRecord
  matchTier: MatchTier
  confidenceScore: number // 0 to 100
  matchReasons: string[]
  tspName: string
  serviceIconName: string
  disputeReason?: string
}

/**
 * Calculates Levenshtein string similarity ratio between 0 and 1
 */
function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  if (longer.length === 0) return 1.0

  const longerLower = longer.toLowerCase().trim()
  const shorterLower = shorter.toLowerCase().trim()

  // Exact substring check
  if (longerLower.includes(shorterLower)) {
    return Math.max(0.75, shorterLower.length / longerLower.length)
  }

  // Cost matrix
  const costs: number[] = []
  for (let i = 0; i <= longerLower.length; i++) {
    let lastValue = i
    for (let j = 0; j <= shorterLower.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (longerLower.charAt(i - 1) !== shorterLower.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[shorterLower.length] = lastValue
  }

  return (longerLower.length - costs[shorterLower.length]) / longerLower.length
}

/**
 * Standardizes a Nigerian telephone number for matching
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length === 13) {
    return '0' + digits.slice(3)
  }
  return digits
}

/**
 * Evaluates candidate legacy records across all TSPs against a verified citizen identity
 */
export function findLegacyMatches(
  identity: IdentityRecord,
  profile: CitizenProfile
): ReconciliationCandidate[] {
  const allRecords: LegacyTspRecord[] = [
    ...PAYKADUNA_LEGACY_RECORDS,
    ...KADVREG_LEGACY_RECORDS,
    ...PIT_LEGACY_RECORDS
  ]

  const results: ReconciliationCandidate[] = []

  for (const rec of allRecords) {
    const reasons: string[] = []
    let score = 0
    let tier: MatchTier = 'tier_2_strong_fuzzy'

    // Case 1: Conflicting NIN detected on legacy record!
    if (rec.nin && rec.nin !== identity.nin) {
      // Conflicting NIN means this record explicitly belongs to a different NIN
      // Test case: Ibrahim Danladi (kadv-rec-202 vs pk-rec-103)
      const nameSim = stringSimilarity(rec.name, identity.legalName)
      if (nameSim > 0.6) {
        results.push({
          record: rec,
          matchTier: 'tier_3_conflict',
          confidenceScore: 30,
          matchReasons: [
            `Conflicting NIN: Record has ${rec.nin} vs verified ${identity.nin}`,
            `Name similarity is ${(nameSim * 100).toFixed(0)}%`
          ],
          tspName: rec.tspId === 'paykaduna' ? 'PayKaduna' : rec.tspId === 'kadvreg' ? 'KADVREG Vehicle' : 'PIT Portal',
          serviceIconName: rec.tspId === 'paykaduna' ? 'CreditCard' : rec.tspId === 'kadvreg' ? 'Car' : 'FileText',
          disputeReason: 'NIN mismatch detected. Golden Rule violation: Cannot bind conflicting NIN without administrative dispute resolution.'
        })
      }
      continue
    }

    // Case 2: Exact NIN match
    if (rec.nin && rec.nin === identity.nin) {
      reasons.push('Exact 11-digit NIN match (100% cryptographic anchor)')
      score = 100
      tier = 'tier_1_exact_nin'
    } else {
      // Case 3: Fuzzy matching (Record has NO NIN, e.g. KADVREG vehicle database)
      const nameSim = stringSimilarity(rec.name, identity.legalName)
      const emailPrefixCandidate = rec.email.split('@')[0].toLowerCase()
      const emailPrefixProfile = profile.email.split('@')[0].toLowerCase()
      const emailMatch = rec.email.toLowerCase() === profile.email.toLowerCase() || emailPrefixCandidate === emailPrefixProfile
      const phoneNormCandidate = normalizePhone(rec.phone)
      const phoneNormProfile = normalizePhone(profile.phone)
      const phoneMatch = phoneNormCandidate === phoneNormProfile || (phoneNormCandidate.length >= 8 && phoneNormProfile.endsWith(phoneNormCandidate.slice(-8)))

      if (nameSim >= 0.7) {
        reasons.push(`Name similarity ${(nameSim * 100).toFixed(0)}% ("${rec.name}" vs "${identity.legalName}")`)
        score += Math.round(nameSim * 60)
      }

      if (emailMatch) {
        reasons.push(`Email address matched (${rec.email})`)
        score += 30
      }

      if (phoneMatch) {
        reasons.push(`Registered telephone match (${rec.phone})`)
        score += 30
      }

      score = Math.min(95, score)
    }

    // Threshold to include candidate
    if (score >= 60 || tier === 'tier_1_exact_nin') {
      results.push({
        record: rec,
        matchTier: tier,
        confidenceScore: score,
        matchReasons: reasons,
        tspName: rec.tspId === 'paykaduna' ? 'PayKaduna' : rec.tspId === 'kadvreg' ? 'KADVREG Vehicle' : 'PIT Portal',
        serviceIconName: rec.tspId === 'paykaduna' ? 'CreditCard' : rec.tspId === 'kadvreg' ? 'Car' : 'FileText'
      })
    }
  }

  // Sort: Tier 1 first, then highest confidence
  return results.sort((a, b) => {
    if (a.matchTier === 'tier_1_exact_nin' && b.matchTier !== 'tier_1_exact_nin') return -1
    if (b.matchTier === 'tier_1_exact_nin' && a.matchTier !== 'tier_1_exact_nin') return 1
    return b.confidenceScore - a.confidenceScore
  })
}

/**
 * Reconciles and links a candidate legacy record to the active citizen identity
 */
export function executeReconciliation(
  candidate: ReconciliationCandidate,
  citizenId: string,
  citizenNin: string
): { success: boolean; message: string } {
  // Enforce Golden Rule
  if (candidate.matchTier === 'tier_3_conflict') {
    useEventLogger.getState().logEvent({
      category: 'admin',
      action: 'RECONCILIATION_CONFLICT_FLAGGED',
      actor: citizenId,
      tspId: candidate.record.tspId,
      details: {
        recordId: candidate.record.id,
        recordNin: candidate.record.nin,
        citizenNin,
        reason: 'Golden Rule violation prevented: Cannot bind conflicting NIN records'
      }
    })
    return {
      success: false,
      message: 'Conflicting NIN detected. Record has been escalated to KADIRS Administrative Dispute Board.'
    }
  }

  // Register link in Auth Engine
  useAuthEngine.getState().reconcileRecord(candidate.record.id)

  // Log NDPA Immutable Consent Event
  useEventLogger.getState().logConsent({
    citizenId,
    type: 'legacy_link_accept',
    tspId: candidate.record.tspId,
    policyVersion: 'v2.0-2024',
    granted: true,
    ipAddress: '102.89.44.19',
    deviceInfo: navigator.userAgent,
    consentedFields: ['legacyId', 'receipts', 'vehicleRecords', 'taxHistory']
  })

  // Log System Audit Event
  useEventLogger.getState().logEvent({
    category: 'auth',
    action: 'LEGACY_ACCOUNT_RECONCILED',
    actor: citizenId,
    tspId: candidate.record.tspId,
    details: {
      legacyRecordId: candidate.record.id,
      matchTier: candidate.matchTier,
      confidenceScore: candidate.confidenceScore,
      evidence: candidate.matchReasons,
      boundCitizenId: citizenId
    }
  })

  return {
    success: true,
    message: `Successfully linked ${candidate.tspName} record (${candidate.record.id}) to citizen identity.`
  }
}

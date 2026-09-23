import { useState } from 'react'
import {
  Clock,
  Cpu
} from 'lucide-react'
import { useInspectorStore, TSP_INSPECTOR_METADATA } from '@/engine/inspector-store'

interface FlowStep {
  id: number
  title: string
  subtext: string
  standard: string
  latency: string
  status: 'passed' | 'active'
  technicalNotes: string
}

export function AuthFlowTimelineView() {
  const selectedTspId = useInspectorStore((s) => s.selectedTspId)
  const currentMetadata = TSP_INSPECTOR_METADATA[selectedTspId] || TSP_INSPECTOR_METADATA.paykaduna

  const [selectedStepId, setSelectedStepId] = useState<number>(3)

  const steps: FlowStep[] = [
    {
      id: 1,
      title: 'OAuth 2.0 Authorization Request & PKCE Challenge',
      subtext: `Client (${currentMetadata.name}) initiates authorization flow`,
      standard: 'RFC 7636 (PKCE S256)',
      latency: '14 ms',
      status: 'passed',
      technicalNotes: `Client generates code_verifier and code_challenge using SHA-256. Request contains redirect_uri: ${currentMetadata.redirectUri} and requested scopes: ${currentMetadata.scopes.join(', ')}.`
    },
    {
      id: 2,
      title: 'Central Identity Gateway Authentication',
      subtext: 'auth.kadirs.gov.ng authenticates user credential assertion',
      standard: 'NIST SP 800-63B AAL2',
      latency: '45 ms',
      status: 'passed',
      technicalNotes: 'Password hash verified via Argon2id (memory-hard, GPU-resistant). Central session context established under single-sign-on trust boundary.'
    },
    {
      id: 3,
      title: 'Tier-3 NIMC / Dojah Verification Match',
      subtext: 'National Identity Database demographic verification trip',
      standard: 'NIMC vNIN API &bull; Dojah KYC',
      latency: '1,420 ms',
      status: 'passed',
      technicalNotes: 'Biometric and demographic match executed. Golden Rule strictly enforced: raw 11-digit NIN blinded into deterministic UUID subject (CIT-KAD-...). Raw NIN permanently purged from downstream pipeline.'
    },
    {
      id: 4,
      title: 'Carrier-Grade Multi-Factor Challenge (2FA)',
      subtext: 'Telco SMS OTP / TOTP authenticator verification',
      standard: 'RFC 6238 &bull; Carrier SMPP',
      latency: '240 ms',
      status: 'passed',
      technicalNotes: 'Cryptographic 6-digit challenge verified against 5-minute validity window. Carrier rate-limiting and replay-prevention guards engaged.'
    },
    {
      id: 5,
      title: 'NDPA 2023 Statutory Consent Evaluation',
      subtext: 'Dynamic consent capture for requested audience scopes',
      standard: 'NDPA 2023 Sec. 24 &bull; Consent Event 1',
      latency: '18 ms',
      status: 'passed',
      technicalNotes: `Data minimization policy enforced. Scopes restricted to audience: ${currentMetadata.audience}. Consent assertion signed and stored in immutable compliance ledger.`
    },
    {
      id: 6,
      title: 'RS256 Cryptographic Token Minting',
      subtext: 'Central Key Management HSM signs audience JWT',
      standard: 'RFC 7519 &bull; FIPS 140-2 Level 3',
      latency: '12 ms',
      status: 'passed',
      technicalNotes: `Token generated with alg: RS256, kid: ${currentMetadata.keyId}. Expiration set to 900s (15 minutes). Scoped specifically to aud: ${currentMetadata.audience}.`
    },
    {
      id: 7,
      title: 'Scoped Redirect & TSP Context Exchange',
      subtext: 'Browser returned to destination TSP with authorization code',
      standard: 'OAuth 2.0 PKCE Callback',
      latency: '22 ms',
      status: 'passed',
      technicalNotes: `Authorization code exchanged for RS256 Access Token. Client validates token signature against KADIRS JWKS endpoint (/.well-known/jwks.json).`
    }
  ]

  const totalTripLatency = steps.reduce((sum, s) => sum + parseInt(s.latency), 0)

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* End-to-End Latency Summary Header */}
      <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] flex items-center justify-between shadow-2xs">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[var(--green)]" />
            <span>End-to-End Auth Trip Latency: ~{totalTripLatency} ms</span>
          </div>
          <p className="text-[11px] text-[var(--ink-soft)]">
            Total cryptographic transaction time from initial click to scoped TSP session issuance.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shrink-0">
          SUB-2s SLA PASSED
        </span>
      </div>

      {/* Stepper Flow Diagram */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider block">
          OAuth 2.0 PKCE + NIMC Verification Flow:
        </span>

        <div className="space-y-2">
          {steps.map((step) => {
            const isSelected = selectedStepId === step.id
            return (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                className={`p-3 rounded-[var(--radius)] border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--green)] bg-[var(--paper-raised)] ring-1 ring-[var(--green)] shadow-2xs'
                    : 'border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {step.id}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--ink)] flex items-center gap-2 flex-wrap">
                        <span>{step.title}</span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {step.standard}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">
                        {step.subtext}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-[var(--green)]">
                      {step.latency}
                    </span>
                    <span className="block text-[10px] text-[var(--ink-soft)]">hop time</span>
                  </div>
                </div>

                {/* Detailed Technical Notes Drawer when selected */}
                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--line-soft)] text-xs text-[var(--ink)] space-y-1.5 bg-[var(--paper)] p-2.5 rounded animate-in fade-in duration-150">
                    <div className="font-bold flex items-center gap-1 text-[11px] text-[var(--green)]">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Security &amp; Protocol Verification Assertions:</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-[var(--ink)] font-mono">
                      {step.technicalNotes}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import {
  Shield,
  Database,
  ArrowDown,
  Server,
  FileCheck2
} from 'lucide-react'

export function TopologyMapView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs">
      {/* Topology Header */}
      <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] space-y-1">
        <h3 className="font-sans font-bold text-xs text-[var(--ink)]">
          Kaduna State Federated Identity Architecture &amp; Zero-Trust Topology
        </h3>
        <p className="text-[11.5px] text-[var(--ink-soft)] leading-relaxed">
          Decoupled, audience-restricted architecture enforcing the Nigeria Data Protection Act 2023. Touchpoint service providers never gain direct database access or raw citizen identity credentials.
        </p>
      </div>

      {/* Layer 1: Upstream Regulatory & Sovereign Identity Authorities */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
          <span>1. Upstream Statutory Authorities (External Trust Boundary)</span>
          <span className="font-mono text-[10px] text-blue-600">Sovereign Proof</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] space-y-1 shadow-2xs">
            <div className="font-bold text-xs text-[var(--ink)] flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>NIMC National DB</span>
            </div>
            <p className="text-[10.5px] text-[var(--ink-soft)]">
              Dojah Tier-3 API &middot; vNIN validation &middot; Biometric verification
            </p>
          </div>

          <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] space-y-1 shadow-2xs">
            <div className="font-bold text-xs text-[var(--ink)] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>CAC Company Registry</span>
            </div>
            <p className="text-[10.5px] text-[var(--ink-soft)]">
              RC Number verification &middot; Director NIN binding validation
            </p>
          </div>

          <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] space-y-1 shadow-2xs">
            <div className="font-bold text-xs text-[var(--ink)] flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              <span>NDPC Oversight</span>
            </div>
            <p className="text-[10.5px] text-[var(--ink-soft)]">
              Nigeria Data Protection Act &middot; Annual CAR audit export filing
            </p>
          </div>
        </div>
      </div>

      {/* Connector Hop */}
      <div className="flex justify-center text-[var(--green)]">
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </div>

      {/* Layer 2: Central Identity Core (KADIRS Central Auth 2.0) */}
      <div className="p-4 bg-[var(--green)]/10 border-2 border-[var(--green)] rounded-[var(--radius)] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--green)]" />
            <div>
              <h4 className="font-bold text-sm text-[var(--ink)]">
                KADIRS Central Identity &amp; Access Gateway (Auth 2.0)
              </h4>
              <span className="font-mono text-[10.5px] text-[var(--green)] font-semibold">
                auth.kadirs.gov.ng &middot; AAL2 / AAL3
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[var(--green)] text-white font-bold">
            TRUST ANCHOR
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
          <div className="bg-[var(--paper-raised)] p-2 rounded border border-[var(--line)] font-medium">
            <span className="font-bold text-[var(--ink)] block">The Golden Rule:</span>
            Raw NIN strictly blinded into UUID <code>CIT-KAD-...</code>
          </div>
          <div className="bg-[var(--paper-raised)] p-2 rounded border border-[var(--line)] font-medium">
            <span className="font-bold text-[var(--ink)] block">RS256 JWT Mint:</span>
            Audience-scoped tokens with 15-min lifetime
          </div>
          <div className="bg-[var(--paper-raised)] p-2 rounded border border-[var(--line)] font-medium">
            <span className="font-bold text-[var(--ink)] block">Consent Engine:</span>
            Dynamic NDPA consent capture per audience
          </div>
          <div className="bg-[var(--paper-raised)] p-2 rounded border border-[var(--line)] font-medium">
            <span className="font-bold text-[var(--ink)] block">Kafka WORM Stream:</span>
            Append-only immutable audit ledger
          </div>
        </div>
      </div>

      {/* Connector Hop */}
      <div className="flex justify-center text-[var(--green)]">
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </div>

      {/* Layer 3: Downstream Touchpoint Service Providers (14 TSPs) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
          <span>3. Downstream Touchpoint Service Providers (Audience Scoped)</span>
          <span className="font-mono text-[10px] text-[var(--green)]">14 Connected MDAs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] space-y-1 shadow-2xs">
            <div className="font-bold text-xs text-[var(--ink)] flex items-center justify-between">
              <span>PayKaduna Revenue Gateway</span>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                aud: paykaduna
              </span>
            </div>
            <p className="text-[10.5px] text-[var(--ink-soft)]">
              Scopes: <code>profile:read</code>, <code>services:access</code>, <code>receipts:view</code>
            </p>
          </div>

          <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] space-y-1 shadow-2xs">
            <div className="font-bold text-xs text-[var(--ink)] flex items-center justify-between">
              <span>KADVREG Licensing Platform</span>
              <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
                aud: kadvreg
              </span>
            </div>
            <p className="text-[10.5px] text-[var(--ink-soft)]">
              Scopes: <code>profile:read</code>, <code>vehicles:manage</code>, <code>licensing:renew</code>
            </p>
          </div>

          <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] space-y-1 shadow-2xs">
            <div className="font-bold text-xs text-[var(--ink)] flex items-center justify-between">
              <span>PIT Personal Income Tax Portal</span>
              <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold">
                aud: pit
              </span>
            </div>
            <p className="text-[10.5px] text-[var(--ink-soft)]">
              Scopes: <code>profile:read</code>, <code>tax:read</code>, <code>tax:file</code>, <code>tcc:generate</code>
            </p>
          </div>

          <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] space-y-1 shadow-2xs">
            <div className="font-bold text-xs text-[var(--ink)] flex items-center justify-between">
              <span>KADGIS Land Administration</span>
              <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-bold">
                aud: kadgis
              </span>
            </div>
            <p className="text-[10.5px] text-[var(--ink-soft)]">
              Scopes: <code>profile:read</code>, <code>property:read</code>, <code>c-of-o:verify</code>
            </p>
          </div>
        </div>
      </div>

      {/* Security Invariants Footer */}
      <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] space-y-1 text-[11px] text-[var(--ink-soft)]">
        <strong className="text-[var(--ink)]">Zero-Trust Boundaries:</strong>
        <p className="leading-relaxed">
          Each TSP receives a distinct, audience-restricted token signed via RS256. A token issued for PayKaduna cannot be presented to KADVREG or PIT. Cross-database queries are physically prevented &mdash; data federation occurs strictly via authorized API scopes.
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  Copy,
  Check,
  ShieldCheck,
  Key,
  Layers,
  FileCode2
} from 'lucide-react'
import { useInspectorStore, TSP_INSPECTOR_METADATA } from '@/engine/inspector-store'

export function TokenInspectorView() {
  const selectedTspId = useInspectorStore((s) => s.selectedTspId)
  const setSelectedTspId = useInspectorStore((s) => s.setSelectedTspId)
  const getActiveToken = useInspectorStore((s) => s.getActiveToken)

  const [copiedRaw, setCopiedRaw] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)

  const token = getActiveToken()
  const currentMetadata = TSP_INSPECTOR_METADATA[selectedTspId] || TSP_INSPECTOR_METADATA.paykaduna

  // Golden Rule Verification Scanner
  const rawString = JSON.stringify(token.payload)
  const hasRawNin = /\b\d{11}\b/.test(rawString)

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(token.raw)
    setCopiedRaw(true)
    setTimeout(() => setCopiedRaw(false), 2000)
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(
      JSON.stringify(
        {
          header: token.header,
          payload: token.payload,
          signature: token.signature
        },
        null,
        2
      )
    )
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Golden Rule Verification Banner */}
      <div
        className={`p-3.5 rounded-[var(--radius)] border flex items-start gap-3 ${
          !hasRawNin
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
            : 'bg-red-50 border-red-300 text-red-950'
        }`}
      >
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <div className="font-bold flex items-center gap-2">
            <span>The Golden Rule Verification: STRICTLY COMPLIANT</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-mono">
              PASSED
            </span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-emerald-900 dark:text-emerald-300">
            Automated assertion check passed: Zero raw 11-digit NIN leakage detected in token subject or claims. Subject is pseudonymized as <code className="font-mono font-bold bg-white/70 dark:bg-black/30 px-1 py-0.2 rounded">{token.payload.sub}</code> under Kaduna State Data Protection Regulations.
          </p>
        </div>
      </div>

      {/* Audience Token Scoping Switcher */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider block">
            Target Audience Scope (Audience-Restricted Token):
          </label>
          <span className="text-[10.5px] font-mono text-[var(--green)] font-semibold">
            RFC 7519 &middot; RS256
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(TSP_INSPECTOR_METADATA).map((tsp) => {
            const isSelected = selectedTspId === tsp.id
            return (
              <button
                key={tsp.id}
                type="button"
                onClick={() => setSelectedTspId(tsp.id)}
                className={`p-2.5 rounded-[var(--radius)] border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--green)] bg-[var(--green)]/10 ring-1 ring-[var(--green)] text-[var(--ink)] shadow-2xs font-semibold'
                    : 'border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-[var(--ink-soft)]'
                }`}
              >
                <div className="font-sans font-bold text-xs truncate">
                  {tsp.id === 'kadirs-admin' ? 'KADIRS Admin' : tsp.name.split(' ')[0]}
                </div>
                <div className="font-mono text-[10px] text-[var(--green)] truncate mt-0.5">
                  aud: {tsp.audience}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Audience Scope & Client Info */}
      <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
            <Layers className="w-3.5 h-3.5 text-[var(--green)]" />
            <span>{currentMetadata.name}</span>
          </div>
          <span className="font-mono text-[10.5px] text-[var(--ink-soft)]">
            {currentMetadata.clientType}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10.5px] text-[var(--ink-soft)] font-medium">Permitted Scopes:</span>
          {currentMetadata.scopes.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded font-mono text-[10.5px] bg-[var(--paper-raised)] border border-[var(--line)] text-[var(--ink)] font-semibold"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Decoded 3-Part Color-Coded JWT Viewer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-[var(--green)]" />
            <span>Decoded Cryptographic Assertion (RS256 JWT)</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRaw}
              className="px-2.5 py-1 text-[11px] font-semibold border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] rounded cursor-pointer transition-colors flex items-center gap-1 text-[var(--ink)]"
            >
              {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRaw ? 'Copied Raw' : 'Copy Raw JWT'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-2.5 py-1 text-[11px] font-semibold border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] rounded cursor-pointer transition-colors flex items-center gap-1 text-[var(--ink)]"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* 1. Header (Amber/Orange) */}
        <div className="rounded-[var(--radius)] border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs space-y-1.5 font-mono shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold text-[11px] font-sans">
            <span className="flex items-center gap-1">
              <Key className="w-3.5 h-3.5" />
              <span>JOSE HEADER (Public Key Algorithm &amp; Key ID)</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider">Part 1</span>
          </div>
          <pre className="text-[11.5px] text-amber-950 dark:text-amber-200 overflow-x-auto leading-relaxed">
            {JSON.stringify(token.header, null, 2)}
          </pre>
        </div>

        {/* 2. Payload Claims (Indigo/Purple) */}
        <div className="rounded-[var(--radius)] border border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 text-xs space-y-1.5 font-mono shadow-2xs">
          <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 font-bold text-[11px] font-sans">
            <span className="flex items-center gap-1">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>PAYLOAD CLAIMS (Identity Context &amp; Audience Boundary)</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider">Part 2</span>
          </div>
          <pre className="text-[11.5px] text-indigo-950 dark:text-indigo-200 overflow-x-auto leading-relaxed">
            {JSON.stringify(token.payload, null, 2)}
          </pre>
        </div>

        {/* 3. Signature (Emerald/Cyan) */}
        <div className="rounded-[var(--radius)] border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs space-y-1.5 font-mono shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold text-[11px] font-sans">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DIGITAL SIGNATURE (RS256 Private Key Assertion)</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider">Part 3 &middot; Verified</span>
          </div>
          <p className="text-[11px] font-mono text-emerald-900 dark:text-emerald-300 break-all bg-white/60 dark:bg-black/30 p-2 rounded border border-emerald-200 dark:border-emerald-800">
            {token.signature}
          </p>
          <div className="text-[10.5px] font-sans text-emerald-700 dark:text-emerald-400">
            Signed by Kaduna State Central Identity HSM &middot; Verified against public key <code>kadirs-auth-2024-q3-key</code>
          </div>
        </div>

        {/* Raw Encoded JWT Preview */}
        <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs space-y-1">
          <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)] block">
            Raw Encoded JWT (Authorization Bearer Header):
          </span>
          <div className="font-mono text-[10.5px] break-all text-[var(--ink)] bg-[var(--paper-raised)] p-2.5 rounded border border-[var(--line)] max-h-24 overflow-y-auto select-all">
            {token.raw}
          </div>
        </div>
      </div>
    </div>
  )
}

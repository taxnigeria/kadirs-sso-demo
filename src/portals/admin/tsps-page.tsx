import { useState } from 'react'
import {
  Layers,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'
import { AdminConsoleLayout } from './admin-console-layout'

export default function AdminTspsPage() {
  const tspClients = useAdminEngine((s) => s.tspClients)
  const rotateClientSecret = useAdminEngine((s) => s.rotateClientSecret)
  const updateTspScopes = useAdminEngine((s) => s.updateTspScopes)
  const registerTspClient = useAdminEngine((s) => s.registerTspClient)

  const [newSecretToast, setNewSecretToast] = useState<{ tspName: string; secret: string } | null>(null)

  const handleRotateSecret = (tspId: string, tspName: string) => {
    if (confirm(`Rotate OAuth client secret for ${tspName}? A 24-hour dual-secret grace period will be initiated.`)) {
      const newSec = rotateClientSecret(tspId)
      setNewSecretToast({ tspName, secret: newSec })
      setTimeout(() => setNewSecretToast(null), 10000)
    }
  }

  return (
    <AdminConsoleLayout>
      <div className="space-y-4">
        {/* Secret Rotation Toast Notification */}
        {newSecretToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-[var(--radius)] text-xs text-emerald-950 space-y-1 animate-in zoom-in-95">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>New OAuth Client Secret Generated for {newSecretToast.tspName}!</span>
            </div>
            <div className="font-mono bg-white p-2 rounded border border-emerald-200 text-xs font-bold text-slate-800 select-all">
              {newSecretToast.secret}
            </div>
            <p className="text-[11px] text-emerald-700">
              24-hour dual-secret grace period initiated. Copy this secret now &mdash; it will not be displayed again.
            </p>
          </div>
        )}

        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--green)]" />
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  Touchpoint Service Provider (TSP) OAuth Clients
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Governs RS256 audience restrictions, permitted data scopes, and zero-downtime secret rotations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const clientName = prompt('Enter new TSP client name:')
                if (!clientName) return
                const aud = prompt('Enter audience identifier (e.g. kadgis_v2):')
                if (!aud) return
                registerTspClient({
                  id: aud,
                  name: clientName,
                  audience: aud,
                  status: 'active',
                  registeredAt: new Date().toISOString(),
                  redirectUris: [`https://${aud}.kaduna.gov.ng/oauth/callback`],
                  activeScopes: ['profile:read', 'services:access']
                })
              }}
              className="px-3.5 py-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-[var(--radius)] cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              + Register New TSP Client
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tspClients.map((client) => (
              <div
                key={client.id}
                className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[var(--ink)]">{client.name}</h3>
                      <span className="font-mono text-[11px] text-[var(--green)] font-bold">
                        aud: {client.audience}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {client.status}
                    </span>
                  </div>

                  <div className="bg-[var(--paper-raised)] p-2.5 rounded border border-[var(--line)] font-mono text-[11px] space-y-1">
                    <div><strong className="text-[var(--ink-soft)]">Client Secret:</strong> {client.clientSecretMasked}</div>
                    <div><strong className="text-[var(--ink-soft)]">Last Rotated:</strong> {new Date(client.secretLastRotatedAt).toLocaleDateString()}</div>
                    {client.previousSecretExpiresAt && (
                      <div className="text-amber-700">
                        <strong>Dual Grace Active:</strong> expires in 24h
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)] block">Authorized Scopes:</span>
                    <div className="flex flex-wrap gap-1">
                      {client.activeScopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-0.5 rounded bg-[var(--paper-raised)] border border-[var(--line)] text-[10px] font-mono text-[var(--ink)]"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleRotateSecret(client.id, client.name)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rotate Secret (24h Grace)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newScopes = prompt('Enter comma-separated scopes:', client.activeScopes.join(', '))
                      if (newScopes) {
                        updateTspScopes(client.id, newScopes.split(',').map((s) => s.trim()))
                      }
                    }}
                    className="px-3 py-1.5 border border-[var(--line)] hover:bg-[var(--line-soft)] rounded text-xs font-medium cursor-pointer"
                  >
                    Edit Scopes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminConsoleLayout>
  )
}

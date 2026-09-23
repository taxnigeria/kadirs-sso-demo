import { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Search
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'
import { useEventLogger } from '@/engine/event-logger'
import { AdminConsoleLayout } from './admin-console-layout'

export default function AdminReportsPage() {
  const generateNdpaCarExport = useAdminEngine((s) => s.generateNdpaCarExport)
  const exportNdpaCarCsv = useAdminEngine((s) => s.exportNdpaCarCsv)
  const allEvents = useEventLogger((s) => s.events)

  const [auditSearch, setAuditSearch] = useState('')
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('all')
  const [inspectingEvent, setInspectingEvent] = useState<typeof allEvents[number] | null>(null)

  // Filtered Audit Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      const matchesCategory = auditCategoryFilter === 'all' || e.category === auditCategoryFilter
      const q = auditSearch.toLowerCase()
      const matchesSearch =
        e.action.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        (e.tspId && e.tspId.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [allEvents, auditCategoryFilter, auditSearch])

  const handleDownloadNdpaCar = () => {
    const csvContent = exportNdpaCarCsv()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `NDPA-CAR-KADIRS-2024-${Date.now().toString(36)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AdminConsoleLayout>
      <div className="space-y-5">
        {/* Statutory Reporting Action Bar */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-5 rounded-[var(--radius)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[var(--green)]" />
              <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                Statutory NDPA Compliance Audit Report (CAR) &mdash; Year 2024
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-[65ch] leading-relaxed">
              Mandatory annual compliance filing under Nigeria Data Protection Act 2023 due 31 March to the Nigeria Data Protection Commission (NDPC).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadNdpaCar}
              className="px-4 py-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-[var(--radius)] transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export NDPA CAR Report (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const data = generateNdpaCarExport()
                alert(`NDPA CAR JSON Payload:\n\n${JSON.stringify(data, null, 2)}`)
              }}
              className="px-3.5 py-2 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-xs font-semibold rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              Inspect JSON
            </button>
          </div>
        </div>

        {/* Audit Stream Controls */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--ink-soft)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit events by action, actor, or TSP..."
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase mr-1">Category:</span>
            {['all', 'admin', 'auth', 'consent', 'reconciliation', 'profile', 'security'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setAuditCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  auditCategoryFilter === cat
                    ? 'bg-[var(--ink)] text-white font-bold'
                    : 'bg-[var(--paper)] text-[var(--ink-soft)] border border-[var(--line)] hover:text-[var(--ink)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Immutable Audit Log Table */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] text-[10.5px] uppercase tracking-wider bg-[var(--paper)]">
                  <th className="py-2.5 px-4 font-semibold">Timestamp (UTC)</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">Actor</th>
                  <th className="py-2.5 px-4 font-semibold">Target TSP</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)] text-[var(--ink)] font-mono">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[var(--paper)]/50 transition-colors">
                    <td className="py-2.5 px-4 text-[11px] text-[var(--ink-soft)] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-300 text-slate-700">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-xs text-[var(--ink)] font-sans">
                      {evt.action}
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-[var(--green)] font-semibold truncate max-w-xs">
                      {evt.actor}
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-[var(--ink-soft)]">
                      {evt.tspId || 'central'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => setInspectingEvent(evt)}
                        className="text-xs text-[var(--green)] hover:underline font-semibold cursor-pointer"
                      >
                        View Details &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cryptographic Event Payload Inspection Modal */}
        {inspectingEvent && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--green)] font-bold">
                    {inspectingEvent.id} &middot; {inspectingEvent.category}
                  </span>
                  <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
                    {inspectingEvent.action}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingEvent(null)}
                  className="text-lg p-1 text-[var(--ink-soft)] cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded font-mono text-xs space-y-1">
                <div><strong className="text-[var(--ink-soft)]">Timestamp:</strong> {inspectingEvent.timestamp}</div>
                <div><strong className="text-[var(--ink-soft)]">Actor:</strong> {inspectingEvent.actor}</div>
                <div><strong className="text-[var(--ink-soft)]">Target TSP:</strong> {inspectingEvent.tspId || 'central'}</div>
              </div>

              <div>
                <strong className="text-xs text-[var(--ink)] block mb-1">Cryptographic Event Payload:</strong>
                <pre className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded font-mono text-[11px] overflow-x-auto text-[var(--ink)] max-h-60">
                  {JSON.stringify(inspectingEvent.details, null, 2)}
                </pre>
              </div>

              <div className="pt-2 flex justify-end border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setInspectingEvent(null)}
                  className="px-4 py-1.5 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminConsoleLayout>
  )
}

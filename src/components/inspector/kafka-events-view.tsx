import { useState, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Radio
} from 'lucide-react'
import { useEventLogger } from '@/engine/event-logger'
import type { SystemEvent } from '@/types'

export function KafkaEventsView() {
  const events = useEventLogger((s) => s.events)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchCat = selectedCategory === 'all' || e.category === selectedCategory
      const q = searchQuery.toLowerCase()
      const matchSearch =
        e.action.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        (e.tspId && e.tspId.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [events, selectedCategory, searchQuery])

  const handleCopyPayload = (evt: SystemEvent) => {
    navigator.clipboard.writeText(JSON.stringify(evt, null, 2))
    setCopiedId(evt.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Kafka Stream Status Card */}
      <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Kafka Message Broker: <code>kadirs.identity.events</code></span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            HEALTHY &middot; 0.02s LAG
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="p-2 bg-[var(--paper-raised)] rounded border border-[var(--line)]">
            <span className="text-[10px] text-[var(--ink-soft)] block uppercase font-bold">Total Stream Events:</span>
            <span className="font-mono font-bold text-sm text-[var(--ink)]">{events.length}</span>
          </div>
          <div className="p-2 bg-[var(--paper-raised)] rounded border border-[var(--line)]">
            <span className="text-[10px] text-[var(--ink-soft)] block uppercase font-bold">Consumer Group:</span>
            <span className="font-mono text-xs text-[var(--green)] font-semibold">kadirs-audit-cg1</span>
          </div>
          <div className="p-2 bg-[var(--paper-raised)] rounded border border-[var(--line)]">
            <span className="text-[10px] text-[var(--ink-soft)] block uppercase font-bold">Audit Immutability:</span>
            <span className="font-mono text-xs text-amber-700 font-semibold">WORM Enforced</span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--ink-soft)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stream by action, actor, TSP..."
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {['all', 'auth', 'consent', 'security', 'reconciliation', 'profile', 'admin'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer capitalize whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[var(--ink)] text-white font-bold shadow-2xs'
                  : 'bg-[var(--paper)] text-[var(--ink-soft)] border border-[var(--line)] hover:text-[var(--ink)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider block">
          Append-Only Event Stream ({filteredEvents.length} items):
        </span>

        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--ink-soft)] bg-[var(--paper)] border border-[var(--line)] rounded">
            No events found matching your query.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.id
            return (
              <div
                key={evt.id}
                className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-3 text-xs space-y-2 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                        {evt.category}
                      </span>
                      <span className="font-bold text-xs text-[var(--ink)] font-mono">
                        {evt.action}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--ink-soft)] flex items-center gap-1.5 font-mono">
                      <span>Actor: <strong className="text-[var(--green)]">{evt.actor}</strong></span>
                      <span>&middot;</span>
                      <span>TSP: <strong>{evt.tspId || 'central-gate'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-[var(--ink-soft)]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                      className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                      title={isExpanded ? 'Collapse Payload' : 'Expand Payload'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded JSON Details */}
                {isExpanded && (
                  <div className="pt-2 border-t border-[var(--line-soft)] space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[var(--ink)]">Cryptographic Payload:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPayload(evt)}
                        className="px-2 py-0.5 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-[10.5px] rounded cursor-pointer transition-colors flex items-center gap-1"
                      >
                        {copiedId === evt.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === evt.id ? 'Copied' : 'Copy Payload'}</span>
                      </button>
                    </div>

                    <pre className="p-2.5 bg-[var(--paper)] border border-[var(--line)] rounded font-mono text-[11px] overflow-x-auto text-[var(--ink)] max-h-48 leading-relaxed">
                      {JSON.stringify(evt.details, null, 2)}
                    </pre>

                    <div className="text-[10px] font-mono text-[var(--ink-soft)]">
                      Event ID: {evt.id} &middot; UTC: {evt.timestamp}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

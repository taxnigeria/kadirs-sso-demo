import { useEffect } from 'react'
import {
  X,
  Code2,
  Radio,
  GitCommit,
  Network,
  Shield,
  Download
} from 'lucide-react'
import { useInspectorStore, type InspectorTab } from '@/engine/inspector-store'
import { TokenInspectorView } from './token-inspector-view'
import { KafkaEventsView } from './kafka-events-view'
import { AuthFlowTimelineView } from './auth-flow-timeline-view'
import { TopologyMapView } from './topology-map-view'
import { useAdminEngine } from '@/engine/admin-engine'

export function ArchitectureInspectorDrawer() {
  const isOpen = useInspectorStore((s) => s.isOpen)
  const closeInspector = useInspectorStore((s) => s.closeInspector)
  const activeTab = useInspectorStore((s) => s.activeTab)
  const setActiveTab = useInspectorStore((s) => s.setActiveTab)
  const getActiveToken = useInspectorStore((s) => s.getActiveToken)
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)

  // Close on Escape key or toggle on Alt+I (only for admins)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeInspector()
      }
      // Alt+I toggle shortcut — restricted to authenticated administrators
      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        if (useAdminEngine.getState().currentAdmin) {
          useInspectorStore.getState().toggleInspector()
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeInspector])

  // Strictly hidden if closed or user is not an authenticated administrator
  if (!isOpen || !currentAdmin) return null

  const tabs: { id: InspectorTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'token', label: 'RS256 JWT Token', icon: Code2 },
    { id: 'events', label: 'Kafka Stream', icon: Radio },
    { id: 'flow', label: 'Auth Flow Sequence', icon: GitCommit },
    { id: 'topology', label: 'System Topology', icon: Network }
  ]

  const handleDownloadDiagnosticReport = () => {
    const token = getActiveToken()
    const report = {
      timestamp: new Date().toISOString(),
      platform: 'KADIRS Auth System 2.0',
      standard: 'RFC 7519 RS256 JWT & NIST SP 800-63B',
      activeToken: token,
      jurisdiction: 'Kaduna State, Federal Republic of Nigeria',
      dataProtectionCompliance: 'NDPA 2023 Sec. 24'
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `KADIRS-AUTH-DIAGNOSTIC-${Date.now().toString(36)}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={closeInspector}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Slide-out Sheet Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-[var(--paper-raised)] border-l border-[var(--line)] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          
          {/* Top Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--line)] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] flex items-center justify-center font-bold text-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-sans font-bold text-base text-[var(--ink)] leading-snug">
                    Technical Architecture Inspector
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 font-bold">
                    Auth 2.0 Live
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Cryptographic verification, audience token scoping &amp; Kafka event stream.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadDiagnosticReport}
                title="Download Diagnostic Report JSON"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-xs font-semibold rounded-[var(--radius)] cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[var(--green)]" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={closeInspector}
                className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded hover:bg-[var(--line-soft)] cursor-pointer transition-colors"
                aria-label="Close Inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-4 sm:px-5 pt-2 border-b border-[var(--line)] flex items-center gap-1 overflow-x-auto text-xs shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-t-[var(--radius)] border-b-2 flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[var(--green)] text-[var(--green)] font-semibold bg-[var(--paper)]'
                      : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Active Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'token' && <TokenInspectorView />}
            {activeTab === 'events' && <KafkaEventsView />}
            {activeTab === 'flow' && <AuthFlowTimelineView />}
            {activeTab === 'topology' && <TopologyMapView />}
          </div>

          {/* Drawer Footer with Invariant Summary */}
          <div className="p-3 px-5 border-t border-[var(--line)] bg-[var(--paper)] text-[10.5px] text-[var(--ink-soft)] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="font-mono">
              Press <kbd className="px-1 py-0.2 bg-[var(--paper-raised)] border rounded">Alt+I</kbd> or <kbd className="px-1 py-0.2 bg-[var(--paper-raised)] border rounded">Esc</kbd> anytime
            </span>
            <span className="font-semibold text-[var(--green)]">
              RFC 7519 &middot; RFC 7636 &middot; NDPA 2023 Sec. 24 Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

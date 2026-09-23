import { useState, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import {
  CheckCircle2,
  Lock,
  LogOut,
  Search,
  Check,
  Building2,
  Users,
  Activity,
  Download,
  FileSpreadsheet,
  Layers,
  Cpu,
  RefreshCw,
  Flame,
  ShieldAlert,
  CheckSquare,
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'
import { useEventLogger } from '@/engine/event-logger'
import type {
  MakerCheckerItem,
  CorporateEntityRecord,
} from '@/types'

type AdminTab = 'overview' | 'maker_checker' | 'citizens' | 'entities' | 'tsps' | 'audit_reports'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)
  const logoutAdmin = useAdminEngine((s) => s.logoutAdmin)
  const isBreakGlassActive = useAdminEngine((s) => s.isBreakGlassActive)
  const deactivateBreakGlass = useAdminEngine((s) => s.deactivateBreakGlass)

  // Store data
  const makerCheckerItems = useAdminEngine((s) => s.makerCheckerItems)
  const approveItem = useAdminEngine((s) => s.approveItem)
  const rejectItem = useAdminEngine((s) => s.rejectItem)
  const requestMoreInfo = useAdminEngine((s) => s.requestMoreInfo)

  const citizens = useAdminEngine((s) => s.citizens)
  const toggleCitizenSuspension = useAdminEngine((s) => s.toggleCitizenSuspension)
  const forcePasswordReset = useAdminEngine((s) => s.forcePasswordReset)
  const force2faReset = useAdminEngine((s) => s.force2faReset)

  const corporates = useAdminEngine((s) => s.corporates)
  const agencies = useAdminEngine((s) => s.agencies)
  const toggleCorporateStatus = useAdminEngine((s) => s.toggleCorporateStatus)
  const toggleAgencyStatus = useAdminEngine((s) => s.toggleAgencyStatus)
  const transferCorporateRep = useAdminEngine((s) => s.transferCorporateRep)

  const tspClients = useAdminEngine((s) => s.tspClients)
  const rotateClientSecret = useAdminEngine((s) => s.rotateClientSecret)
  const updateTspScopes = useAdminEngine((s) => s.updateTspScopes)
  const registerTspClient = useAdminEngine((s) => s.registerTspClient)

  const getTelemetryMetrics = useAdminEngine((s) => s.getTelemetryMetrics)
  const generateNdpaCarExport = useAdminEngine((s) => s.generateNdpaCarExport)
  const exportNdpaCarCsv = useAdminEngine((s) => s.exportNdpaCarCsv)


  // Event logger stream
  const allEvents = useEventLogger((s) => s.events)

  // Route-aware initial tab: derive from URL path
  const initialTab = useMemo<AdminTab>(() => {
    const path = location.pathname
    if (path.includes('/approvals')) return 'maker_checker'
    if (path.includes('/disputes')) return 'entities'
    if (path.includes('/audit')) return 'audit_reports'
    return 'overview'
  }, [location.pathname])

  // Active Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab)

  // Search & Filter States
  const [mcCategoryFilter, setMcCategoryFilter] = useState<string>('all')
  const [citizenSearch, setCitizenSearch] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('all')

  // Modals state
  const [reviewingMcItem, setReviewingMcItem] = useState<MakerCheckerItem | null>(null)
  const [rejectReasonCode, setRejectReasonCode] = useState('Invalid Mandate')
  const [decisionNotes, setDecisionNotes] = useState('')

  const [repTransferModalCorp, setRepTransferModalCorp] = useState<CorporateEntityRecord | null>(null)
  const [newRepName, setNewRepName] = useState('')
  const [newRepNINMasked, _setNewRepNINMasked] = useState('781•••••290')
  const [newRepCitizenId, setNewRepCitizenId] = useState('CIT-KAD-2024-05581')
  const [repJustification, setRepJustification] = useState('Board Resolution CAC Form 7 Filed')

  const [inspectingEvent, setInspectingEvent] = useState<typeof allEvents[number] | null>(null)
  const [newSecretToast, setNewSecretToast] = useState<{ tspName: string; secret: string } | null>(null)

  // =========================================================================
  // AUTH GUARD: STRICT REQUIREMENT — ADMIN MUST LOGIN TO ACCESS DASHBOARD
  // =========================================================================
  if (!currentAdmin) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6 text-center animate-in fade-in">
        <div className="max-w-md w-full bg-[var(--paper-raised)] border border-red-200 rounded-[var(--radius)] p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-bold text-lg text-[var(--ink)]">
            Authentication Required
          </h2>
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
            The KADIRS Administrative Console is locked. You must authenticate using your authorized staff FIDO2 hardware key to view dashboard analytics and operational queues.
          </p>
          <div className="pt-3">
            <Link
              to="/admin"
              className="w-full py-2.5 px-4 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-[var(--radius)] transition-colors shadow-2xs inline-flex items-center justify-center gap-2"
            >
              <span>Authenticate with FIDO2 Key &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const telemetry = getTelemetryMetrics()

  // Filtered Maker/Checker Items
  const filteredMcItems = useMemo(() => {
    return makerCheckerItems.filter((item) => {
      if (mcCategoryFilter === 'all') return true
      return item.category === mcCategoryFilter
    })
  }, [makerCheckerItems, mcCategoryFilter])

  // Filtered Citizens
  const filteredCitizens = useMemo(() => {
    return citizens.filter((c) => {
      const q = citizenSearch.toLowerCase()
      return (
        c.legalName.toLowerCase().includes(q) ||
        c.citizenId.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      )
    })
  }, [citizens, citizenSearch])

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

  // Handlers
  const handleApprove = () => {
    if (!reviewingMcItem) return
    approveItem(reviewingMcItem.id, decisionNotes || undefined)
    setReviewingMcItem(null)
    setDecisionNotes('')
  }

  const handleReject = () => {
    if (!reviewingMcItem) return
    rejectItem(reviewingMcItem.id, rejectReasonCode, decisionNotes || undefined)
    setReviewingMcItem(null)
    setDecisionNotes('')
  }

  const handleMoreInfo = () => {
    if (!reviewingMcItem) return
    if (!decisionNotes.trim()) {
      alert('Please specify the documentation required in the notes field.')
      return
    }
    requestMoreInfo(reviewingMcItem.id, decisionNotes)
    setReviewingMcItem(null)
    setDecisionNotes('')
  }

  const handleExecuteRepTransfer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repTransferModalCorp) return
    if (!newRepName.trim()) {
      alert('Please enter the new director name.')
      return
    }

    transferCorporateRep(
      repTransferModalCorp.id,
      newRepName,
      newRepNINMasked,
      newRepCitizenId,
      repJustification
    )
    setRepTransferModalCorp(null)
    setNewRepName('')
  }

  const handleRotateSecret = (tspId: string, tspName: string) => {
    if (confirm(`Rotate OAuth client secret for ${tspName}? A 24-hour dual-secret grace period will be initiated.`)) {
      const newSec = rotateClientSecret(tspId)
      setNewSecretToast({ tspName, secret: newSec })
      setTimeout(() => setNewSecretToast(null), 10000)
    }
  }

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* BREAK-GLASS HIGH PRIORITY EMERGENCY BANNER (If Active)                   */}
      {/* ========================================================================= */}
      {isBreakGlassActive && (
        <div className="bg-red-700 text-white p-4 rounded-[var(--radius)] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 shrink-0 text-amber-300" />
            <div>
              <div className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                <span>Critical Incident: Break-Glass Emergency Mode Active</span>
                <span className="px-2 py-0.5 rounded bg-black/30 text-xs font-mono">
                  #KD-BG-01
                </span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                All supervisory constraints bypassed under physical envelope protocol. Full high-priority telemetry logging is active.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={deactivateBreakGlass}
            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-800 text-xs font-bold rounded shadow-xs cursor-pointer shrink-0 transition-colors"
          >
            Deactivate &amp; Re-Seal Vault
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICER STATUS & CONSOLE HEADER RIBBON                                     */}
      {/* ========================================================================= */}
      <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 sm:p-5 rounded-[var(--radius)] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center font-bold text-sm shrink-0 border border-[var(--green)]/20 shadow-2xs">
            {currentAdmin.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-sans font-semibold text-base sm:text-lg text-[var(--ink)] leading-snug">
                {currentAdmin.name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                {currentAdmin.role.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                AAL3 High Assurance
              </span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>Staff ID: <code className="font-mono text-[var(--ink)] font-semibold">{currentAdmin.staffId}</code></span>
              <span>&middot;</span>
              <span>{currentAdmin.department}</span>
              <span>&middot;</span>
              <span className="text-[var(--green)] flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                <span>{currentAdmin.fido2KeyName.split(' ')[0]} Active</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            type="button"
            onClick={() => {
              logoutAdmin()
              navigate('/admin')
            }}
            className="px-3.5 py-1.5 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-xs font-semibold rounded-[var(--radius)] text-red-700 hover:text-red-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HARD PROHIBITIONS STATUTORY COMPLIANCE BANNER                             */}
      {/* ========================================================================= */}
      <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--ink)]">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">Kaduna State Identity Hard Invariants:</span>
          <span className="text-[var(--ink-soft)] hidden lg:inline">
            Unmasked NINs strictly blinded &middot; Audit logs immutable &middot; Self-auditing prohibited &middot; No direct TSP database access.
          </span>
        </div>
        <span className="font-mono text-[10.5px] text-[var(--green)] bg-[var(--green)]/10 border border-[var(--green)]/20 px-2 py-0.5 rounded font-semibold">
          NDPA 2023 Sec. 24 Compliant
        </span>
      </div>

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
            24-hour dual-secret grace period initiated. Copy this secret now — it will not be displayed again.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIX SPOKES TAB NAVIGATION                                                 */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 border-b border-[var(--line)] overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 font-medium rounded-t-[var(--radius)] border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold bg-[var(--paper-raised)]'
              : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview &amp; Telemetry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maker_checker')}
          className={`px-3.5 py-2 font-medium rounded-t-[var(--radius)] border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'maker_checker'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold bg-[var(--paper-raised)]'
              : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Maker/Checker Queue</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 text-[10px] font-bold">
            {makerCheckerItems.filter((i) => i.status === 'pending').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('citizens')}
          className={`px-3.5 py-2 font-medium rounded-t-[var(--radius)] border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'citizens'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold bg-[var(--paper-raised)]'
              : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Citizen Accounts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('entities')}
          className={`px-3.5 py-2 font-medium rounded-t-[var(--radius)] border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'entities'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold bg-[var(--paper-raised)]'
              : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Entities (Corp / Agency)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tsps')}
          className={`px-3.5 py-2 font-medium rounded-t-[var(--radius)] border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'tsps'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold bg-[var(--paper-raised)]'
              : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>TSP OAuth Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_reports')}
          className={`px-3.5 py-2 font-medium rounded-t-[var(--radius)] border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'audit_reports'
              ? 'border-[var(--green)] text-[var(--green)] font-semibold bg-[var(--paper-raised)]'
              : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Audit Log &amp; NDPA CAR</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SPOKE 1 / TAB 1: OVERVIEW & TELEMETRY MONITORING                          */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* 6 Real-time KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
              <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">Registered Citizens</span>
              <div className="font-sans font-bold text-xl text-[var(--ink)]">524,200</div>
              <span className="text-[10px] text-[var(--green)] font-medium">100% NIMC Verified</span>
            </div>

            <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
              <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">Connected MDAs</span>
              <div className="font-sans font-bold text-xl text-[var(--green)]">14 Active TSPs</div>
              <span className="text-[10px] text-[var(--ink-soft)]">RS256 Scoped</span>
            </div>

            <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
              <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">Pending Approvals</span>
              <div className="font-sans font-bold text-xl text-amber-600">
                {makerCheckerItems.filter((i) => i.status === 'pending').length}
              </div>
              <span className="text-[10px] text-amber-700 font-medium">Action Required</span>
            </div>

            <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
              <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">Dispute Cases</span>
              <div className="font-sans font-bold text-xl text-blue-600">
                {makerCheckerItems.filter((i) => i.category === 'disputed_account').length}
              </div>
              <span className="text-[10px] text-blue-700 font-medium">Adjudication Desk</span>
            </div>

            <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
              <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">24h Event Velocity</span>
              <div className="font-sans font-bold text-xl text-[var(--ink)]">
                {telemetry.totalEventsLogged24h}
              </div>
              <span className="text-[10px] text-[var(--green)] font-medium">Append-Only Feed</span>
            </div>

            <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
              <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">30-Day SLA Uptime</span>
              <div className="font-sans font-bold text-xl text-[var(--green)]">
                {telemetry.thirtyDayUptimePercentage}%
              </div>
              <span className="text-[10px] text-[var(--green)] font-medium">Target: &ge;99.9%</span>
            </div>
          </div>

          {/* Telemetry Gauge Cards */}
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-5 rounded-[var(--radius)] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                Live Gateway &amp; Telemetry Health
              </h2>
              <span className="text-xs font-mono text-[var(--green)] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-ping" />
                Mesh Telemetry Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1">
                <span className="text-[11px] text-[var(--ink-soft)] font-medium">Auth Success Rate</span>
                <div className="font-bold text-lg text-[var(--ink)]">{telemetry.authSuccessRate}%</div>
                <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--green)] h-full" style={{ width: `${telemetry.authSuccessRate}%` }} />
                </div>
              </div>

              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1">
                <span className="text-[11px] text-[var(--ink-soft)] font-medium">OTP Carrier Delivery (Termii / Telco)</span>
                <div className="font-bold text-lg text-[var(--ink)]">{telemetry.otpDeliveryRate}%</div>
                <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--green)] h-full" style={{ width: `${telemetry.otpDeliveryRate}%` }} />
                </div>
              </div>

              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1">
                <span className="text-[11px] text-[var(--ink-soft)] font-medium">NIMC Dojah Latency</span>
                <div className="font-bold text-lg text-[var(--ink)]">{telemetry.nimcDojahLatencyMs} ms</div>
                <span className="text-[10px] text-[var(--green)] font-medium">Optimal NIMC Trip Time</span>
              </div>

              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1">
                <span className="text-[11px] text-[var(--ink-soft)] font-medium">Kafka Consumer Lag</span>
                <div className="font-bold text-lg text-[var(--green)]">{telemetry.kafkaConsumerLagSeconds}s</div>
                <span className="text-[10px] text-[var(--ink-soft)] font-mono">kadirs.identity.events</span>
              </div>
            </div>
          </div>

          {/* Quick Actions to Other Spokes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('maker_checker')}
              className="p-4 bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] border border-[var(--line)] rounded-[var(--radius)] text-left space-y-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-[var(--green)]">
                <CheckSquare className="w-5 h-5" />
                <span className="font-bold text-[11px]">Open Queue &rarr;</span>
              </div>
              <h3 className="font-bold text-sm text-[var(--ink)]">Review Maker/Checker Queue</h3>
              <p className="text-[11.5px] text-[var(--ink-soft)]">
                Adjudicate agency onboarding mandates, director transfers, and fraud flags.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('citizens')}
              className="p-4 bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] border border-[var(--line)] rounded-[var(--radius)] text-left space-y-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-blue-600">
                <Users className="w-5 h-5" />
                <span className="font-bold text-[11px]">Manage Accounts &rarr;</span>
              </div>
              <h3 className="font-bold text-sm text-[var(--ink)]">Citizen Account Governance</h3>
              <p className="text-[11.5px] text-[var(--ink-soft)]">
                Enforce account suspensions (locking all 14 TSPs) or trigger forced credential resets.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit_reports')}
              className="p-4 bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] border border-[var(--line)] rounded-[var(--radius)] text-left space-y-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-amber-600">
                <Download className="w-5 h-5" />
                <span className="font-bold text-[11px]">NDPC Export &rarr;</span>
              </div>
              <h3 className="font-bold text-sm text-[var(--ink)]">Export Annual NDPA CAR Report</h3>
              <p className="text-[11.5px] text-[var(--ink-soft)]">
                Structured statutory report for NDPC compliance review due March 31.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPOKE 2 / TAB 2: MAKER/CHECKER APPROVAL QUEUE                             */}
      {/* ========================================================================= */}
      {activeTab === 'maker_checker' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filter Pills across 6 categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase mr-1">Categories:</span>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'agency_reg', label: 'Agency Registrations' },
              { id: 'rep_transfer', label: 'Rep Transfers' },
              { id: 'officer_add', label: 'Officer Additions' },
              { id: 'disputed_account', label: 'Disputed Accounts' },
              { id: 'identity_conflict', label: 'Identity Conflicts' },
              { id: 'fraud_flag', label: 'Fraud Flags' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setMcCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-[var(--radius)] whitespace-nowrap font-medium transition-colors cursor-pointer ${
                  mcCategoryFilter === cat.id
                    ? 'bg-[var(--green)] text-white font-semibold shadow-2xs'
                    : 'bg-[var(--paper-raised)] border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Items Table */}
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  Dual-Authorization Maker/Checker Queue ({filteredMcItems.length} Cases)
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Statutory review desk for high-privilege onboarding, representative transfers, and dispute adjudication.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] text-[10.5px] uppercase tracking-wider bg-[var(--paper)]">
                    <th className="py-2.5 px-4 font-semibold">Case Ref</th>
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold">Entity / Title</th>
                    <th className="py-2.5 px-4 font-semibold">Applicant</th>
                    <th className="py-2.5 px-4 font-semibold">Masked NIN</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)] text-[var(--ink)]">
                  {filteredMcItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--paper)]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-[var(--ink-soft)]">
                        {item.caseNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-300 text-slate-700">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-xs text-[var(--ink)]">{item.entityName}</div>
                        <div className="text-[11px] text-[var(--ink-soft)] truncate max-w-xs">{item.title}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-xs text-[var(--ink)]">
                        {item.applicantName}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[var(--green)] font-semibold">
                        {item.applicantNINMasked}
                      </td>
                      <td className="py-3 px-4">
                        {item.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Review
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approved
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Rejected
                          </span>
                        )}
                        {item.status === 'more_info_requested' && (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Info Requisitioned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setReviewingMcItem(item)}
                          className="px-3 py-1 bg-[var(--paper)] hover:bg-[var(--line-soft)] border border-[var(--line)] text-xs font-semibold rounded-[var(--radius)] cursor-pointer transition-colors"
                        >
                          Review &amp; Adjudicate &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPOKE 3 / TAB 3: CITIZEN ACCOUNT MANAGEMENT                               */}
      {/* ========================================================================= */}
      {activeTab === 'citizens' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Search Bar */}
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] flex items-center gap-3">
            <Search className="w-4 h-4 text-[var(--ink-soft)]" />
            <input
              type="text"
              value={citizenSearch}
              onChange={(e) => setCitizenSearch(e.target.value)}
              placeholder="Search citizens by name, Citizen ID (e.g. CIT-KAD-2024-00847), email, or phone..."
              className="w-full bg-transparent text-xs text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none"
            />
          </div>

          {/* Citizens List */}
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  Citizen Registry Accounts ({filteredCitizens.length} Results)
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Governs account active states, 2FA credentials, and system-wide suspensions.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] text-[10.5px] uppercase tracking-wider bg-[var(--paper)]">
                    <th className="py-2.5 px-4 font-semibold">Citizen ID</th>
                    <th className="py-2.5 px-4 font-semibold">Legal Full Name</th>
                    <th className="py-2.5 px-4 font-semibold">Masked NIN</th>
                    <th className="py-2.5 px-4 font-semibold">Contact</th>
                    <th className="py-2.5 px-4 font-semibold">Tax Jurisdiction</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)] text-[var(--ink)]">
                  {filteredCitizens.map((c) => (
                    <tr key={c.citizenId} className="hover:bg-[var(--paper)]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-[var(--ink)]">
                        {c.citizenId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-xs">{c.legalName}</div>
                        <div className="text-[10.5px] text-[var(--ink-soft)]">{c.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[var(--green)] font-semibold">
                        {c.maskedNIN}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">{c.phone}</td>
                      <td className="py-3 px-4 text-xs text-[var(--ink-soft)]">
                        {c.taxOffice}
                      </td>
                      <td className="py-3 px-4">
                        {c.isSuspended ? (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`${c.isSuspended ? 'Unsuspend' : 'Suspend'} account for ${c.legalName}? (Suspension locks all 14 TSPs)`)) {
                              toggleCitizenSuspension(c.citizenId)
                            }
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-[var(--radius)] cursor-pointer transition-colors ${
                            c.isSuspended
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          {c.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            forcePasswordReset(c.citizenId)
                            alert(`Forced password reset flagged for ${c.legalName}. Citizen must establish new password on next login.`)
                          }}
                          className="px-2.5 py-1 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-xs font-medium rounded-[var(--radius)] cursor-pointer"
                        >
                          Reset Pwd
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            force2faReset(c.citizenId)
                            alert(`Forced 2FA reset flagged for ${c.legalName}. Current authenticator cleared.`)
                          }}
                          className="px-2.5 py-1 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-xs font-medium rounded-[var(--radius)] cursor-pointer"
                        >
                          Reset 2FA
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPOKE 4 / TAB 4: ENTITY MANAGEMENT (CORPORATE & AGENCY)                   */}
      {/* ========================================================================= */}
      {activeTab === 'entities' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Corporate Entities */}
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  Registered Corporate Entities &amp; Director Bindings
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Legal representation transfers require admin authorization — cannot be self-served by citizens.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] text-[10.5px] uppercase tracking-wider bg-[var(--paper)]">
                    <th className="py-2 px-3 font-semibold">RC Number</th>
                    <th className="py-2 px-3 font-semibold">Company Name</th>
                    <th className="py-2 px-3 font-semibold">State TIN</th>
                    <th className="py-2 px-3 font-semibold">Authorized Representative</th>
                    <th className="py-2 px-3 font-semibold">Rep Masked NIN</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)] text-[var(--ink)]">
                  {corporates.map((corp) => (
                    <tr key={corp.id} className="hover:bg-[var(--paper)]/50">
                      <td className="py-3 px-3 font-mono font-bold text-xs">{corp.rcNumber}</td>
                      <td className="py-3 px-3 font-semibold text-xs">{corp.companyName}</td>
                      <td className="py-3 px-3 font-mono text-xs">{corp.tin}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-xs">{corp.authorizedRepName}</div>
                        <div className="text-[10px] font-mono text-[var(--ink-soft)]">{corp.authorizedRepCitizenId}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-[var(--green)]">{corp.authorizedRepNINMasked}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          corp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {corp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setRepTransferModalCorp(corp)}
                          className="px-2.5 py-1 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          Transfer Rep
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCorporateStatus(corp.id)}
                          className="px-2.5 py-1 border border-[var(--line)] text-xs font-medium rounded hover:bg-[var(--line-soft)] cursor-pointer"
                        >
                          {corp.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agency Profiles */}
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  State Ministry, Department &amp; Agency (MDA) Profiles
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Gazetted public entities authorized to request citizen data scopes.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] text-[10.5px] uppercase tracking-wider bg-[var(--paper)]">
                    <th className="py-2 px-3 font-semibold">Agency Name</th>
                    <th className="py-2 px-3 font-semibold">Acronym</th>
                    <th className="py-2 px-3 font-semibold">Gazette Ref</th>
                    <th className="py-2 px-3 font-semibold">Issuing Ministry</th>
                    <th className="py-2 px-3 font-semibold">Authorized Officer</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)] text-[var(--ink)]">
                  {agencies.map((agency) => (
                    <tr key={agency.id} className="hover:bg-[var(--paper)]/50">
                      <td className="py-3 px-3 font-semibold text-xs">{agency.agencyName}</td>
                      <td className="py-3 px-3 font-mono font-bold text-xs">{agency.acronym}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--ink-soft)]">{agency.gazetteRef}</td>
                      <td className="py-3 px-3 text-xs">{agency.issuingMinistry}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-xs">{agency.authorizedOfficerName}</div>
                        <div className="text-[10px] text-[var(--ink-soft)]">{agency.authorizedOfficerEmail}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {agency.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleAgencyStatus(agency.id)}
                          className="px-2.5 py-1 border border-[var(--line)] text-xs font-medium rounded hover:bg-[var(--line-soft)] cursor-pointer"
                        >
                          {agency.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPOKE 5 / TAB 5: TSP OAUTH & SCOPE MANAGEMENT                             */}
      {/* ========================================================================= */}
      {activeTab === 'tsps' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  Touchpoint Service Provider (TSP) OAuth Clients
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Governs RS256 audience restrictions, permitted data scopes, and zero-downtime secret rotations.
                </p>
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
      )}

      {/* ========================================================================= */}
      {/* SPOKE 6 / TAB 6: AUDIT STREAM & NDPA CAR REPORTING                        */}
      {/* ========================================================================= */}
      {activeTab === 'audit_reports' && (
        <div className="space-y-5 animate-in fade-in">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAKER/CHECKER DECISION MODAL                                              */}
      {/* ========================================================================= */}
      {reviewingMcItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[var(--green)] uppercase font-bold">
                  {reviewingMcItem.caseNumber} &middot; {reviewingMcItem.category.replace('_', ' ')}
                </span>
                <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
                  {reviewingMcItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingMcItem(null)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1">
                <div><strong className="text-[var(--ink-soft)]">Entity:</strong> {reviewingMcItem.entityName}</div>
                <div><strong className="text-[var(--ink-soft)]">Applicant / Signatory:</strong> {reviewingMcItem.applicantName}</div>
                <div>
                  <strong className="text-[var(--ink-soft)]">Applicant Masked NIN:</strong>{' '}
                  <span className="font-mono text-[var(--green)] font-bold">{reviewingMcItem.applicantNINMasked}</span>{' '}
                  <span className="text-[10px] text-[var(--ink-soft)]">(Golden Rule Protected)</span>
                </div>
                <div><strong className="text-[var(--ink-soft)]">Submission Date:</strong> {new Date(reviewingMcItem.submittedAt).toLocaleString()}</div>
              </div>

              <div>
                <strong className="text-xs text-[var(--ink)] block mb-1">Documentary Evidence &amp; Payload Details:</strong>
                <pre className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded font-mono text-[11px] overflow-x-auto text-[var(--ink)]">
                  {JSON.stringify(reviewingMcItem.details, null, 2)}
                </pre>
              </div>

              <div className="space-y-1 pt-2">
                <label className="font-semibold text-[var(--ink)] block">
                  Rejection Reason Code (Mandatory if Rejecting):
                </label>
                <select
                  value={rejectReasonCode}
                  onChange={(e) => setRejectReasonCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                >
                  <option value="Invalid Mandate">Invalid Mandate / Beyond Statutory Jurisdiction</option>
                  <option value="Mismatched Identity">Mismatched Identity / Disputed Carrier Phone</option>
                  <option value="Forged Documentation">Defective / Unverified CAC Form 7 Document</option>
                  <option value="Duplicate Entity">Duplicate Account Claim Flagged</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--ink)] block">
                  Checker Officer Notes &amp; Decision Justification:
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter administrative sign-off notes (retained for 5-year audit)..."
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setReviewingMcItem(null)}
                className="px-3 py-1.5 border border-[var(--line)] rounded text-xs hover:bg-[var(--line-soft)] cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMoreInfo}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer transition-colors shadow-2xs"
                >
                  Request More Info
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded cursor-pointer transition-colors shadow-2xs"
                >
                  Reject Item
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-1.5 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve &amp; Issue Grant</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CORPORATE REPRESENTATIVE TRANSFER MODAL                                   */}
      {/* ========================================================================= */}
      {repTransferModalCorp && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="font-bold text-base text-[var(--ink)]">
                  Transfer Corporate Legal Representative
                </h3>
                <span className="text-xs text-[var(--ink-soft)] font-mono">
                  {repTransferModalCorp.companyName} ({repTransferModalCorp.rcNumber})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRepTransferModalCorp(null)}
                className="text-lg p-1 text-[var(--ink-soft)]"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              <strong>Statutory Binding Reassignment:</strong> The outgoing director's NIN binding (<code>{repTransferModalCorp.authorizedRepName}</code>) will be permanently revoked. The new director's Citizen ID will be bound to this entity.
            </p>

            <form onSubmit={handleExecuteRepTransfer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--ink)] block">New Director Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                  placeholder="e.g. Engr. Hadiza Mohammed"
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--ink)] block">New Director Citizen ID *</label>
                <input
                  type="text"
                  required
                  value={newRepCitizenId}
                  onChange={(e) => setNewRepCitizenId(e.target.value)}
                  placeholder="CIT-KAD-2024-XXXXX"
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded text-xs font-mono text-[var(--ink)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--ink)] block">Documentary Justification *</label>
                <input
                  type="text"
                  required
                  value={repJustification}
                  onChange={(e) => setRepJustification(e.target.value)}
                  placeholder="CAC Form 7 / Board Resolution reference"
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setRepTransferModalCorp(null)}
                  className="px-3 py-1.5 border border-[var(--line)] rounded text-xs cursor-pointer hover:bg-[var(--line-soft)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded cursor-pointer shadow-2xs"
                >
                  Confirm Legal Transfer &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT EVENT PAYLOAD INSPECTION MODAL                                      */}
      {/* ========================================================================= */}
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
                className="text-lg p-1 text-[var(--ink-soft)]"
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
  )
}

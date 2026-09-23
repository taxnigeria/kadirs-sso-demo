import { useState, useMemo } from 'react'
import {
  Check,
  CheckSquare,
  ShieldAlert,
  FileText,
  Building2,
  Code2,
  ArrowLeft,
  X,
  AlertTriangle,
  HelpCircle,
  FileCheck2,
  Clock,
  Send
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'
import type { MakerCheckerItem } from '@/types'
import { AdminConsoleLayout } from './admin-console-layout'
import { toast } from 'sonner'

/**
 * Human-friendly dossier view for administrative officers.
 * Formats statutory details, legal mandates, scopes, and evidence into executive cards.
 */
function FriendlyDossierView({
  category,
  details
}: {
  category: string
  details: Record<string, unknown>
}) {
  const [showRawJson, setShowRawJson] = useState(false)

  return (
    <div className="space-y-3">
      {/* Category: Agency Registration */}
      {category === 'agency_reg' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
              Official Gazette Mandate
            </span>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--green)]" />
              <span className="font-mono text-xs font-bold text-[var(--ink)]">
                {String(details.gazetteRef || 'N/A')}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
              Issuing Ministry / Department
            </span>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-[var(--ink)] truncate">
                {String(details.issuingMinistry || 'N/A')}
              </span>
            </div>
          </div>

          <div className="sm:col-span-2 p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
              Statutory Law &amp; Operational Mandate
            </span>
            <p className="text-xs text-[var(--ink)] font-medium leading-relaxed">
              {String(details.statutoryMandate || 'N/A')}
            </p>
          </div>

          <div className="sm:col-span-2 p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block mb-1.5">
              Requested Identity &amp; Platform Permissions (API Scopes)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Array.isArray(details.requestedScopes) ? (
                details.requestedScopes.map((scope: string) => (
                  <span
                    key={scope}
                    className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-mono text-[11px] font-medium"
                  >
                    ✓ {scope}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[var(--ink-soft)]">No specific scopes requested</span>
              )}
            </div>
          </div>

          {Boolean(details.targetClientType) && (
            <div className="sm:col-span-2 p-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs flex items-center justify-between">
              <span className="text-[var(--ink-soft)]">Integration Architecture:</span>
              <span className="font-medium text-[var(--ink)]">{String(details.targetClientType)}</span>
            </div>
          )}
        </div>
      )}

      {/* Category: Representative Transfer */}
      {category === 'rep_transfer' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
              <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                Corporate Registration Number
              </span>
              <span className="font-mono text-xs font-bold text-[var(--ink)]">
                {String(details.rcNumber || 'N/A')}
              </span>
            </div>
            <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
              <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                Board Resolution Evidence
              </span>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="underline">{String(details.boardResolutionDocRef || 'CAC-FORM-CAC7.pdf')}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg space-y-2">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block">
              Director Reassignment Details
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--line)]">
              <div>
                <span className="text-[var(--ink-soft)] block text-[11px]">Outgoing Director:</span>
                <span className="font-medium text-[var(--ink)]">{String(details.outgoingDirectorName)}</span>
                <span className="text-[10px] font-mono text-[var(--ink-soft)] block mt-0.5">
                  NIN: {String(details.outgoingDirectorNINMasked)} · {String(details.outgoingDirectorCitizenId)}
                </span>
              </div>
              <div>
                <span className="text-[var(--ink-soft)] block text-[11px]">Incoming Director ID:</span>
                <span className="font-mono font-bold text-[var(--green)]">
                  {String(details.incomingDirectorCitizenId)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  ✓ Verified CAC Board Resolution
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category: Officer Credentialing */}
      {category === 'officer_add' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
              Internal Staff ID
            </span>
            <span className="font-mono text-xs font-bold text-[var(--ink)]">
              {String(details.staffId || 'N/A')}
            </span>
          </div>

          <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
              Security Clearance Status
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" />
              {String(details.clearanceStatus || 'Passed')}
            </span>
          </div>

          <div className="sm:col-span-2 p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg space-y-1">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block">
              Assigned Post &amp; Authority
            </span>
            <div className="text-xs font-medium text-[var(--ink)]">
              {String(details.assignedRole || 'Direct Assessment Assessor')}
            </div>
            <div className="text-xs text-[var(--ink-soft)]">
              Station: {String(details.assignedOffice || 'N/A')}
            </div>
          </div>
        </div>
      )}

      {/* Category: Disputed Account */}
      {category === 'disputed_account' && (
        <div className="space-y-2.5">
          <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                Disputed Vehicle Asset
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                KADVREG Match
              </span>
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-[var(--ink-soft)]">Plate Number:</span>{' '}
                <span className="font-mono font-bold text-[var(--ink)]">{String(details.plateNumber || 'N/A')}</span>
              </div>
              <div>
                <span className="text-[var(--ink-soft)]">Chassis Number:</span>{' '}
                <span className="font-mono text-[var(--ink)]">{String(details.chassisNumber || 'N/A')}</span>
              </div>
              <div className="pt-1.5 border-t border-[var(--line)]">
                <span className="text-[var(--ink-soft)] block text-[11px] font-semibold mb-0.5">Dispute Reason:</span>
                <p className="text-[var(--ink)] text-xs italic bg-[var(--paper-raised)] p-2 rounded border border-[var(--line)]">
                  &ldquo;{String(details.disputeReason || 'Vehicle sold; ownership transfer incomplete.')}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {Boolean(details.policeExtractSubmitted) && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <span>Police Incident Extract &amp; Affidavit submitted and attached to case dossier.</span>
            </div>
          )}
        </div>
      )}

      {/* Category: Identity Conflict */}
      {category === 'identity_conflict' && (
        <div className="space-y-2.5">
          <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg space-y-2">
            <span className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block">
              Conflicting Legacy Records
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-[var(--paper-raised)] border border-[var(--line)] rounded">
                <span className="text-[10px] text-[var(--ink-soft)] block">Legacy Record A</span>
                <span className="font-mono font-semibold text-[var(--ink)]">{String(details.legacyTinA || 'N/A')}</span>
              </div>
              <div className="p-2 bg-[var(--paper-raised)] border border-[var(--line)] rounded">
                <span className="text-[10px] text-[var(--ink-soft)] block">Legacy Record B</span>
                <span className="font-mono font-semibold text-[var(--ink)]">{String(details.legacyTinB || 'N/A')}</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-[var(--line)] text-xs">
              <span className="text-[var(--ink-soft)] block text-[11px] font-semibold mb-0.5">Detection Finding:</span>
              <p className="text-[var(--ink)]">{String(details.conflictTrigger || 'Phone carrier correlation flagged.')}</p>
            </div>
            {Boolean(details.fuzzyScore) && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[var(--ink-soft)]">Fuzzy Matching Confidence:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {String(details.fuzzyScore)}% Correlation
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category: Fraud Flag */}
      {category === 'fraud_flag' && (
        <div className="space-y-2.5">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>Geographic Login Anomaly</span>
            </div>
            <div className="text-xs space-y-1.5 text-[var(--ink)]">
              <div>
                <span className="text-[var(--ink-soft)]">Impossible Travel:</span>{' '}
                <span className="font-medium text-red-600 dark:text-red-400">{String(details.timeDelta || 'N/A')}</span>
              </div>
              <div>
                <span className="text-[var(--ink-soft)]">IP Locations:</span>{' '}
                <span className="font-mono">{Array.isArray(details.ipCluster) ? details.ipCluster.join(' vs ') : String(details.ipCluster)}</span>
              </div>
              <div>
                <span className="text-[var(--ink-soft)]">Failed 2FA Challenges:</span>{' '}
                <span className="font-bold">{String(details.failedAttempts || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for generic details */}
      {!['agency_reg', 'rep_transfer', 'officer_add', 'disputed_account', 'identity_conflict', 'fraud_flag'].includes(category) && (
        <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg space-y-2">
          {Object.entries(details).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-soft)] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="font-medium text-[var(--ink)]">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Optional Technical Accordion */}
      <div className="pt-2 border-t border-[var(--line)]/50">
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-[11px] text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-center gap-1.5 cursor-pointer font-medium transition-colors"
        >
          <Code2 className="w-3.5 h-3.5 text-[var(--green)]" />
          <span>{showRawJson ? 'Hide technical payload' : 'View technical payload (JSON)'}</span>
        </button>
        {showRawJson && (
          <pre className="mt-2 p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg font-mono text-[11px] overflow-x-auto text-[var(--ink)] max-h-40 animate-in fade-in">
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

export default function AdminApprovalsPage() {
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)
  const makerCheckerItems = useAdminEngine((s) => s.makerCheckerItems)
  const approveItem = useAdminEngine((s) => s.approveItem)
  const rejectItem = useAdminEngine((s) => s.rejectItem)
  const requestMoreInfo = useAdminEngine((s) => s.requestMoreInfo)

  const [mcCategoryFilter, setMcCategoryFilter] = useState<string>('all')

  // Review modal state
  const [reviewingMcItem, setReviewingMcItem] = useState<MakerCheckerItem | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')

  // Separate sub-modals for decline & request info
  const [declineModalItem, setDeclineModalItem] = useState<MakerCheckerItem | null>(null)
  const [declineReasonCode, setDeclineReasonCode] = useState('Invalid Mandate / Beyond Statutory Jurisdiction')
  const [declineNotes, setDeclineNotes] = useState('')

  const [moreInfoModalItem, setMoreInfoModalItem] = useState<MakerCheckerItem | null>(null)
  const [requisitionNotes, setRequisitionNotes] = useState('')

  // Filtered Maker/Checker Items
  const filteredMcItems = useMemo(() => {
    return makerCheckerItems.filter((item) => {
      if (mcCategoryFilter === 'all') return true
      return item.category === mcCategoryFilter
    })
  }, [makerCheckerItems, mcCategoryFilter])

  // Handlers
  const handleApprove = () => {
    if (!reviewingMcItem) return
    approveItem(reviewingMcItem.id, approvalNotes || undefined)
    toast.success('Application Approved', {
      description: `Case ${reviewingMcItem.caseNumber} approved. Grant issued and logged to audit stream.`
    })
    setReviewingMcItem(null)
    setApprovalNotes('')
  }

  const handleConfirmDecline = () => {
    if (!declineModalItem) return
    if (!declineNotes.trim()) {
      toast.error('Rejection findings required', {
        description: 'Please provide statutory justification notes before confirming rejection.'
      })
      return
    }

    rejectItem(declineModalItem.id, declineReasonCode, declineNotes)
    toast.error('Application Declined', {
      description: `Case ${declineModalItem.caseNumber} rejected under code: ${declineReasonCode}.`
    })

    setDeclineModalItem(null)
    setReviewingMcItem(null)
    setDeclineNotes('')
  }

  const handleConfirmMoreInfo = () => {
    if (!moreInfoModalItem) return
    if (!requisitionNotes.trim()) {
      toast.error('Requisition notes required', {
        description: 'Please specify the documentation or clarification required from the applicant.'
      })
      return
    }

    requestMoreInfo(moreInfoModalItem.id, requisitionNotes)
    toast.info('Information Requisitioned', {
      description: `Applicant notified of additional documentation required for case ${moreInfoModalItem.caseNumber}.`
    })

    setMoreInfoModalItem(null)
    setReviewingMcItem(null)
    setRequisitionNotes('')
  }

  const isChecker =
    currentAdmin?.role === 'checker_officer' ||
    currentAdmin?.role === 'super_admin' ||
    currentAdmin?.role === 'dispute_officer'

  const isSelfApplicant =
    reviewingMcItem &&
    currentAdmin &&
    reviewingMcItem.applicantName.toLowerCase().includes(currentAdmin.name.toLowerCase())

  return (
    <AdminConsoleLayout>
      <div className="space-y-4">
        {/* Category Filter Pills across 6 categories */}
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
          <div className="p-4 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[var(--green)]" />
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  Dual-Authorization Maker/Checker Queue ({filteredMcItems.length} Cases)
                </h2>
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                Statutory review desk for high-privilege onboarding, representative transfers, and dispute adjudication.
              </p>
            </div>

            <div className="text-xs font-medium text-[var(--ink-soft)] flex items-center gap-1.5">
              <span>Your Review Privilege:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
                {currentAdmin?.role.replace('_', ' ')}
              </span>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
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
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Pending Review
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Approved
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Rejected
                        </span>
                      )}
                      {item.status === 'more_info_requested' && (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Info Requisitioned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingMcItem(item)
                          setApprovalNotes('')
                        }}
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

        {/* ========================================================================= */}
        {/* 1. PRIMARY REVIEW & ADJUDICATION DOSSIER MODAL                            */}
        {/* ========================================================================= */}
        {reviewingMcItem && !declineModalItem && !moreInfoModalItem && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[var(--green)] uppercase font-bold tracking-wider">
                    {reviewingMcItem.caseNumber} &middot; {reviewingMcItem.category.replace('_', ' ')}
                  </span>
                  <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
                    {reviewingMcItem.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewingMcItem(null)}
                  className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-lg p-1 rounded-md cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Applicant & Entity Summary Card */}
              <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[var(--line)]/50 pb-2">
                  <div>
                    <span className="text-[var(--ink-soft)] text-[11px] block">Entity / Ministry:</span>
                    <strong className="text-[var(--ink)] text-sm">{reviewingMcItem.entityName}</strong>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[var(--ink-soft)] text-[11px] block">Submission Date:</span>
                    <span className="font-medium text-[var(--ink)]">{new Date(reviewingMcItem.submittedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[var(--ink-soft)] block">Applicant / Signatory:</span>
                    <span className="font-medium text-[var(--ink)]">{reviewingMcItem.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--ink-soft)] block">Masked National Identity (NIN):</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[var(--green)] font-bold text-xs">{reviewingMcItem.applicantNINMasked}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Golden Rule Protected
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Friendly Dossier & Evidence View */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--ink)] mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[var(--green)]" />
                  <span>Statutory Evidence &amp; Application Dossier</span>
                </h4>
                <FriendlyDossierView
                  category={reviewingMcItem.category}
                  details={reviewingMcItem.details}
                />
              </div>

              {/* Self-auditing Invariant Alert */}
              {isSelfApplicant ? (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-300 rounded-lg space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Self-Auditing Prohibited by Governance Rule</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Kaduna State governance regulations prohibit officers from approving applications or registrations where they are the applicant. Another authorized checker officer must sign off.
                  </p>
                </div>
              ) : (
                /* Optional Approval Remarks */
                <div className="space-y-1 pt-1 border-t border-[var(--line)]">
                  <label className="font-semibold text-xs text-[var(--ink)] block">
                    Checker Officer Approval Remarks (Optional):
                  </label>
                  <input
                    type="text"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="e.g., Verified against State Gazette Vol. 48 and confirmed by Revenue Directorate..."
                    className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-md text-xs text-[var(--ink)] focus:outline-hidden"
                  />
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingMcItem(null)}
                  className="px-3.5 py-2 border border-[var(--line)] rounded-lg text-xs hover:bg-[var(--line-soft)] cursor-pointer text-[var(--ink)] font-medium transition-colors"
                >
                  Cancel
                </button>

                {!isSelfApplicant && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMoreInfoModalItem(reviewingMcItem)
                        setRequisitionNotes('')
                      }}
                      className="px-3.5 py-2 bg-[var(--paper)] hover:bg-[var(--line-soft)] border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Request More Info</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeclineModalItem(reviewingMcItem)
                        setDeclineReasonCode('Invalid Mandate / Beyond Statutory Jurisdiction')
                        setDeclineNotes('')
                      }}
                      className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Decline Application</span>
                    </button>

                    {isChecker && (
                      <button
                        type="button"
                        onClick={handleApprove}
                        className="px-4 py-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve &amp; Issue Grant</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. DEDICATED DECLINE / REJECTION MODAL                                     */}
        {/* ========================================================================= */}
        {declineModalItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[var(--paper-raised)] border border-red-500/30 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
                    Administrative Decline &middot; Case {declineModalItem.caseNumber}
                  </span>
                  <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
                    Decline: {declineModalItem.title}
                  </h3>
                </div>
              </div>

              {/* Warning Context */}
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-700 dark:text-red-300">
                Declining this application will reject the submission for <strong>{declineModalItem.entityName}</strong> and record an official statutory rejection entry in the immutable audit stream.
              </div>

              {/* Mandatory Rejection Reason Code */}
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-[var(--ink)] block">
                  Statutory Rejection Reason Code <span className="text-red-500">*</span>
                </label>
                <select
                  value={declineReasonCode}
                  onChange={(e) => setDeclineReasonCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs text-[var(--ink)] focus:outline-hidden"
                >
                  <option value="Invalid Mandate / Beyond Statutory Jurisdiction">
                    Invalid Mandate / Beyond Statutory Jurisdiction
                  </option>
                  <option value="Mismatched Identity / Disputed Carrier Phone">
                    Mismatched Identity / Disputed Carrier Phone
                  </option>
                  <option value="Defective or Missing CAC Board Resolution">
                    Defective or Missing CAC Board Resolution
                  </option>
                  <option value="Duplicate Tax ID / Existing Entity Conflict">
                    Duplicate Tax ID / Existing Entity Conflict
                  </option>
                  <option value="Incomplete Supporting Affidavits or Documents">
                    Incomplete Supporting Affidavits or Documents
                  </option>
                  <option value="Failed Background Clearance / Audit Flag">
                    Failed Background Clearance / Audit Flag
                  </option>
                </select>
              </div>

              {/* Mandatory Findings / Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-[var(--ink)] block">
                  Administrative Findings &amp; Statutory Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Detail the specific statutory grounds, regulations, or documentation deficiencies justifying this decline..."
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs text-[var(--ink)] focus:outline-hidden"
                />
                <span className="text-[10px] text-[var(--ink-soft)] block">
                  Mandatory field. This justification is permanently logged for 5-year compliance audit.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDeclineModalItem(null)}
                  className="px-3.5 py-2 border border-[var(--line)] rounded-lg text-xs hover:bg-[var(--line-soft)] cursor-pointer text-[var(--ink)] font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Review</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDecline}
                  disabled={!declineNotes.trim()}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5 ${
                    declineNotes.trim()
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm &amp; Decline Application</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. DEDICATED REQUISITION / REQUEST MORE INFO MODAL                         */}
        {/* ========================================================================= */}
        {moreInfoModalItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[var(--paper-raised)] border border-blue-500/30 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                    Requisition Documentation &middot; Case {moreInfoModalItem.caseNumber}
                  </span>
                  <h3 className="font-sans font-semibold text-base text-[var(--ink)]">
                    Request Information: {moreInfoModalItem.entityName}
                  </h3>
                </div>
              </div>

              {/* Context */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                Specify what supplementary documents or formal clarifications are required from <strong>{moreInfoModalItem.applicantName}</strong> before this case can be adjudicated.
              </div>

              {/* Requisition Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-[var(--ink)] block">
                  Required Documentation &amp; Requisition Instructions <span className="text-blue-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={requisitionNotes}
                  onChange={(e) => setRequisitionNotes(e.target.value)}
                  placeholder="e.g., Please provide a Certified True Copy of the Kaduna State Executive Council Gazette and authorized letterhead endorsement..."
                  className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs text-[var(--ink)] focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMoreInfoModalItem(null)}
                  className="px-3.5 py-2 border border-[var(--line)] rounded-lg text-xs hover:bg-[var(--line-soft)] cursor-pointer text-[var(--ink)] font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Review</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmMoreInfo}
                  disabled={!requisitionNotes.trim()}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5 ${
                    requisitionNotes.trim()
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Requisition to Applicant</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminConsoleLayout>
  )
}

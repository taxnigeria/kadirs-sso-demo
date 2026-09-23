import { useState, useMemo } from 'react'
import {
  Check,
  CheckSquare,
  ShieldAlert
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'
import type { MakerCheckerItem } from '@/types'
import { AdminConsoleLayout } from './admin-console-layout'

export default function AdminApprovalsPage() {
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)
  const makerCheckerItems = useAdminEngine((s) => s.makerCheckerItems)
  const approveItem = useAdminEngine((s) => s.approveItem)
  const rejectItem = useAdminEngine((s) => s.rejectItem)
  const requestMoreInfo = useAdminEngine((s) => s.requestMoreInfo)

  const [mcCategoryFilter, setMcCategoryFilter] = useState<string>('all')
  const [reviewingMcItem, setReviewingMcItem] = useState<MakerCheckerItem | null>(null)
  const [rejectReasonCode, setRejectReasonCode] = useState('Invalid Mandate')
  const [decisionNotes, setDecisionNotes] = useState('')

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

  const isChecker = currentAdmin?.role === 'checker_officer' || currentAdmin?.role === 'super_admin' || currentAdmin?.role === 'dispute_officer'
  const isSelfApplicant = reviewingMcItem && currentAdmin && reviewingMcItem.applicantName.toLowerCase().includes(currentAdmin.name.toLowerCase())

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
                  className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-lg p-1 cursor-pointer"
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
                  <pre className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded font-mono text-[11px] overflow-x-auto text-[var(--ink)] max-h-48">
                    {JSON.stringify(reviewingMcItem.details, null, 2)}
                  </pre>
                </div>

                {/* Self-auditing Invariant Alert */}
                {isSelfApplicant ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Self-Auditing Prohibited</span>
                    </div>
                    <p className="text-[11px]">
                      Kaduna State governance rules prohibit officers from approving applications or registrations where they are the applicant. Another authorized checker must sign off.
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingMcItem(null)}
                  className="px-3 py-1.5 border border-[var(--line)] rounded text-xs hover:bg-[var(--line-soft)] cursor-pointer"
                >
                  Cancel
                </button>

                {!isSelfApplicant && (
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
                    {isChecker && (
                      <button
                        type="button"
                        onClick={handleApprove}
                        className="px-4 py-1.5 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve &amp; Issue Grant</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminConsoleLayout>
  )
}

import { useState } from 'react'
import {
  Building2,
  ScrollText
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'
import type { CorporateEntityRecord } from '@/types'
import { AdminConsoleLayout } from './admin-console-layout'

export default function AdminEntitiesPage() {
  const corporates = useAdminEngine((s) => s.corporates)
  const agencies = useAdminEngine((s) => s.agencies)
  const toggleCorporateStatus = useAdminEngine((s) => s.toggleCorporateStatus)
  const toggleAgencyStatus = useAdminEngine((s) => s.toggleAgencyStatus)
  const transferCorporateRep = useAdminEngine((s) => s.transferCorporateRep)

  const [repTransferModalCorp, setRepTransferModalCorp] = useState<CorporateEntityRecord | null>(null)
  const [newRepName, setNewRepName] = useState('')
  const [newRepNINMasked] = useState('781•••••290')
  const [newRepCitizenId, setNewRepCitizenId] = useState('CIT-KAD-2024-05581')
  const [repJustification, setRepJustification] = useState('Board Resolution CAC Form 7 Filed')

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

  return (
    <AdminConsoleLayout>
      <div className="space-y-6">
        {/* Corporate Entities */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[var(--green)]" />
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  Registered Corporate Entities &amp; Director Bindings
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Legal representation transfers require administrative authorization — cannot be self-served by citizens.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] text-[10.5px] uppercase tracking-wider bg-[var(--paper)]">
                  <th className="py-2.5 px-3 font-semibold">RC Number</th>
                  <th className="py-2.5 px-3 font-semibold">Company Name</th>
                  <th className="py-2.5 px-3 font-semibold">State TIN</th>
                  <th className="py-2.5 px-3 font-semibold">Authorized Representative</th>
                  <th className="py-2.5 px-3 font-semibold">Rep Masked NIN</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)] text-[var(--ink)]">
                {corporates.map((corp) => (
                  <tr key={corp.id} className="hover:bg-[var(--paper)]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-xs">{corp.rcNumber}</td>
                    <td className="py-3 px-3 font-semibold text-xs">{corp.companyName}</td>
                    <td className="py-3 px-3 font-mono text-xs">{corp.tin}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-xs">{corp.authorizedRepName}</div>
                      <div className="text-[10px] font-mono text-[var(--ink-soft)]">{corp.authorizedRepCitizenId}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-[var(--green)] font-semibold">{corp.authorizedRepNINMasked}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        corp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {corp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setRepTransferModalCorp(corp)}
                        className="px-2.5 py-1 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-semibold rounded cursor-pointer shadow-2xs"
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
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  State Ministry, Department &amp; Agency (MDA) Profiles
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Gazetted public entities authorized to request citizen data scopes under Kaduna State revenue laws.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] text-[10.5px] uppercase tracking-wider bg-[var(--paper)]">
                  <th className="py-2.5 px-3 font-semibold">Agency Name</th>
                  <th className="py-2.5 px-3 font-semibold">Acronym</th>
                  <th className="py-2.5 px-3 font-semibold">Gazette Ref</th>
                  <th className="py-2.5 px-3 font-semibold">Issuing Ministry</th>
                  <th className="py-2.5 px-3 font-semibold">Authorized Officer</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)] text-[var(--ink)]">
                {agencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-[var(--paper)]/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-xs">{agency.agencyName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-xs">{agency.acronym}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[var(--ink-soft)]">{agency.gazetteRef}</td>
                    <td className="py-3 px-3 text-xs">{agency.issuingMinistry}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-xs">{agency.authorizedOfficerName}</div>
                      <div className="text-[10px] text-[var(--ink-soft)]">{agency.authorizedOfficerEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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

        {/* Corporate Representative Transfer Modal */}
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
                  className="text-lg p-1 text-[var(--ink-soft)] cursor-pointer"
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
      </div>
    </AdminConsoleLayout>
  )
}

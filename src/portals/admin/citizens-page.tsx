import { useState, useMemo } from 'react'
import {
  Search,
  Users
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'
import { AdminConsoleLayout } from './admin-console-layout'

export default function AdminCitizensPage() {
  const citizens = useAdminEngine((s) => s.citizens)
  const toggleCitizenSuspension = useAdminEngine((s) => s.toggleCitizenSuspension)
  const forcePasswordReset = useAdminEngine((s) => s.forcePasswordReset)
  const force2faReset = useAdminEngine((s) => s.force2faReset)

  const [citizenSearch, setCitizenSearch] = useState('')

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

  return (
    <AdminConsoleLayout>
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] flex items-center gap-3 shadow-2xs">
          <Search className="w-4 h-4 text-[var(--ink-soft)]" />
          <input
            type="text"
            value={citizenSearch}
            onChange={(e) => setCitizenSearch(e.target.value)}
            placeholder="Search citizens by name, Citizen ID (e.g. CIT-KAD-2024-00847), email, or phone..."
            className="w-full bg-transparent text-xs text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none"
          />
        </div>

        {/* Citizens List Table */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--green)]" />
              <div>
                <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
                  Citizen Registry Accounts ({filteredCitizens.length} Results)
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Governs account active states, 2FA credentials, and system-wide suspensions across all 14 TSPs.
                </p>
              </div>
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
                          Suspended (Locked)
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
                          if (confirm(`${c.isSuspended ? 'Unsuspend' : 'Suspend'} account for ${c.legalName}? (Suspension locks all 14 TSPs at Citizen ID level)`)) {
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
                          alert(`Forced password reset flagged for ${c.legalName}. Citizen must establish a new password on next login.`)
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
    </AdminConsoleLayout>
  )
}

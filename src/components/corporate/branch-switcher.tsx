import { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check, MapPin, Shield } from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { toast } from 'sonner'

export function BranchSwitcher() {
  const activePersona = useAuthEngine((s) => s.activePersona)
  const activeCorporateContext = useAuthEngine((s) => s.activeCorporateContext)
  const branches = useAuthEngine((s) => s.branches)
  const corporateEntities = useAuthEngine((s) => s.corporateEntities)
  const switchBranchContext = useAuthEngine((s) => s.switchBranchContext)

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auto-close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Only render when corporate persona is active and context exists
  if (activePersona !== 'corporate' || !activeCorporateContext) {
    return null
  }

  // Find parent entity
  const currentEntity = corporateEntities.find(
    (c) => c.rcNumber.toUpperCase() === activeCorporateContext.entityId.toUpperCase()
  )

  // Find branches for this entity
  const availableBranches = branches.filter(
    (b) => b.entityId.toUpperCase() === activeCorporateContext.entityId.toUpperCase()
  )

  // The Golden Rule: If single-branch, remain completely transparent (no switcher clutter)
  if (availableBranches.length <= 1) {
    return null
  }

  const activeBranch =
    availableBranches.find((b) => b.id === activeCorporateContext.branchId) || availableBranches[0]

  const handleSelectBranch = (branchId: string, branchName: string) => {
    try {
      switchBranchContext(activeCorporateContext.entityId, branchId)
      toast.success(`Active context switched to ${branchName}`, {
        description: 'New scoped OAuth 2.0 access token issued for this branch.'
      })
      setIsOpen(false)
    } catch {
      toast.error('Could not switch branch context.')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Switch active branch context"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-xs text-[var(--ink)] transition-all cursor-pointer group shadow-2xs"
      >
        <Building2 className="w-3.5 h-3.5 text-[#1AA260] shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#1AA260]">
            {activeBranch.branchCode}
          </span>
          <span className="font-semibold text-xs text-[var(--ink)] truncate max-w-[130px] sm:max-w-[170px]">
            {activeBranch.name}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--gray-500)] group-hover:text-[var(--ink)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[var(--card-bg)] text-[var(--ink)] border border-[var(--line)] shadow-float p-2.5 z-50 animate-in fade-in duration-150">
          <div className="px-3 py-2 border-b border-[var(--line)] mb-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1AA260]">
                Taxable Unit / Branch Selector
              </span>
              <span className="text-[10px] text-[var(--gray-500)] font-mono">
                {availableBranches.length} branches
              </span>
            </div>
            <div className="text-xs font-bold text-[var(--ink)] truncate mt-0.5">
              {currentEntity?.companyName || activeCorporateContext.entityId}
            </div>
            <div className="text-[10.5px] text-[var(--gray-500)] font-mono">
              CAC: {activeCorporateContext.entityId}
            </div>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {availableBranches.map((branch) => {
              const isSelected = branch.id === activeBranch.id
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelectBranch(branch.id, branch.name)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-500/10 border border-emerald-500/30 ring-1 ring-emerald-500/20'
                      : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-[var(--ink)]">
                        {branch.branchCode}
                      </span>
                      <span className="text-xs font-bold text-[var(--ink)] truncate">
                        {branch.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[var(--gray-700)] mt-1 truncate">
                      <MapPin className="w-3 h-3 text-[var(--gray-500)] shrink-0" />
                      <span className="truncate">{branch.lga} &middot; {branch.taxOffice.split('—')[0]}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#1AA260] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--line)] px-2.5 py-1 text-[10.5px] text-[var(--gray-500)] flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[#1AA260]" />
            <span>Tokens cryptographically assert active branch claim.</span>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ChevronsUpDown,
  User,
  CreditCard,
  Bell,
  LogOut,
  ShieldCheck,
  Users,
  Check
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useInvoiceStore } from '@/engine/invoice-store'
import { DEMO_PERSONAS } from '@/data/personas'
import { toast } from 'sonner'

export function SidebarUserFooter() {
  const [isOpen, setIsOpen] = useState(false)
  const [showPersonaPicker, setShowPersonaPicker] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const activePersona = useAuthEngine((s) => s.activePersona)
  const logout = useAuthEngine((s) => s.logout)
  const loginAsPersona = useAuthEngine((s) => s.loginAsPersona)

  const invoices = useInvoiceStore((s) => s.invoices)

  const unpaidCount = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length

  // Auto-close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowPersonaPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setShowPersonaPicker(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    toast.success('Signed out successfully')
    navigate('/auth/login')
  }

  const handleSelectPersona = (personaId: string) => {
    loginAsPersona(personaId)
    setShowPersonaPicker(false)
    setIsOpen(false)
    const p = DEMO_PERSONAS.find((item) => item.id === personaId)
    toast.success(`Switched to ${p?.name || 'Persona'}`, {
      description: `Active role: ${p?.role || 'Citizen'}`
    })
  }

  // Display attributes
  const displayName = identity?.legalName || currentUser?.email?.split('@')[0] || 'Fatima Abdullahi'
  const displayEmail = currentUser?.email || 'fatimah.a@gmail.com'
  const avatarUrl = identity?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'

  return (
    <div className="relative w-full p-2.5 sm:p-3 border-t border-[var(--gray-200)] shrink-0" ref={menuRef}>
      {/* ── Trigger Button (Matches the exact Shadcn Sidebar Footer in User Screenshot) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#1AA260]/40"
        aria-expanded={isOpen}
        aria-label="User Account Menu"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/15"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1AA260] ring-2 ring-[var(--paper)]" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-xs text-[var(--ink)] truncate">
              {displayName}
            </span>
            <span className="text-[11px] text-[var(--gray-500)] truncate">
              {displayEmail}
            </span>
          </div>
        </div>

        <ChevronsUpDown className="w-4 h-4 text-[var(--gray-400)] group-hover:text-[var(--ink)] transition-colors shrink-0 ml-1.5" />
      </button>

      {/* ── Popover Dropdown Menu (Generously sized w-72 sm:w-80, zero wrapping) ── */}
      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-2 mb-2 z-50 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-[var(--card-bg)] rounded-2xl border border-[var(--gray-200)] shadow-[0_16px_50px_rgba(0,0,0,0.22)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.7)] text-[var(--ink)] animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* Header Profile Summary */}
          <div className="p-3.5 border-b border-[var(--gray-200)] bg-black/[0.015] dark:bg-white/[0.015] flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/20 shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-xs sm:text-sm text-[var(--ink)] truncate">{displayName}</span>
              <span className="text-[11px] text-[var(--gray-500)] truncate">{displayEmail}</span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-[#1AA260] border border-emerald-500/20 shrink-0 whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  NIMC Verified &middot; Tier 2
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Items */}
          <div className="p-1.5 space-y-0.5 text-xs">
            {/* 1. Invoices & Billing */}
            <Link
              to="/paykaduna/invoices"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5 text-[var(--ink)] min-w-0">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium whitespace-nowrap">Billing &amp; Invoices</span>
              </div>
              {unpaidCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 whitespace-nowrap">
                  {unpaidCount} Due
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0 whitespace-nowrap">All Settled</span>
              )}
            </Link>

            {/* 2. Account Profile */}
            <Link
              to="/auth/profile"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[var(--ink)] transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-[var(--gray-500)] shrink-0" />
              <span className="font-medium whitespace-nowrap">Citizen Profile</span>
            </Link>

            {/* 3. Notifications & Notices (Matches shadcn screenshot) */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                toast.info('2 Unread Official Notices', {
                  description: '2026 Vehicle License renewal window open & Land Title verification notice.'
                })
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[var(--ink)] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Bell className="w-4 h-4 text-[var(--gray-500)] shrink-0" />
                <span className="font-medium whitespace-nowrap">Notifications</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </button>

            {/* 5. Switch Persona Accordion / Picker */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPersonaPicker((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[var(--ink)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="w-4 h-4 text-[var(--gray-500)] shrink-0" />
                  <span className="font-medium whitespace-nowrap">Switch Persona</span>
                </div>
                <span className="text-[10px] font-mono capitalize bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-[var(--gray-500)] shrink-0 whitespace-nowrap">
                  {activePersona}
                </span>
              </button>

              {/* Persona Switcher Expansion */}
              {showPersonaPicker && (
                <div className="pl-6 pr-2 py-1 space-y-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl my-1 border border-[var(--gray-200)]/60">
                  {DEMO_PERSONAS.map((p) => {
                    const isCurrent = currentUser?.citizenId === p.profile.citizenId
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPersona(p.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#1AA260]/10 text-[#1AA260] font-semibold'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--ink)]'
                        }`}
                      >
                        <div className="truncate">
                          <span className="block truncate font-medium">{p.name}</span>
                          <span className="text-[10px] text-[var(--gray-400)] block truncate">{p.role}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#1AA260] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer: Log out */}
          <div className="p-1.5 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left font-medium text-xs"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

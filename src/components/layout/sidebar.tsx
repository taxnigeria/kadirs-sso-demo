import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuthEngine } from '@/engine/auth-engine'
import { useAdminEngine } from '@/engine/admin-engine'
import { useInvoiceStore } from '@/engine/invoice-store'
import { findLegacyMatches } from '@/engine/reconciliation-engine'
import { type PortalConfig } from './portal-branding'
import { ChevronRight, X } from 'lucide-react'
import { SidebarUserFooter } from './sidebar-user-footer'
import { TspInvoicesModal } from '@/components/billing/tsp-invoices-modal'

interface SidebarProps {
  portal: PortalConfig
  isOpenOnMobile?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({ portal, isOpenOnMobile, onCloseMobile }: SidebarProps) {
  const location = useLocation()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const reconciledRecordIds = useAuthEngine((s) => s.reconciledRecordIds)
  const makerCheckerItems = useAdminEngine((s) => s.makerCheckerItems)
  const pendingApprovalsCount = makerCheckerItems.filter((i) => i.status === 'pending').length
  const invoices = useInvoiceStore((s) => s.invoices)

  const unpaidInvoicesCount = useMemo(() => {
    return invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length
  }, [invoices])

  // Calculate unlinked reconciliation candidate accounts for citizen portals
  const unlinkedReconciledCount = useMemo(() => {
    if (portal.id !== 'paykaduna' && portal.id !== 'auth') return 0
    if (!currentUser && !identity) return 0
    const activeIdentity = identity || {
      nin: '12345678901',
      legalName: currentUser?.citizenId ? 'Fatima Aminu Abdullahi' : 'Citizen',
      dateOfBirth: '1989-07-14',
      gender: 'female' as const,
      photoUrl: '',
      verificationProvider: 'nimc' as const,
      verifiedAt: new Date().toISOString()
    }
    const activeProfile = currentUser || {
      citizenId: 'CIT-KAD-2024-00847',
      email: 'fatimah.a@gmail.com',
      phone: '+234 803 123 4567',
      lga: 'Kaduna North',
      taxOffice: 'Kaduna North Tax Office — Kawo',
      personas: ['individual' as const],
      profileCompleteness: 85,
      createdAt: new Date().toISOString()
    }
    const matches = findLegacyMatches(activeIdentity, activeProfile)
    return matches.filter(
      (c) => !reconciledRecordIds.includes(c.record.id) && c.matchTier !== 'tier_3_conflict'
    ).length
  }, [portal.id, currentUser, identity, reconciledRecordIds])

  if (portal.navItems.length === 0) return null

  const navContent = (onItemClick?: () => void) => (
    <nav className="p-3 space-y-1.5 overflow-y-auto">
      {portal.navItems
        .filter((item) => item.path !== '/auth/profile' || Boolean(currentUser))
        .map((item) => {
          const isReconciliationRoute =
            (item.path === '/auth/reconciliation' || item.path === '/paykaduna/reconciliation') &&
            (location.pathname === '/auth/reconciliation' || location.pathname === '/paykaduna/reconciliation')
          const isInvoicesRoute =
            (item.path === '/paykaduna/invoices' || item.path === '/paykaduna/billing') &&
            (location.pathname === '/paykaduna/invoices' || location.pathname === '/paykaduna/billing')
          const isActive = location.pathname === item.path || isReconciliationRoute || isInvoicesRoute
          const NavIcon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1AA260] text-white shadow-sm font-semibold'
                  : 'text-[var(--gray-500)] hover:text-[var(--ink)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] font-medium'
              }`}
            >
              <NavIcon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.path === '/admin/approvals' && pendingApprovalsCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {pendingApprovalsCount}
                </span>
              )}
              {(item.path === '/paykaduna/invoices' || item.path === '/paykaduna/billing') && unpaidInvoicesCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {unpaidInvoicesCount}
                </span>
              )}
              {(item.path === '/auth/reconciliation' || item.path === '/paykaduna/reconciliation') && unlinkedReconciledCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {unlinkedReconciledCount}
                </span>
              )}
              {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-90" />}
            </Link>
          )
        })}
    </nav>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar with Fixed User Avatar Footer */}
      <aside className="hidden md:flex w-60 shrink-0 h-full border-r border-[var(--gray-200)] bg-[var(--paper)] flex-col justify-between transition-colors relative z-20">
        <div className="flex-1 overflow-y-auto min-h-0">
          {navContent()}
        </div>
        <SidebarUserFooter />
      </aside>

      {/* Mobile Collapsible Slide-Over Drawer */}
      {isOpenOnMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-150"
        >
          <aside className="w-64 max-w-[80vw] h-full bg-[var(--paper)] border-r border-[var(--gray-200)] flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header with Close Button */}
            <div className="p-3.5 border-b border-[var(--gray-200)] flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider">
                Navigation Menu
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list with auto-close on selection */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {navContent(onCloseMobile)}
            </div>

            {/* User Footer */}
            <SidebarUserFooter />
          </aside>

          {/* Backdrop dismiss click area */}
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}

      {/* ── Global TSP Invoices & Revenue Assessments Modal ── */}
      <TspInvoicesModal />
    </>
  )
}

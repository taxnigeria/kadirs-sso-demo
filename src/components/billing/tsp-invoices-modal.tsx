import { useState, useMemo } from 'react'
import {
  X,
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Car,
  FileText,
  Home,
  Droplets,
  Trees,
  ScrollText,
  Wallet,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Printer
} from 'lucide-react'
import { useInvoiceStore, type TspInvoice } from '@/engine/invoice-store'
import { VerificationModal, type VerificationDoc } from '@/portals/home/verification-modal'
import { toast } from 'sonner'

export function TspInvoicesModal() {
  const isBillingModalOpen = useInvoiceStore((s) => s.isBillingModalOpen)
  const closeBillingModal = useInvoiceStore((s) => s.closeBillingModal)
  const invoices = useInvoiceStore((s) => s.invoices)
  const activeFilterTsp = useInvoiceStore((s) => s.activeFilterTsp)
  const setFilterTsp = useInvoiceStore((s) => s.setFilterTsp)
  const activeFilterStatus = useInvoiceStore((s) => s.activeFilterStatus)
  const setFilterStatus = useInvoiceStore((s) => s.setFilterStatus)
  const searchQuery = useInvoiceStore((s) => s.searchQuery)
  const setSearchQuery = useInvoiceStore((s) => s.setSearchQuery)
  const viewMode = useInvoiceStore((s) => s.viewMode)
  const setViewMode = useInvoiceStore((s) => s.setViewMode)
  const payInvoice = useInvoiceStore((s) => s.payInvoice)
  const getSummaryMetrics = useInvoiceStore((s) => s.getSummaryMetrics)

  const [selectedInvoice, setSelectedInvoice] = useState<TspInvoice | null>(null)
  const [activeReceiptDoc, setActiveReceiptDoc] = useState<VerificationDoc | null>(null)
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState<string | null>(null)

  const metrics = getSummaryMetrics()

  // Copy reference helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedRef(text)
    toast.success('Reference copied to clipboard', { description: text })
    setTimeout(() => setCopiedRef(null), 2000)
  }

  // Handle instant invoice payment simulation
  const handlePay = async (invoice: TspInvoice) => {
    setPayingInvoiceId(invoice.id)
    try {
      // Simulate realistic payment gateway processing
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const result = await payInvoice(invoice.id, 'PayKaduna Central Gateway · Direct Wallet Settlement')
      if (result.success) {
        toast.success(`Payment Confirmed for ${invoice.invoiceNumber}`, {
          description: `Settled ₦${invoice.amount.toLocaleString()}. Official Receipt ${result.receiptNumber} issued.`
        })
        // Automatically update selected invoice if it was open in drawer
        setSelectedInvoice((prev) =>
          prev && prev.id === invoice.id
            ? {
                ...prev,
                status: 'paid',
                paidDate: new Date().toISOString(),
                receiptNumber: result.receiptNumber,
                paymentChannel: 'PayKaduna Central Gateway · Direct Wallet Settlement'
              }
            : prev
        )
      }
    } finally {
      setPayingInvoiceId(null)
    }
  }

  // Convert an invoice to official VerificationDoc for receipt modal
  const openReceiptModal = (invoice: TspInvoice) => {
    const doc: VerificationDoc = {
      type: 'receipt',
      docNumber: invoice.receiptNumber || invoice.invoiceNumber,
      title: `${invoice.tspName} — Official Revenue Receipt`,
      taxpayerName: invoice.taxpayerName,
      taxpayerId: invoice.taxpayerId,
      tin: invoice.tin,
      address: '14 Swimming Pool Road, Kabala Doki, Kaduna',
      lga: 'Kaduna North LGA',
      taxOffice: 'Kaduna North Tax Office (Kawo Branch)',
      issueDate: invoice.paidDate
        ? new Date(invoice.paidDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : invoice.issueDate,
      status: 'SETTLED & RECONCILED',
      totalAmount: `₦ ${invoice.amount.toLocaleString()}.00`,
      receiptItems: invoice.lineItems.map((item) => ({
        head: item.head,
        description: item.description,
        amount: `₦ ${item.amount.toLocaleString()}.00`
      })),
      paymentChannel: invoice.paymentChannel || 'PayKaduna Central Revenue Gateway',
      rrr: invoice.rrr,
      vehicleDetails: invoice.vehicleDetails,
      securityHash: invoice.securityHash
    }
    setActiveReceiptDoc(doc)
  }

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      // TSP Filter
      if (activeFilterTsp !== 'all' && item.tspId !== activeFilterTsp) {
        return false
      }
      // Status Filter
      if (activeFilterStatus !== 'all') {
        if (activeFilterStatus === 'unpaid' && item.status !== 'unpaid' && item.status !== 'overdue') return false
        if (activeFilterStatus === 'paid' && item.status !== 'paid') return false
        if (activeFilterStatus === 'overdue' && item.status !== 'overdue') return false
      }
      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchNumber = item.invoiceNumber.toLowerCase().includes(query)
        const matchTitle = item.billTitle.toLowerCase().includes(query)
        const matchTsp = item.tspName.toLowerCase().includes(query)
        const matchRrr = item.rrr?.toLowerCase().includes(query)
        const matchReceipt = item.receiptNumber?.toLowerCase().includes(query)
        if (!matchNumber && !matchTitle && !matchTsp && !matchRrr && !matchReceipt) {
          return false
        }
      }
      return true
    })
  }, [invoices, activeFilterTsp, activeFilterStatus, searchQuery])

  // Grouped by TSP mapping
  const groupedByTsp = useMemo(() => {
    const map = new Map<string, { tspName: string; tspId: string; items: TspInvoice[] }>()
    for (const inv of filteredInvoices) {
      if (!map.has(inv.tspId)) {
        map.set(inv.tspId, { tspName: inv.tspName, tspId: inv.tspId, items: [] })
      }
      map.get(inv.tspId)!.items.push(inv)
    }
    return Array.from(map.values())
  }, [filteredInvoices])

  if (!isBillingModalOpen) return null

  // TSP Icon mapper
  const getTspIcon = (tspId: string) => {
    switch (tspId) {
      case 'kadvreg':
        return <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      case 'pit':
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      case 'land-reg':
        return <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'water':
        return <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
      case 'kasepa':
        return <Trees className="w-4 h-4 text-teal-600 dark:text-teal-400" />
      case 'subeb':
        return <ScrollText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      default:
        return <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-6xl max-h-[92vh] bg-[var(--paper)] rounded-2xl sm:rounded-3xl border border-[var(--gray-200)] shadow-2xl flex flex-col overflow-hidden text-[var(--ink)] animate-in zoom-in-95 duration-200">
          {/* ── Google-Style Header Bar ── */}
          <div className="px-5 sm:px-7 py-4 border-b border-[var(--gray-200)] bg-[var(--paper)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-[#1AA260] flex items-center justify-center border border-emerald-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="billing-modal-title" className="font-display font-bold text-base sm:text-lg text-[var(--ink)]">
                    Invoices &amp; Revenue Assessments
                  </h2>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    Unified KADIRS TSP Gateway
                  </span>
                </div>
                <p className="text-xs text-[var(--gray-500)]">
                  Consolidated ledger across all 14 authorized Kaduna State service agencies under your citizen ID.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.success('Exporting fiscal statement...', {
                    description: 'Generated consolidated 2026 tax ledger statement in CSV and PDF formats.'
                  })
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--gray-200)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[var(--gray-500)]" />
                <span>Export Ledger</span>
              </button>

              <button
                type="button"
                onClick={closeBillingModal}
                className="p-2 rounded-xl text-[var(--gray-500)] hover:text-[var(--ink)] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                aria-label="Close invoices modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Google Cloud Billing Style KPI Summary Cards ── */}
          <div className="px-5 sm:px-7 py-3.5 bg-black/[0.015] dark:bg-white/[0.015] border-b border-[var(--gray-200)] grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
            {/* Card 1: Total Billed */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--gray-200)] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wider">
                Total Assessed
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-base sm:text-lg text-[var(--ink)]">
                  ₦{metrics.totalBilled.toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--gray-500)]">({invoices.length} bills)</span>
              </div>
            </div>

            {/* Card 2: Settled / Paid */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Settled (Paid)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {metrics.paidCount} receipts
                </span>
              </div>
              <div className="mt-1 font-mono font-bold text-base sm:text-lg text-emerald-700 dark:text-emerald-400">
                ₦{metrics.totalPaid.toLocaleString()}
              </div>
            </div>

            {/* Card 3: Due / Unpaid */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Dues
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  {metrics.unpaidCount + metrics.overdueCount} due
                </span>
              </div>
              <div className="mt-1 font-mono font-bold text-base sm:text-lg text-amber-700 dark:text-amber-400">
                ₦{metrics.totalUnpaid.toLocaleString()}
              </div>
            </div>

            {/* Card 4: Active TSPs */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--gray-200)] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wider">
                Participating Agencies
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-base sm:text-lg text-[var(--ink)]">
                  {metrics.activeTspsCount} of 14
                </span>
                <span className="text-[10px] text-[var(--gray-500)]">Active TSPs</span>
              </div>
            </div>
          </div>

          {/* ── Google Search & Multi-Filter Controls Bar ── */}
          <div className="px-5 sm:px-7 py-3 border-b border-[var(--gray-200)] bg-[var(--paper)] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Invoice No, Receipt, RRR, or agency..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--gray-200)] text-[var(--ink)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-1 focus:ring-[#1AA260]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--ink)] text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Status Filter Buttons + View Toggle */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Status Segmented Control */}
              <div className="flex items-center p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--gray-200)] text-xs">
                {(
                  [
                    { id: 'all', label: 'All Invoices' },
                    { id: 'unpaid', label: 'Unpaid / Due' },
                    { id: 'paid', label: 'Paid & Settled' },
                    { id: 'overdue', label: 'Overdue' }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      activeFilterStatus === tab.id
                        ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs font-semibold'
                        : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--gray-200)] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('flat')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'flat'
                      ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs font-semibold'
                      : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
                  }`}
                >
                  Flat List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grouped'
                      ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs font-semibold'
                      : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
                  }`}
                >
                  Grouped by TSP
                </button>
              </div>
            </div>
          </div>

          {/* ── Horizontal TSP Chips Bar (Google Workspace / Cloud Style) ── */}
          <div className="px-5 sm:px-7 py-2.5 border-b border-[var(--gray-200)] bg-[var(--paper)] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-semibold text-[var(--gray-500)] uppercase tracking-wider mr-1 shrink-0">
              Agency TSP:
            </span>

            {[
              { id: 'all', label: 'All Agencies (14)' },
              { id: 'kadvreg', label: 'KADVREG Vehicle' },
              { id: 'pit', label: 'PIT Portal' },
              { id: 'land-reg', label: 'KADGIS Lands' },
              { id: 'water', label: 'Water Board' },
              { id: 'kasepa', label: 'KASEPA Sanitation' },
              { id: 'paykaduna', label: 'PayKaduna Central' },
              { id: 'subeb', label: 'SUBEB Education' }
            ].map((tsp) => {
              const count =
                tsp.id === 'all'
                  ? invoices.length
                  : invoices.filter((i) => i.tspId === tsp.id).length
              return (
                <button
                  key={tsp.id}
                  type="button"
                  onClick={() => setFilterTsp(tsp.id)}
                  className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeFilterTsp === tsp.id
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-black/[0.03] dark:bg-white/[0.05] text-[var(--gray-700)] dark:text-[var(--gray-300)] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] border border-[var(--gray-200)]'
                  }`}
                >
                  <span>{tsp.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeFilterTsp === tsp.id ? 'bg-white/25 text-white' : 'bg-black/10 dark:bg-white/10'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Main Invoices Table or Grouped View ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {filteredInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-12 h-12 text-[var(--gray-400)] mx-auto mb-3 opacity-40" />
                <h3 className="font-bold text-sm text-[var(--ink)]">No invoices match your selection</h3>
                <p className="text-xs text-[var(--gray-500)] max-w-sm mx-auto mt-1">
                  Try adjusting the agency TSP filter, search keywords, or selecting "All Invoices".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterTsp('all')
                    setFilterStatus('all')
                    setSearchQuery('')
                  }}
                  className="mt-4 px-4 py-1.5 rounded-lg bg-[#1AA260] text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === 'grouped' ? (
              /* Grouped by TSP View */
              groupedByTsp.map((group) => {
                const groupTotal = group.items.reduce((s, i) => s + i.amount, 0)
                const groupPaid = group.items.filter((i) => i.status === 'paid').length
                const groupUnpaid = group.items.length - groupPaid
                return (
                  <div
                    key={group.tspId}
                    className="border border-[var(--gray-200)] rounded-2xl bg-[var(--card-bg)] overflow-hidden shadow-xs"
                  >
                    {/* TSP Group Header */}
                    <div className="px-5 py-3.5 bg-black/[0.02] dark:bg-white/[0.02] border-b border-[var(--gray-200)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          {getTspIcon(group.tspId)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[var(--ink)]">{group.tspName}</h3>
                          <div className="flex items-center gap-2 text-[11px] text-[var(--gray-500)]">
                            <span>{group.items.length} assessments</span>
                            <span>&middot;</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {groupPaid} paid
                            </span>
                            {groupUnpaid > 0 && (
                              <>
                                <span>&middot;</span>
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  {groupUnpaid} due
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[var(--gray-500)] uppercase block">Group Total</span>
                        <span className="font-mono font-bold text-sm text-[var(--ink)]">
                          ₦{groupTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Table of items in this TSP */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[var(--gray-200)] text-[var(--gray-500)] text-[11px] uppercase tracking-wider bg-black/[0.01] dark:bg-white/[0.01]">
                            <th className="py-2.5 px-4 font-semibold">Invoice Ref</th>
                            <th className="py-2.5 px-4 font-semibold">Description / Revenue Head</th>
                            <th className="py-2.5 px-4 font-semibold">Due Date</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Amount (NGN)</th>
                            <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--gray-200)] text-[var(--ink)]">
                          {group.items.map((item) => renderInvoiceRow(item))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })
            ) : (
              /* Flat List View (Standard Google Style Table) */
              <div className="border border-[var(--gray-200)] rounded-2xl bg-[var(--card-bg)] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--gray-200)] text-[var(--gray-500)] text-[11px] uppercase tracking-wider bg-black/[0.015] dark:bg-white/[0.015]">
                        <th className="py-3 px-4 font-semibold">Invoice Ref</th>
                        <th className="py-3 px-4 font-semibold">Origin Agency (TSP)</th>
                        <th className="py-3 px-4 font-semibold">Revenue Head &amp; Assessment</th>
                        <th className="py-3 px-4 font-semibold">Date Due / Paid</th>
                        <th className="py-3 px-4 font-semibold text-right">Amount (NGN)</th>
                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--gray-200)] text-[var(--ink)]">
                      {filteredInvoices.map((item) => renderInvoiceRow(item))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer Bar ── */}
          <div className="px-6 py-3 border-t border-[var(--gray-200)] bg-[var(--paper)] flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs text-[var(--gray-500)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1AA260]" />
              <span>
                All invoices digitally verifiable on PayKaduna &middot; Verified via Kaduna State Revenue Administration Law
              </span>
            </div>
            <div className="font-mono text-[11px]">
              Showing {filteredInvoices.length} of {invoices.length} records
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Drawer / Inspector (Google Style Slide-out Panel) ── */}
      {selectedInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex justify-end bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-xl h-full bg-[var(--paper)] border-l border-[var(--gray-200)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-[var(--ink)]"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-[var(--gray-200)] flex items-center justify-between bg-black/[0.015] dark:bg-white/[0.015]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  {getTspIcon(selectedInvoice.tspId)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--ink)]">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-[var(--gray-500)]">{selectedInvoice.tspName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg text-[var(--gray-500)] hover:text-[var(--ink)] hover:bg-black/[0.05] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  selectedInvoice.status === 'paid'
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                    : selectedInvoice.status === 'overdue'
                    ? 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {selectedInvoice.status === 'paid' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">
                      {selectedInvoice.status === 'paid' ? 'Settled & Reconciled' : selectedInvoice.status.toUpperCase()}
                    </h4>
                    <p className="text-[11px] opacity-80">
                      {selectedInvoice.status === 'paid'
                        ? `Paid on ${new Date(selectedInvoice.paidDate!).toLocaleDateString('en-GB')}`
                        : `Payment due on or before ${new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB')}`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-lg">₦{selectedInvoice.amount.toLocaleString()}.00</span>
                </div>
              </div>

              {/* Assessment Meta Information */}
              <div className="space-y-3 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-xl border border-[var(--gray-200)] text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--gray-200)]/60">
                  <span className="text-[var(--gray-500)]">Taxpayer Name</span>
                  <span className="font-semibold text-[var(--ink)]">{selectedInvoice.taxpayerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--gray-200)]/60">
                  <span className="text-[var(--gray-500)]">Citizen ID / Taxpayer ID</span>
                  <span className="font-mono font-medium">{selectedInvoice.taxpayerId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--gray-200)]/60">
                  <span className="text-[var(--gray-500)]">Kaduna Tax Office</span>
                  <span className="font-medium">Kaduna North Central Office</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--gray-200)]/60">
                  <span className="text-[var(--gray-500)]">Revenue Head Code</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">{selectedInvoice.revenueHead}</span>
                </div>
                {selectedInvoice.rrr && (
                  <div className="flex justify-between py-1 items-center">
                    <span className="text-[var(--gray-500)]">Remita Retrieval Reference (RRR)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedInvoice.rrr!)}
                      className="font-mono text-xs flex items-center gap-1 text-[#1AA260] hover:underline"
                    >
                      {selectedInvoice.rrr}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Vehicle or Property Detail if applicable */}
              {selectedInvoice.vehicleDetails && (
                <div className="p-4 rounded-xl border border-[var(--gray-200)] bg-black/[0.015] dark:bg-white/[0.015] space-y-2 text-xs">
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-[var(--gray-500)] flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" />
                    Vehicle Particulars
                  </h5>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div>
                      <span className="text-[var(--gray-400)] block">Make/Model:</span>
                      <span className="text-[var(--ink)] font-semibold">{selectedInvoice.vehicleDetails.make}</span>
                    </div>
                    <div>
                      <span className="text-[var(--gray-400)] block">Plate Number:</span>
                      <span className="text-[var(--ink)] font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedInvoice.vehicleDetails.plateNo}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--gray-400)] block">Chassis No:</span>
                      <span className="text-[var(--ink)]">{selectedInvoice.vehicleDetails.chassisNo}</span>
                    </div>
                    <div>
                      <span className="text-[var(--gray-400)] block">Engine No:</span>
                      <span className="text-[var(--ink)]">{selectedInvoice.vehicleDetails.engineNo}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Itemized Line Items Breakdown */}
              <div className="space-y-2.5">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[var(--gray-500)]">
                  Itemized Tariff &amp; Assessment Heads
                </h5>
                <div className="divide-y divide-[var(--gray-200)] border border-[var(--gray-200)] rounded-xl overflow-hidden bg-[var(--card-bg)] text-xs">
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-[var(--gray-400)] block">{item.head}</span>
                        <span className="font-medium text-[var(--ink)]">{item.description}</span>
                      </div>
                      <span className="font-mono font-bold text-[12px] text-[var(--ink)]">
                        ₦{item.amount.toLocaleString()}.00
                      </span>
                    </div>
                  ))}
                  <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between font-bold">
                    <span>Total Assessed Dues</span>
                    <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">
                      ₦{selectedInvoice.amount.toLocaleString()}.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Validation Signature */}
              <div className="p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--gray-200)] flex items-center gap-2 text-[11px] font-mono text-[var(--gray-500)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Digital Seal: {selectedInvoice.securityHash}</span>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-5 border-t border-[var(--gray-200)] bg-[var(--paper)] flex items-center justify-between gap-3">
              {selectedInvoice.status === 'paid' ? (
                <>
                  <button
                    type="button"
                    onClick={() => openReceiptModal(selectedInvoice)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-98"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Official Certified Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl border border-[var(--gray-200)] hover:bg-black/[0.03] text-[var(--ink)] cursor-pointer"
                    title="Print invoice"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={payingInvoiceId === selectedInvoice.id}
                  onClick={() => handlePay(selectedInvoice)}
                  className="w-full py-3 px-4 rounded-xl bg-[#1AA260] hover:bg-[#15804D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98 disabled:opacity-75"
                >
                  {payingInvoiceId === selectedInvoice.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Authorizing Settlement via PayKaduna...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₦{selectedInvoice.amount.toLocaleString()}.00 via PayKaduna Gateway</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Official Full Screen Receipt Verification Modal ── */}
      {activeReceiptDoc && (
        <VerificationModal doc={activeReceiptDoc} onClose={() => setActiveReceiptDoc(null)} />
      )}
    </>
  )

  // Sub-renderer for an invoice table row
  function renderInvoiceRow(item: TspInvoice) {
    const isPaid = item.status === 'paid'
    const isOverdue = item.status === 'overdue'

    return (
      <tr
        key={item.id}
        onClick={() => setSelectedInvoice(item)}
        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
      >
        {/* Invoice Ref */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-[12px] text-[var(--ink)] group-hover:text-[#1AA260] transition-colors">
              {item.invoiceNumber}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleCopy(item.invoiceNumber)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity"
              title="Copy reference"
            >
              {copiedRef === item.invoiceNumber ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-[var(--gray-400)]" />
              )}
            </button>
          </div>
          {item.rrr && <span className="font-mono text-[10px] text-[var(--gray-400)] block">{item.rrr}</span>}
        </td>

        {/* Origin TSP */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center shrink-0">
              {getTspIcon(item.tspId)}
            </div>
            <span className="font-medium text-[12px] text-[var(--ink)] truncate max-w-[140px] sm:max-w-[180px]">
              {item.tspName}
            </span>
          </div>
        </td>

        {/* Description / Revenue Head */}
        <td className="py-3 px-4 max-w-xs">
          <span className="font-medium text-[12px] text-[var(--ink)] line-clamp-1">{item.billTitle}</span>
          <span className="text-[10px] text-[var(--gray-500)] block truncate">{item.revenueHead}</span>
        </td>

        {/* Date */}
        <td className="py-3 px-4 text-[11px] text-[var(--gray-500)]">
          {isPaid && item.paidDate ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              Paid {new Date(item.paidDate).toLocaleDateString('en-GB')}
            </span>
          ) : (
            <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
              Due {new Date(item.dueDate).toLocaleDateString('en-GB')}
            </span>
          )}
        </td>

        {/* Amount */}
        <td className="py-3 px-4 font-mono font-bold text-right text-[12.5px] text-[var(--ink)]">
          ₦{item.amount.toLocaleString()}.00
        </td>

        {/* Status */}
        <td className="py-3 px-4 text-center">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isPaid
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                : isOverdue
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
            }`}
          >
            {isPaid ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Settled
              </>
            ) : isOverdue ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                Pending
              </>
            )}
          </span>
        </td>

        {/* Action Button */}
        <td className="py-3 px-4 text-right">
          {isPaid ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                openReceiptModal(item)
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[#1AA260] font-bold text-[11px] transition-colors cursor-pointer border border-emerald-500/20 active:scale-95"
            >
              Receipt
            </button>
          ) : (
            <button
              type="button"
              disabled={payingInvoiceId === item.id}
              onClick={(e) => {
                e.stopPropagation()
                handlePay(item)
              }}
              className="px-3 py-1 rounded-lg bg-[#1AA260] hover:bg-[#15804D] text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-75"
            >
              {payingInvoiceId === item.id ? 'Paying...' : 'Pay Now'}
            </button>
          )}
        </td>
      </tr>
    )
  }
}

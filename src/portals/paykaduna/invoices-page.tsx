import { useState, useMemo } from 'react'
import {
  Receipt,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Car,
  FileText,
  Home,
  Droplets,
  Trees,
  ScrollText,
  Wallet,
  Copy,
  Check,
  X,
  CreditCard,
  SlidersHorizontal
} from 'lucide-react'
import { useInvoiceStore, type TspInvoice } from '@/engine/invoice-store'
import { VerificationModal, type VerificationDoc } from '@/portals/home/verification-modal'
import { toast } from 'sonner'

export default function InvoicesPage() {
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
      await new Promise((resolve) => setTimeout(resolve, 950))
      const result = await payInvoice(invoice.id, 'PayKaduna Central Gateway · Direct Wallet Settlement')
      if (result.success) {
        toast.success(`Payment Confirmed for ${invoice.invoiceNumber}`, {
          description: `Settled ₦${invoice.amount.toLocaleString()}. Official Receipt ${result.receiptNumber} issued.`
        })
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
      if (activeFilterTsp !== 'all' && item.tspId !== activeFilterTsp) {
        return false
      }
      if (activeFilterStatus !== 'all') {
        if (activeFilterStatus === 'unpaid' && item.status !== 'unpaid' && item.status !== 'overdue') return false
        if (activeFilterStatus === 'paid' && item.status !== 'paid') return false
        if (activeFilterStatus === 'overdue' && item.status !== 'overdue') return false
      }
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
      case 'kadtaxonrent':
        return <Home className="w-4 h-4 text-[#0A5C36] dark:text-emerald-400" />
      default:
        return <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    }
  }

  const tspList = [
    { id: 'all', label: 'All Agencies' },
    { id: 'kadvreg', label: 'KADVREG Vehicle' },
    { id: 'pit', label: 'PIT Portal' },
    { id: 'land-reg', label: 'KADGIS Land' },
    { id: 'water', label: 'Water Board' },
    { id: 'kasepa', label: 'KASEPA Env' },
    { id: 'subeb', label: 'SUBEB' },
    { id: 'kadtaxonrent', label: 'Kad Tax on Rent' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      
      {/* ── Page Header Banner ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[24px] p-6 sm:p-7 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-[#1AA260] flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-xs">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 className="w-3 h-3" />
                Unified KADIRS Revenue Ledger
              </span>
              <span className="text-xs text-[var(--gray-300)]">&bull;</span>
              <span className="text-xs text-[var(--gray-500)]">14 Partner Agencies</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[var(--ink)] tracking-tight leading-tight">
              Billing &amp; Invoices
            </h1>
            <p className="text-xs sm:text-sm text-[var(--gray-500)] mt-1 max-w-2xl leading-relaxed">
              Consolidated assessment ledger across all authorized Kaduna State MDAs. View pending tax demands, vehicle renewals, land ground rent, and instantly download verified government receipts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              toast.success('Exporting fiscal statement...', {
                description: 'Generated consolidated 2026 tax ledger statement in CSV and PDF formats.'
              })
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-xs font-semibold transition-colors cursor-pointer text-[var(--ink)] shadow-xs"
          >
            <Download className="w-4 h-4 text-[var(--gray-500)]" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards (Google Cloud Style) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Assessed */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-[var(--card-bg)] border border-[var(--gray-200)] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[var(--gray-500)] uppercase tracking-wider">
            Total Assessed
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              ₦{metrics.totalBilled.toLocaleString()}
            </span>
            <span className="text-xs text-[var(--gray-400)]">({invoices.length} bills)</span>
          </div>
        </div>

        {/* Card 2: Settled / Paid */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settled (Paid)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              {metrics.paidCount} cleared
            </span>
          </div>
          <div className="mt-2 font-display font-extrabold text-xl sm:text-2xl text-emerald-700 dark:text-emerald-400 tracking-tight">
            ₦{metrics.totalPaid.toLocaleString()}
          </div>
        </div>

        {/* Card 3: Due / Unpaid */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pending Dues
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
              {metrics.unpaidCount + metrics.overdueCount} due
            </span>
          </div>
          <div className="mt-2 font-display font-extrabold text-xl sm:text-2xl text-amber-700 dark:text-amber-400 tracking-tight">
            ₦{metrics.totalUnpaid.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Participating Agencies */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-[var(--card-bg)] border border-[var(--gray-200)] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[var(--gray-500)] uppercase tracking-wider">
            Connected MDAs
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
              {metrics.activeTspsCount} of 14
            </span>
            <span className="text-xs text-[var(--gray-400)]">Active TSPs</span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[20px] p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Top Controls: Search + Status Tabs + View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number, assessment title, or RRR..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-[var(--paper)] border border-[var(--gray-200)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1AA260]/30 focus:border-[#1AA260] text-[var(--ink)] placeholder:text-[var(--gray-400)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Tabs */}
            <div className="inline-flex rounded-xl border border-[var(--gray-200)] p-1 bg-black/[0.02] dark:bg-white/[0.04]">
              {(
                [
                  { id: 'all', label: `All (${invoices.length})` },
                  { id: 'unpaid', label: `Due (${metrics.unpaidCount + metrics.overdueCount})` },
                  { id: 'paid', label: `Paid (${metrics.paidCount})` },
                  { id: 'overdue', label: `Overdue (${metrics.overdueCount})` }
                ] as const
              ).map((tab) => {
                const isActive = activeFilterStatus === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1AA260] text-white shadow-xs font-semibold'
                        : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl border border-[var(--gray-200)] p-1 bg-black/[0.02] dark:bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                  viewMode === 'flat'
                    ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs font-semibold'
                    : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs font-semibold'
                    : 'text-[var(--gray-500)] hover:text-[var(--ink)]'
                }`}
              >
                By Agency
              </button>
            </div>
          </div>
        </div>

        {/* Agency Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-[11px] font-semibold text-[var(--gray-400)] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Agency:
          </span>
          {tspList.map((tsp) => {
            const isSelected = activeFilterTsp === tsp.id
            return (
              <button
                key={tsp.id}
                type="button"
                onClick={() => setFilterTsp(tsp.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1AA260]/10 border-[#1AA260] text-[#1AA260] font-semibold shadow-2xs'
                    : 'bg-transparent border-[var(--gray-200)] text-[var(--gray-500)] hover:text-[var(--ink)] hover:border-[var(--gray-300)]'
                }`}
              >
                {tsp.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main Invoices Feed ── */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-[24px] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-center mx-auto text-[var(--gray-400)]">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-base text-[var(--ink)]">No invoices found</h3>
          <p className="text-xs text-[var(--gray-500)] max-w-sm mx-auto">
            No revenue assessments match your current filters. Try changing your search query or selecting "All Agencies".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setFilterTsp('all')
              setFilterStatus('all')
            }}
            className="mt-2 text-xs font-semibold text-[#1AA260] hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : viewMode === 'grouped' ? (
        /* ── Grouped by Agency View ── */
        <div className="space-y-6">
          {groupedByTsp.map((group) => (
            <div key={group.tspId} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--gray-200)] flex items-center justify-center">
                    {getTspIcon(group.tspId)}
                  </div>
                  <h3 className="font-display font-bold text-base text-[var(--ink)]">
                    {group.tspName}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[var(--gray-500)]">
                    {group.items.length} {group.items.length === 1 ? 'bill' : 'bills'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {group.items.map((inv) => (
                  <InvoiceCard
                    key={inv.id}
                    invoice={inv}
                    onSelect={() => setSelectedInvoice(inv)}
                    onPay={() => handlePay(inv)}
                    onReceipt={() => openReceiptModal(inv)}
                    isPaying={payingInvoiceId === inv.id}
                    onCopy={handleCopy}
                    copiedRef={copiedRef}
                    getTspIcon={getTspIcon}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Flat List View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredInvoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onSelect={() => setSelectedInvoice(inv)}
              onPay={() => handlePay(inv)}
              onReceipt={() => openReceiptModal(inv)}
              isPaying={payingInvoiceId === inv.id}
              onCopy={handleCopy}
              copiedRef={copiedRef}
              getTspIcon={getTspIcon}
            />
          ))}
        </div>
      )}

      {/* ── Slide-Over Inspection Drawer for Invoice Breakdown ── */}
      {selectedInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xl h-full bg-[var(--paper)] border-l border-[var(--gray-200)] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-[var(--gray-200)] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--gray-200)] flex items-center justify-center shrink-0">
                  {getTspIcon(selectedInvoice.tspId)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--ink)]">
                      {selectedInvoice.invoiceNumber}
                    </span>
                    <InvoiceStatusBadge status={selectedInvoice.status} />
                  </div>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    {selectedInvoice.tspName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg text-[var(--gray-400)] hover:text-[var(--ink)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto text-xs">
              
              {/* Bill Title & Total Amount */}
              <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-2xl p-4 sm:p-5 space-y-2">
                <span className="text-[11px] font-bold text-[var(--gray-500)] uppercase tracking-wider block">
                  Assessment Title
                </span>
                <h3 className="font-display font-bold text-base text-[var(--ink)] leading-snug">
                  {selectedInvoice.billTitle}
                </h3>
                <div className="pt-2 flex items-baseline justify-between border-t border-[var(--gray-200)]">
                  <span className="text-[var(--gray-500)]">Total Payable Amount</span>
                  <span className="font-display font-black text-2xl text-[var(--ink)] tracking-tight">
                    ₦{selectedInvoice.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* RRR & Reference Box */}
              {selectedInvoice.rrr && (
                <div className="p-3.5 bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--gray-200)] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--gray-500)] tracking-wider block">
                      Remita / Bank Retrieval Reference (RRR)
                    </span>
                    <span className="font-mono font-bold text-sm text-[var(--ink)]">
                      {selectedInvoice.rrr}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedInvoice.rrr!)}
                    className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[var(--gray-500)] hover:text-[var(--ink)] cursor-pointer transition-colors"
                    title="Copy RRR"
                  >
                    {copiedRef === selectedInvoice.rrr ? <Check className="w-4 h-4 text-[#1AA260]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Statutory Revenue Head */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gray-500)]">
                  Statutory Revenue Head
                </span>
                <div className="p-3 bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-xl font-mono text-xs text-[var(--ink)]">
                  {selectedInvoice.revenueHead}
                </div>
              </div>

              {/* Line Items Breakdown Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gray-500)]">
                  Itemized Tariff Breakdown
                </span>
                <div className="border border-[var(--gray-200)] rounded-xl overflow-hidden divide-y divide-[var(--gray-200)] bg-[var(--card-bg)]">
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-medium text-[var(--ink)] block">{item.description}</span>
                        <span className="text-[10px] font-mono text-[var(--gray-400)]">{item.head}</span>
                      </div>
                      <span className="font-mono font-semibold text-[var(--ink)] shrink-0">
                        ₦{item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxpayer & Agency Metadata */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gray-500)]">
                  Taxpayer &amp; Filing Attributes
                </span>
                <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-500)]">Assessed Taxpayer</span>
                    <span className="font-semibold text-[var(--ink)]">{selectedInvoice.taxpayerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-500)]">Taxpayer Identifier</span>
                    <span className="font-mono text-[var(--ink)]">{selectedInvoice.taxpayerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-500)]">State TIN</span>
                    <span className="font-mono text-[var(--ink)]">{selectedInvoice.tin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-500)]">Issue Date</span>
                    <span className="text-[var(--ink)]">{selectedInvoice.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-500)]">Due Date</span>
                    <span className="text-[var(--ink)] font-semibold">{selectedInvoice.dueDate}</span>
                  </div>
                  {selectedInvoice.paidDate && (
                    <div className="flex justify-between text-[#1AA260] font-semibold pt-1 border-t border-[var(--gray-200)]">
                      <span>Payment Cleared</span>
                      <span>{new Date(selectedInvoice.paidDate).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle / Property Custom Metadata if available */}
              {selectedInvoice.vehicleDetails && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gray-500)]">
                    Vehicle Registration Attributes
                  </span>
                  <div className="bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-xl p-3.5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--gray-500)]">Plate Number</span>
                      <span className="font-bold text-[var(--ink)]">{selectedInvoice.vehicleDetails.plateNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray-500)]">Chassis / VIN</span>
                      <span>{selectedInvoice.vehicleDetails.chassisNo}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-[var(--gray-200)] bg-[var(--paper)] flex items-center gap-3">
              {selectedInvoice.status === 'paid' ? (
                <button
                  type="button"
                  onClick={() => openReceiptModal(selectedInvoice)}
                  className="w-full bg-[#1AA260] hover:bg-[#158A52] text-white py-3 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Official Revenue Receipt</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePay(selectedInvoice)}
                  disabled={payingInvoiceId === selectedInvoice.id}
                  className="w-full bg-[#1AA260] hover:bg-[#158A52] text-white py-3 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {payingInvoiceId === selectedInvoice.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>Pay ₦{selectedInvoice.amount.toLocaleString()} via Gateway</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Official Verification Document Modal (Receipt Generator) ── */}
      {activeReceiptDoc && (
        <VerificationModal
          doc={activeReceiptDoc}
          onClose={() => setActiveReceiptDoc(null)}
        />
      )}
    </div>
  )
}

// ── Invoice Card Subcomponent ──
interface InvoiceCardProps {
  invoice: TspInvoice
  onSelect: () => void
  onPay: () => void
  onReceipt: () => void
  isPaying: boolean
  onCopy: (text: string) => void
  copiedRef: string | null
  getTspIcon: (tspId: string) => React.ReactNode
}

function InvoiceCard({
  invoice,
  onSelect,
  onPay,
  onReceipt,
  isPaying,
  onCopy,
  copiedRef,
  getTspIcon
}: InvoiceCardProps) {
  const isPaid = invoice.status === 'paid'
  const isOverdue = invoice.status === 'overdue'

  return (
    <div className={`bg-[var(--card-bg)] rounded-[22px] border transition-all flex flex-col justify-between p-5 hover:shadow-md ${
      isPaid
        ? 'border-[var(--gray-200)]'
        : isOverdue
        ? 'border-rose-200 dark:border-rose-900/40 shadow-xs'
        : 'border-[var(--gray-200)] shadow-xs'
    }`}>
      <div className="space-y-3.5">
        {/* Top line: Agency icon & name + Status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--gray-200)] flex items-center justify-center shrink-0">
              {getTspIcon(invoice.tspId)}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[var(--gray-500)] truncate block">
                {invoice.tspName}
              </span>
              <span className="font-mono text-[10px] text-[var(--gray-400)] block">
                {invoice.invoiceNumber}
              </span>
            </div>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {/* Assessment Title */}
        <div>
          <h4
            onClick={onSelect}
            className="font-display font-bold text-sm text-[var(--ink)] leading-snug line-clamp-2 hover:text-[#1AA260] transition-colors cursor-pointer"
          >
            {invoice.billTitle}
          </h4>
          <span className="text-[11px] text-[var(--gray-400)] mt-1 block">
            Due: {invoice.dueDate}
          </span>
        </div>

        {/* Amount & RRR */}
        <div className="pt-2 border-t border-[var(--gray-200)] flex items-baseline justify-between">
          <span className="text-xs text-[var(--gray-500)]">Amount</span>
          <span className="font-display font-extrabold text-lg sm:text-xl text-[var(--ink)] tracking-tight">
            ₦{invoice.amount.toLocaleString()}
          </span>
        </div>

        {invoice.rrr && (
          <div className="flex items-center justify-between text-[11px] bg-black/[0.02] dark:bg-white/[0.03] px-2.5 py-1.5 rounded-lg font-mono text-[var(--gray-500)]">
            <span className="truncate">RRR: {invoice.rrr}</span>
            <button
              type="button"
              onClick={() => onCopy(invoice.rrr!)}
              className="text-[var(--gray-400)] hover:text-[var(--ink)] cursor-pointer shrink-0 ml-1.5"
              title="Copy RRR"
            >
              {copiedRef === invoice.rrr ? <Check className="w-3.5 h-3.5 text-[#1AA260]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-2 border-t border-[var(--gray-200)] flex items-center gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 px-3 py-2 rounded-full border border-[var(--gray-200)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer text-center"
        >
          Breakdown
        </button>

        {isPaid ? (
          <button
            type="button"
            onClick={onReceipt}
            className="flex-1 px-3 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Receipt</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPay}
            disabled={isPaying}
            className="flex-1 px-3 py-2 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isPaying ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CreditCard className="w-3.5 h-3.5" />
            )}
            <span>Pay Now</span>
          </button>
        )}
      </div>
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: 'unpaid' | 'paid' | 'overdue' }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 shrink-0">
        <CheckCircle2 className="w-3 h-3" />
        Paid
      </span>
    )
  }
  if (status === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shrink-0">
        <AlertTriangle className="w-3 h-3" />
        Overdue
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 shrink-0">
      <Clock className="w-3 h-3" />
      Due
    </span>
  )
}

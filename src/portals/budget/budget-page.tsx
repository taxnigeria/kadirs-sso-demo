import { useState, useMemo, Component, type ReactNode, type ErrorInfo } from 'react'
import {
  Plus,
  RotateCcw,
  Search,
  X,
  ArrowDown,
  ArrowUp,
  ArrowUpDown
} from 'lucide-react'
import { toast } from 'sonner'
import { useBudgetStore, useBudgetSummary, calculateEffectiveItemCost } from './budget-store'
import { BudgetSummaryStrip } from './components/budget-summary-strip'
import { BudgetAssumptionsSidebar } from './components/budget-assumptions-sidebar'
import { BudgetSlimRow } from './components/budget-slim-row'
import { BudgetAnalysisBottom } from './components/budget-analysis-bottom'
import { BudgetItemModal } from './components/budget-item-modal'
import type { BudgetItem, BudgetAssumptions } from './budget-types'
import { UniversalNavbar } from '@/components/layout/universal-navbar'

// Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class BudgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BudgetPage error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    try {
      useBudgetStore.getState().resetToBaseline()
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.href = '/budget'
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#18231d] border border-red-300 dark:border-red-900/60 rounded-xl p-6 shadow-lg space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-[var(--ink)] dark:text-white">
              Budget Model Notice
            </h2>
            <p className="text-xs text-[var(--ink-soft)] dark:text-[#9bb0a4] leading-relaxed">
              An unexpected condition occurred while calculating the financial model. You can restore the baseline model or reload the page.
            </p>
            {this.state.error?.message && (
              <pre className="text-[10px] bg-red-50 dark:bg-black/40 text-red-800 dark:text-red-300 p-2.5 rounded border border-red-200 dark:border-red-900/40 text-left overflow-x-auto font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-bold bg-[#0b6b3a] hover:bg-[#158a52] text-white rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Reset to Baseline Budget
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-semibold bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] text-[var(--ink)] rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

type SortField = 'title' | 'qty' | 'unit' | 'price' | 'total'
type SortDir = 'asc' | 'desc'

interface SortState {
  field: SortField | null
  dir: SortDir
}

function sortBudgetItems(
  items: BudgetItem[],
  sort: SortState,
  assumptions: BudgetAssumptions
): BudgetItem[] {
  if (!sort.field) return items

  const sorted = [...items]
  const rate = assumptions.rate > 0 ? assumptions.rate : 1500

  sorted.sort((a, b) => {
    let cmp = 0
    if (sort.field === 'title') {
      cmp = a.title.localeCompare(b.title)
    } else if (sort.field === 'qty') {
      const qA = calculateEffectiveItemCost(a, assumptions).effectiveQuantity
      const qB = calculateEffectiveItemCost(b, assumptions).effectiveQuantity
      cmp = qA - qB
    } else if (sort.field === 'unit') {
      cmp = (a.unitLabel || '').localeCompare(b.unitLabel || '')
    } else if (sort.field === 'price') {
      const priceA = a.currency === 'USD' ? a.unitRateNgn * rate : a.unitRateNgn
      const priceB = b.currency === 'USD' ? b.unitRateNgn * rate : b.unitRateNgn
      cmp = priceA - priceB
    } else if (sort.field === 'total') {
      const totalA = calculateEffectiveItemCost(a, assumptions).costNgn
      const totalB = calculateEffectiveItemCost(b, assumptions).costNgn
      cmp = totalA - totalB
    }

    return sort.dir === 'asc' ? cmp : -cmp
  })

  return sorted
}

interface SortHeaderBtnProps {
  label: string
  field: SortField
  currentSort: SortState
  onToggle: (field: SortField) => void
  align?: 'left' | 'center' | 'right'
}

function SortHeaderBtn({ label, field, currentSort, onToggle, align = 'left' }: SortHeaderBtnProps) {
  const isActive = currentSort.field === field
  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <button
      type="button"
      onClick={() => onToggle(field)}
      className={`inline-flex items-center gap-1 font-bold text-[11px] hover:text-[var(--ink)] dark:hover:text-white transition-colors cursor-pointer select-none ${justifyClass} ${
        isActive ? 'text-[#0b6b3a] dark:text-[#52c78d]' : 'text-[var(--ink-soft)] dark:text-[#85a396]'
      }`}
      title={`Sort by ${label} (${isActive ? (currentSort.dir === 'asc' ? 'ascending' : 'descending') : 'click to sort'})`}
    >
      <span>{label}</span>
      {isActive ? (
        currentSort.dir === 'asc' ? (
          <ArrowUp size={11} className="shrink-0" />
        ) : (
          <ArrowDown size={11} className="shrink-0" />
        )
      ) : (
        <ArrowUpDown size={10} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}

function BudgetPageContent() {
  const title = useBudgetStore((s) => s.title)
  const setTitle = useBudgetStore((s) => s.setTitle)
  const currency = useBudgetStore((s) => s.currency)
  const setCurrency = useBudgetStore((s) => s.setCurrency)
  const items = useBudgetStore((s) => s.items)
  const assumptions = useBudgetStore((s) => s.assumptions)
  const addItem = useBudgetStore((s) => s.addItem)
  const deleteItem = useBudgetStore((s) => s.deleteItem)
  const resetToBaseline = useBudgetStore((s) => s.resetToBaseline)
  const summary = useBudgetSummary()

  // Column Sort States
  const [buildSort, setBuildSort] = useState<SortState>({ field: null, dir: 'desc' })
  const [runningSort, setRunningSort] = useState<SortState>({ field: null, dir: 'desc' })

  const handleSortToggle = (
    currentSort: SortState,
    setSort: React.Dispatch<React.SetStateAction<SortState>>,
    field: SortField
  ) => {
    if (currentSort.field !== field) {
      const defaultDir: SortDir = field === 'title' || field === 'unit' ? 'asc' : 'desc'
      setSort({ field, dir: defaultDir })
    } else if (currentSort.dir === (field === 'title' || field === 'unit' ? 'asc' : 'desc')) {
      const oppositeDir: SortDir = currentSort.dir === 'asc' ? 'desc' : 'asc'
      setSort({ field, dir: oppositeDir })
    } else {
      setSort({ field: null, dir: 'desc' })
    }
  }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<BudgetItem | null>(null)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('engineering')

  const handleOpenAddModal = (catId = 'engineering') => {
    setItemToEdit(null)
    setDefaultCategoryId(catId)
    setIsModalOpen(true)
  }

  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  // Filter items by search query and section: Build (one-time) vs Running Costs (recurring)
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.unitLabel.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const buildItems = useMemo(() => {
    const raw = filteredItems.filter((i) => i.costType === 'one-time')
    return sortBudgetItems(raw, buildSort, assumptions)
  }, [filteredItems, buildSort, assumptions])

  const runningItems = useMemo(() => {
    const raw = filteredItems.filter((i) => i.costType === 'recurring')
    return sortBudgetItems(raw, runningSort, assumptions)
  }, [filteredItems, runningSort, assumptions])

  const formatMoney = (ngn: number, usd: number) => {
    const val = currency === 'NGN' ? ngn : usd
    const sym = currency === 'NGN' ? '₦' : '$'
    return `${sym}${Math.round(val).toLocaleString()}`
  }


  const handleDelete = (item: BudgetItem) => {
    deleteItem(item.id)
    toast.info(`Removed "${item.title}"`, {
      action: {
        label: 'Undo',
        onClick: () => useBudgetStore.getState().undoDelete()
      }
    })
  }

  const handleQuickAddLine = (costType: 'one-time' | 'recurring') => {
    addItem({
      title: costType === 'one-time' ? 'New build deliverable' : 'New operational service',
      categoryId: costType === 'one-time' ? 'engineering' : 'infrastructure',
      costType,
      unitRateNgn: costType === 'one-time' ? 1500000 : 50000,
      quantity: 1,
      periodMonths: 1,
      unitLabel: costType === 'one-time' ? 'lot' : 'plan',
      usageDriver: 'fixed',
      description: 'Custom user-added line item',
      currency: 'NGN'
    })
    toast.success(`Added new line to ${costType === 'one-time' ? 'Build' : 'Running costs'}`)
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col font-sans transition-colors">
      {/* Universal Top Nav */}
      <UniversalNavbar showNotice={false} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Header Bar: Editable Title & Currency Segmented Toggle */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex-1 min-w-[280px]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Budget Title"
              className="w-full text-xl sm:text-2xl font-black text-[var(--ink)] dark:text-white bg-transparent border border-transparent hover:border-[var(--line)] dark:hover:border-[#2a3a31] focus:border-[var(--line)] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0b6b3a] transition-all"
              aria-label="Budget title"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0 print:hidden">
            {/* Currency Segmented Toggle */}
            <div className="inline-flex border border-[var(--line)] dark:border-[#2a3a31] rounded-xl overflow-hidden bg-white dark:bg-[#18231d] shadow-2xs">
              <button
                type="button"
                onClick={() => setCurrency('NGN')}
                className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  currency === 'NGN'
                    ? 'bg-[#0b6b3a] text-white shadow-2xs'
                    : 'text-[var(--ink-soft)] dark:text-[#9bb0a4] hover:text-[var(--ink)] dark:hover:text-white'
                }`}
              >
                ₦ Naira
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-[#0b6b3a] text-white shadow-2xs'
                    : 'text-[var(--ink-soft)] dark:text-[#9bb0a4] hover:text-[var(--ink)] dark:hover:text-white'
                }`}
              >
                $ Dollars
              </button>
            </div>

            {/* Add Custom Item Button */}
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#0b6b3a] hover:bg-[#158a52] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Add a custom item with detailed scope description"
            >
              <Plus size={13} />
              Add Item
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={resetToBaseline}
              className="flex items-center gap-1 px-3 py-1.5 border border-[var(--line)] dark:border-[#2a3a31] bg-white dark:bg-[#18231d] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--ink-soft)] dark:text-[#9bb0a4] text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title="Reset all prices and assumptions to baseline"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        </header>


        {/* Sticky 4-Card KPI Top Summary Strip */}
        <BudgetSummaryStrip />

        {/* 2-Column Responsive Layout: Left Assumptions (~280px) + Right Slim Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
          {/* Left Column: Assumptions Sidebar */}
          <BudgetAssumptionsSidebar />

          {/* Right Column: Slim Table Sections */}
          <div className="space-y-4 min-w-0">
            {/* Search Filter Bar */}
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#18231d] border border-[var(--line)] dark:border-[#2a3a31] rounded-xl px-3 py-2 shadow-2xs">
              <div className="relative flex-1 flex items-center">
                <Search
                  size={14}
                  className="text-[var(--ink-soft)] dark:text-[#85a396] shrink-0 mr-2"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search line items or scope (e.g., SMS, NIMC, cloud, biometric)..."
                  className="w-full text-xs bg-transparent text-[var(--ink)] dark:text-[#e8f0eb] placeholder:text-[var(--ink-soft)] dark:placeholder:text-[#85a396] focus:outline-none"
                  aria-label="Search budget items"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 rounded text-[var(--ink-soft)] dark:text-[#85a396] hover:text-[var(--ink)] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {searchQuery && (
                <span className="text-[11px] font-semibold text-[var(--ink-soft)] dark:text-[#85a396] shrink-0">
                  {buildItems.length + runningItems.length} matching
                </span>
              )}
            </div>

            {/* Section 1: Build (One-Time CAPEX) */}
            <section className="bg-white dark:bg-[#18231d] border border-[var(--line)] dark:border-[#2a3a31] rounded-xl overflow-hidden shadow-xs">
              {/* Section Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--line)] dark:border-[#2a3a31] bg-[var(--field)] dark:bg-[#121b16]/50">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-extrabold text-base text-[var(--ink)] dark:text-[#e8f0eb]">
                    Build
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                    Paid once · {summary.devMonths}m dev phase
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-[var(--ink-soft)] dark:text-[#85a396] tracking-wider">
                    Build Subtotal
                  </div>
                  <div className="text-base sm:text-lg font-black text-[var(--ink)] dark:text-white tabular-nums">
                    {formatMoney(summary.buildTotalNgn, summary.buildTotalUsd)}
                  </div>
                </div>
              </div>

              {/* Table Column Header */}
              <div className="hidden md:grid grid-cols-[20px_minmax(0,1fr)_265px_110px_24px] gap-2 px-3 py-1.5 text-[11px] font-bold text-[var(--ink-soft)] dark:text-[#85a396] bg-[var(--paper)] dark:bg-[#14231c]">
                <span></span>
                <SortHeaderBtn
                  label="What"
                  field="title"
                  currentSort={buildSort}
                  onToggle={(f) => handleSortToggle(buildSort, setBuildSort, f)}
                />
                <div className="grid grid-cols-[50px_95px_10px_105px] gap-1">
                  <SortHeaderBtn
                    label="Qty"
                    field="qty"
                    currentSort={buildSort}
                    onToggle={(f) => handleSortToggle(buildSort, setBuildSort, f)}
                    align="center"
                  />
                  <SortHeaderBtn
                    label="Unit"
                    field="unit"
                    currentSort={buildSort}
                    onToggle={(f) => handleSortToggle(buildSort, setBuildSort, f)}
                    align="center"
                  />
                  <span></span>
                  <SortHeaderBtn
                    label="Price each"
                    field="price"
                    currentSort={buildSort}
                    onToggle={(f) => handleSortToggle(buildSort, setBuildSort, f)}
                    align="right"
                  />
                </div>
                <SortHeaderBtn
                  label="Total"
                  field="total"
                  currentSort={buildSort}
                  onToggle={(f) => handleSortToggle(buildSort, setBuildSort, f)}
                  align="right"
                />
                <span></span>
              </div>

              {/* Slim Table Rows */}
              <div>
                {buildItems.length > 0 ? (
                  buildItems.map((item) => (
                    <BudgetSlimRow
                      key={item.id}
                      item={item}
                      sectionTotalNgn={summary.buildTotalNgn}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-[var(--ink-soft)] dark:text-[#85a396]">
                    {searchQuery ? `No build items match "${searchQuery}"` : 'No build items in this model'}
                  </div>
                )}
              </div>

              {/* Add a line button */}
              <button
                type="button"
                onClick={() => handleQuickAddLine('one-time')}
                className="w-full text-left px-4 py-2.5 border-t border-dashed border-[var(--line)] dark:border-[#2a3a31] text-xs font-bold text-[#0b6b3a] dark:text-[#52c78d] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                Add a line to Build
              </button>
            </section>

            {/* Section 2: Running costs (Monthly OPEX) */}
            <section className="bg-white dark:bg-[#18231d] border border-[var(--line)] dark:border-[#2a3a31] rounded-xl overflow-hidden shadow-xs">
              {/* Section Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--line)] dark:border-[#2a3a31] bg-[var(--field)] dark:bg-[#121b16]/50">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-extrabold text-base text-[var(--ink)] dark:text-[#e8f0eb]">
                    Running costs
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Paid every month
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-[var(--ink-soft)] dark:text-[#85a396] tracking-wider">
                    Monthly Subtotal
                  </div>
                  <div className="text-base sm:text-lg font-black text-[var(--ink)] dark:text-white tabular-nums">
                    {formatMoney(summary.runningMonthlyNgn, summary.runningMonthlyUsd)}
                    <span className="text-xs font-normal text-[var(--ink-soft)] dark:text-[#9bb0a4]">/mo</span>
                  </div>
                </div>
              </div>

              {/* Table Column Header */}
              <div className="hidden md:grid grid-cols-[20px_minmax(0,1fr)_265px_110px_24px] gap-2 px-3 py-1.5 text-[11px] font-bold text-[var(--ink-soft)] dark:text-[#85a396] bg-[var(--paper)] dark:bg-[#14231c]">
                <span></span>
                <SortHeaderBtn
                  label="What"
                  field="title"
                  currentSort={runningSort}
                  onToggle={(f) => handleSortToggle(runningSort, setRunningSort, f)}
                />
                <div className="grid grid-cols-[50px_95px_10px_105px] gap-1">
                  <SortHeaderBtn
                    label="Qty"
                    field="qty"
                    currentSort={runningSort}
                    onToggle={(f) => handleSortToggle(runningSort, setRunningSort, f)}
                    align="center"
                  />
                  <SortHeaderBtn
                    label="Unit"
                    field="unit"
                    currentSort={runningSort}
                    onToggle={(f) => handleSortToggle(runningSort, setRunningSort, f)}
                    align="center"
                  />
                  <span></span>
                  <SortHeaderBtn
                    label="Price each"
                    field="price"
                    currentSort={runningSort}
                    onToggle={(f) => handleSortToggle(runningSort, setRunningSort, f)}
                    align="right"
                  />
                </div>
                <SortHeaderBtn
                  label="Total"
                  field="total"
                  currentSort={runningSort}
                  onToggle={(f) => handleSortToggle(runningSort, setRunningSort, f)}
                  align="right"
                />
                <span></span>
              </div>

              {/* Slim Table Rows */}
              <div>
                {runningItems.length > 0 ? (
                  runningItems.map((item) => (
                    <BudgetSlimRow
                      key={item.id}
                      item={item}
                      sectionTotalNgn={summary.runningMonthlyNgn}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-[var(--ink-soft)] dark:text-[#85a396]">
                    {searchQuery ? `No running items match "${searchQuery}"` : 'No running items in this model'}
                  </div>
                )}
              </div>

              {/* Add a line button */}
              <button
                type="button"
                onClick={() => handleQuickAddLine('recurring')}
                className="w-full text-left px-4 py-2.5 border-t border-dashed border-[var(--line)] dark:border-[#2a3a31] text-xs font-bold text-[#0b6b3a] dark:text-[#52c78d] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                Add a line to Running costs
              </button>
            </section>
          </div>
        </div>

        {/* Bottom Section: Straightforward Analysis & Export Tools */}
        <BudgetAnalysisBottom />
      </main>

      {/* Modal for Detailed Line Item Edits if triggered */}
      <BudgetItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itemToEdit={itemToEdit}
        defaultCategoryId={defaultCategoryId}
      />
    </div>
  )
}

export default function BudgetPage() {
  return (
    <BudgetErrorBoundary>
      <BudgetPageContent />
    </BudgetErrorBoundary>
  )
}

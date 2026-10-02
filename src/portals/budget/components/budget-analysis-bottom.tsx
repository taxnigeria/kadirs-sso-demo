import { useRef } from 'react'
import {
  Download,
  Upload,
  FileSpreadsheet,
  Link2,
  RotateCcw,
  Printer,
  Calendar,
  Sparkles,
  PieChart,
  ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { useBudgetStore, useBudgetSummary } from '../budget-store'
import {
  exportBudgetToJson,
  importBudgetFromJson,
  exportBudgetToCsv
} from '../budget-file-utils'

export function BudgetAnalysisBottom() {
  const currency = useBudgetStore((s) => s.currency)
  const assumptions = useBudgetStore((s) => s.assumptions)
  const items = useBudgetStore((s) => s.items)
  const activeScenarioId = useBudgetStore((s) => s.activeScenarioId)
  const isCustomized = useBudgetStore((s) => s.isCustomized)
  const resetToBaseline = useBudgetStore((s) => s.resetToBaseline)
  const importFromPayload = useBudgetStore((s) => s.importFromPayload)
  const getShareableLink = useBudgetStore((s) => s.getShareableLink)
  const summary = useBudgetSummary()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatMoney = (ngn: number, usd: number) => {
    const val = currency === 'NGN' ? ngn : usd
    const sym = currency === 'NGN' ? '₦' : '$'
    return `${sym}${Math.round(val).toLocaleString()}`
  }

  const handleCopyLink = () => {
    try {
      const link = getShareableLink()
      navigator.clipboard.writeText(link)
      toast.success('Shareable link copied to clipboard!', {
        description: 'Anyone who opens this link will see your exact custom quantities, rates, and assumptions.'
      })
    } catch {
      toast.error('Could not copy link to clipboard.')
    }
  }

  const handleExportJson = () => {
    exportBudgetToJson({
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      currency,
      fxRate: assumptions.rate,
      monthlyActiveUsers: assumptions.users,
      activeScenarioId,
      summary,
      items
    })
    toast.success('Budget exported as JSON file')
  }

  const handleExportCsv = () => {
    exportBudgetToCsv({
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      currency,
      fxRate: assumptions.rate,
      monthlyActiveUsers: assumptions.users,
      activeScenarioId,
      summary,
      items
    })
    toast.success('Budget exported as CSV spreadsheet')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const payload = await importBudgetFromJson(file)
      importFromPayload(payload)
      toast.success('Budget loaded successfully from JSON file!', {
        description: `Restored ${payload.items.length} items at ${payload.currency}.`
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid JSON file.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <section className="border-t border-[var(--line)] dark:border-[#2a3a31] pt-6 space-y-4">
      {/* Title & Understated Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--line)]/50 dark:border-[#2a3a31]/50">
        <div>
          <h3 className="text-sm font-bold text-[var(--ink)] dark:text-[#e8f0eb]">
            Multi-Year Lifecycle &amp; Analysis
          </h3>
          <p className="text-xs text-[var(--ink-soft)] dark:text-[#9bb0a4]">
            Projections across 1-year and 3-year operational horizons
          </p>
        </div>

        {/* Toolbar Actions: Subdued ghost/outline styling */}
        <div className="flex flex-wrap items-center gap-1.5 print:hidden">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[var(--ink)] dark:text-[#c2d6cc] transition-colors cursor-pointer"
          >
            <Link2 size={13} />
            Copy Link
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[var(--ink)] dark:text-[#c2d6cc] transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={13} />
            CSV
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[var(--ink)] dark:text-[#c2d6cc] transition-colors cursor-pointer"
          >
            <Download size={13} />
            JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[var(--ink)] dark:text-[#c2d6cc] transition-colors cursor-pointer"
          >
            <Upload size={13} />
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[var(--ink)] dark:text-[#c2d6cc] transition-colors cursor-pointer"
          >
            <Printer size={13} />
            Print
          </button>

          {isCustomized && (
            <button
              type="button"
              onClick={resetToBaseline}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink-soft)] dark:text-[#85a396] hover:text-red-500 transition-colors cursor-pointer"
              title="Reset all prices and assumptions to research baseline"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 4 Metric Cards: Subdued styling without loud colors or shadows */}
      {(() => {
        const ceilingTargetNgn = 48_000_000
        const headroomNgn = ceilingTargetNgn - summary.year1TcoNgn
        const headroomUsd = headroomNgn / (assumptions.rate > 0 ? assumptions.rate : 1500)

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1-Year TCO */}
            <div className="p-3.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ink-soft)] dark:text-[#85a396] uppercase tracking-wider">
                <span>First-Year Program Total</span>
                <Calendar size={13} className="text-[var(--ink-soft)] dark:text-[#85a396]" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-[var(--ink)] dark:text-[#e8f0eb] tabular-nums">
                {formatMoney(summary.year1TcoNgn, summary.year1TcoUsd)}
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] dark:text-[#9bb0a4]">
                ₦34.0M build + 12m running OPEX
              </p>
            </div>

            {/* Ceiling Headroom */}
            <div className="p-3.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ink-soft)] dark:text-[#85a396] uppercase tracking-wider">
                <span>Headroom Under ₦48M</span>
                <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className={`text-lg sm:text-xl font-bold tabular-nums ${headroomNgn >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {headroomNgn >= 0 ? `+${formatMoney(headroomNgn, headroomUsd)}` : formatMoney(headroomNgn, headroomUsd)}
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] dark:text-[#9bb0a4]">
                Target ceiling: ₦48.0M max
              </p>
            </div>

            {/* 3-Year Project Lifecycle */}
            <div className="p-3.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ink-soft)] dark:text-[#85a396] uppercase tracking-wider">
                <span>3-Year Sovereign Lifecycle</span>
                <Sparkles size={13} className="text-[var(--ink-soft)] dark:text-[#85a396]" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-[var(--ink)] dark:text-[#e8f0eb] tabular-nums">
                {formatMoney(summary.year3LifecycleNgn, summary.year3LifecycleUsd)}
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] dark:text-[#9bb0a4]">
                Build + 36m sovereign operations
              </p>
            </div>

            {/* Efficiency & Unit Economics */}
            <div className="p-3.5 rounded-lg border border-[var(--line)] dark:border-[#2a3a31] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ink-soft)] dark:text-[#85a396] uppercase tracking-wider">
                <span>Citizen Operational Cost</span>
                <PieChart size={13} className="text-[var(--ink-soft)] dark:text-[#85a396]" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-[var(--ink)] dark:text-[#e8f0eb] tabular-nums">
                {currency === 'NGN'
                  ? `₦${summary.costPerUserPerMonthNgn.toFixed(2)}`
                  : `$${summary.costPerUserPerMonthUsd.toFixed(2)}`}
                <span className="text-xs font-normal text-[var(--ink-soft)] dark:text-[#9bb0a4] ml-1">/ taxpayer / mo</span>
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] dark:text-[#9bb0a4]">
                Across {assumptions.users.toLocaleString()} active taxpayers
              </p>
            </div>
          </div>
        )
      })()}

      {/* Visual Category Allocation Stacked Bar */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb]">
          <span className="flex items-center gap-1 text-[var(--ink-soft)] dark:text-[#9bb0a4]">
            <PieChart size={13} />
            Category Investment Allocation
          </span>
          <span className="text-[var(--ink-soft)] dark:text-[#85a396] text-[11px]">
            {summary.totalActiveItems} of {summary.totalItems} active line items
          </span>
        </div>

        <div className="h-2 w-full bg-[var(--line)] dark:bg-[#2a3a31] rounded-full overflow-hidden flex">
          {summary.categoryBreakdown.map((cat) => {
            if (cat.percentage <= 0) return null
            return (
              <div
                key={cat.categoryId}
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.accentColor }}
                className="h-full transition-all duration-300"
                title={`${cat.title}: ${cat.percentage}% (${formatMoney(cat.year1TcoNgn, cat.year1TcoUsd)})`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-0.5 text-[11px]">
          {summary.categoryBreakdown.map((cat) => (
            <div key={cat.categoryId} className="flex items-center gap-1.5 truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.accentColor }}
              />
              <span className="truncate text-[var(--ink-soft)] dark:text-[#9bb0a4]">
                {cat.title.split('.')[1] || cat.title}:
              </span>
              <strong className="text-[var(--ink)] dark:text-white tabular-nums">{cat.percentage}%</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

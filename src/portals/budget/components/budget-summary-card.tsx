import React, { useRef } from 'react'
import {
  Download,
  Upload,
  FileSpreadsheet,
  Link2,
  RotateCcw,
  Printer,
  Calendar,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { useBudgetStore, useBudgetSummary } from '../budget-store'
import {
  exportBudgetToJson,
  importBudgetFromJson,
  exportBudgetToCsv
} from '../budget-file-utils'

export function BudgetSummaryCard() {
  const currency = useBudgetStore((s) => s.currency)
  const setCurrency = useBudgetStore((s) => s.setCurrency)
  const fxRate = useBudgetStore((s) => s.fxRate)
  const setFxRate = useBudgetStore((s) => s.setFxRate)
  const mau = useBudgetStore((s) => s.monthlyActiveUsers)
  const items = useBudgetStore((s) => s.items)
  const activeScenarioId = useBudgetStore((s) => s.activeScenarioId)
  const isCustomized = useBudgetStore((s) => s.isCustomized)
  const summary = useBudgetSummary()
  const resetToBaseline = useBudgetStore((s) => s.resetToBaseline)
  const importFromPayload = useBudgetStore((s) => s.importFromPayload)
  const getShareableLink = useBudgetStore((s) => s.getShareableLink)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatMoney = (ngn: number, usd: number, compact = false) => {
    const val = currency === 'NGN' ? ngn : usd
    const sym = currency === 'NGN' ? '₦' : '$'

    if (compact) {
      if (val >= 1_000_000_000) {
        return `${sym}${(val / 1_000_000_000).toFixed(2)}B`
      }
      if (val >= 1_000_000) {
        return `${sym}${(val / 1_000_000).toFixed(1)}M`
      }
      if (val >= 1_000) {
        return `${sym}${(val / 1_000).toFixed(0)}k`
      }
      return `${sym}${Math.round(val)}`
    }

    return `${sym}${Math.round(val).toLocaleString()}`
  }

  const handleCopyLink = () => {
    try {
      const link = getShareableLink()
      navigator.clipboard.writeText(link)
      toast.success('Shareable link copied to clipboard!', {
        description: 'Anyone who opens this link will see your exact customized prices and user volume.'
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
      fxRate,
      monthlyActiveUsers: mau,
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
      fxRate,
      monthlyActiveUsers: mau,
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
        description: `Restored ${payload.items.length} items at ${payload.currency} (${payload.monthlyActiveUsers?.toLocaleString() || '100k'} MAU).`
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid JSON file.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <aside className="space-y-4 print:space-y-2">
      <div className="bg-white dark:bg-[#13241E] border border-[var(--line)] dark:border-[#22382F] rounded-lg p-5 shadow-sm space-y-5">
        {/* Header / Currency Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] dark:border-[#22382F]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-[var(--gold)]">
                FINANCIAL SUMMARY
              </span>
              {isCustomized && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300">
                  Customized
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-[var(--ink)] dark:text-white">
              Total Investment
            </h2>
          </div>

          {/* Currency Toggle */}
          <div className="inline-flex p-1 bg-[var(--paper)] dark:bg-[#1B3129] rounded-md border border-[var(--line)] dark:border-[#2B483C]">
            <button
              type="button"
              onClick={() => setCurrency('NGN')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                currency === 'NGN'
                  ? 'bg-[var(--green)] text-white shadow-xs'
                  : 'text-[var(--ink-soft)] dark:text-[#A3BFB3] hover:text-[var(--ink)]'
              }`}
            >
              ₦ NGN
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                currency === 'USD'
                  ? 'bg-[var(--green)] text-white shadow-xs'
                  : 'text-[var(--ink-soft)] dark:text-[#A3BFB3] hover:text-[var(--ink)]'
              }`}
            >
              $ USD
            </button>
          </div>
        </div>

        {/* FX Rate Input (Only shown or highlighted when relevant) */}
        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-[var(--paper)] dark:bg-[#182C24] rounded border border-[var(--line-soft)] dark:border-[#22382F]">
          <span className="text-[var(--ink-soft)] dark:text-[#85A396] font-medium">
            FX Reference Rate:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--ink-soft)] dark:text-[#85A396]">1 USD = ₦</span>
            <input
              type="number"
              min={1}
              value={fxRate}
              onChange={(e) => setFxRate(parseFloat(e.target.value) || 1)}
              className="w-16 px-1.5 py-0.5 text-xs font-bold bg-white dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded text-right focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            />
          </div>
        </div>

        {/* Hero KPI: Year 1 Total Cost of Ownership */}
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-300">
              Year-1 Total Cost of Ownership (TCO)
            </span>
            <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
              {formatMoney(summary.year1TcoNgn, summary.year1TcoUsd, true)}
            </div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              CAPEX + 12M OPEX
            </div>
          </div>
          <div className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80 font-mono">
            Exact: {formatMoney(summary.year1TcoNgn, summary.year1TcoUsd, false)}
          </div>
        </div>

        {/* 2-Column Split: One-Time CAPEX vs Recurring OPEX */}
        <div className="grid grid-cols-2 gap-3">
          {/* CAPEX */}
          <div className="p-3 rounded-lg bg-[var(--paper)] dark:bg-[#182C24] border border-[var(--line)] dark:border-[#22382F] space-y-1">
            <div className="text-[11px] font-bold text-[var(--ink-soft)] dark:text-[#85A396] uppercase tracking-wider">
              One-Time (CAPEX)
            </div>
            <div className="text-lg font-black text-[var(--ink)] dark:text-white">
              {formatMoney(summary.capexTotalNgn, summary.capexTotalUsd, true)}
            </div>
            <div className="text-[10px] text-[var(--ink-soft)] dark:text-[#A3BFB3] font-mono truncate">
              {formatMoney(summary.capexTotalNgn, summary.capexTotalUsd, false)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
              Dev, Audits &amp; Training
            </div>
          </div>

          {/* Monthly OPEX */}
          <div className="p-3 rounded-lg bg-[var(--paper)] dark:bg-[#182C24] border border-[var(--line)] dark:border-[#22382F] space-y-1">
            <div className="text-[11px] font-bold text-[var(--ink-soft)] dark:text-[#85A396] uppercase tracking-wider">
              Monthly (OPEX)
            </div>
            <div className="text-lg font-black text-[var(--ink)] dark:text-white">
              {formatMoney(summary.totalMonthlyOpexNgn, summary.totalMonthlyOpexUsd, true)}
              <span className="text-xs font-normal text-[var(--ink-soft)]">/mo</span>
            </div>
            <div className="text-[10px] text-[var(--ink-soft)] dark:text-[#A3BFB3] font-mono truncate">
              {formatMoney(summary.totalMonthlyOpexNgn, summary.totalMonthlyOpexUsd, false)}
            </div>
            <div className="text-[10px] text-[var(--ink-soft)] dark:text-[#85A396] flex items-center justify-between pt-1">
              <span>Fix: {formatMoney(summary.fixedMonthlyOpexNgn, summary.fixedMonthlyOpexUsd, true)}</span>
              <span>Var: {formatMoney(summary.variableMonthlyOpexNgn, summary.variableMonthlyOpexUsd, true)}</span>
            </div>
          </div>
        </div>

        {/* Multi-Horizon Projections */}
        <div className="space-y-2 pt-2 border-t border-[var(--line-soft)] dark:border-[#182C24]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] dark:text-[#A3BFB3] flex items-center gap-1.5">
              <Calendar size={13} /> Annual Recurring OPEX (12m):
            </span>
            <span className="font-bold text-[var(--ink)] dark:text-white font-mono">
              {formatMoney(summary.annualOpexNgn, summary.annualOpexUsd, false)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-soft)] dark:text-[#A3BFB3] flex items-center gap-1.5">
              <Calendar size={13} /> 3-Year Project Lifecycle Total:
            </span>
            <span className="font-extrabold text-[var(--gold)] font-mono">
              {formatMoney(summary.year3LifecycleNgn, summary.year3LifecycleUsd, false)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--line-soft)] dark:border-[#182C24]">
            <span className="text-[var(--ink-soft)] dark:text-[#A3BFB3]">Active Line Items:</span>
            <span className="font-bold text-[var(--ink)] dark:text-white">
              {summary.totalActiveItems} of {summary.totalItems} active
            </span>
          </div>
        </div>

        {/* Visual Category Allocation Stacked Bar */}
        <div className="space-y-2 pt-2 border-t border-[var(--line-soft)] dark:border-[#182C24]">
          <div className="flex justify-between text-xs font-semibold text-[var(--ink)] dark:text-[#F0F7F4]">
            <span>Investment Distribution</span>
            <span className="text-[var(--ink-soft)] dark:text-[#85A396]">1-Year TCO %</span>
          </div>
          <div className="h-2.5 w-full bg-[var(--line)] dark:bg-[#22382F] rounded-full overflow-hidden flex">
            {summary.categoryBreakdown.map((cat) => {
              if (cat.percentage <= 0) return null
              return (
                <div
                  key={cat.categoryId}
                  style={{ width: `${cat.percentage}%`, backgroundColor: cat.accentColor }}
                  className="h-full transition-all duration-300"
                  title={`${cat.title}: ${cat.percentage}% (${formatMoney(cat.year1TcoNgn, cat.year1TcoUsd, true)})`}
                />
              )
            })}
          </div>

          {/* Mini Legend */}
          <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-[var(--ink-soft)] dark:text-[#A3BFB3]">
            {summary.categoryBreakdown.map((cat) => (
              <div key={cat.categoryId} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.accentColor }}
                />
                <span className="truncate">{cat.title.split('.')[1] || cat.title}:</span>
                <strong className="text-[var(--ink)] dark:text-white font-mono">{cat.percentage}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Share & File Action Toolbar */}
        <div className="space-y-2 pt-3 border-t border-[var(--line)] dark:border-[#22382F] print:hidden">
          {/* Shareable Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-[var(--green)] hover:bg-[#158A52] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Link2 size={15} />
            Copy Shareable Link
          </button>

          {/* JSON & CSV Export / Import Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] hover:border-[var(--green)] text-xs font-semibold text-[var(--ink)] dark:text-[#C2D6CC] transition-colors cursor-pointer"
              title="Download entire budget as a .json file"
            >
              <Download size={13} />
              Export JSON
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] hover:border-[var(--green)] text-xs font-semibold text-[var(--ink)] dark:text-[#C2D6CC] transition-colors cursor-pointer"
              title="Upload a .json budget file to restore state"
            >
              <Upload size={13} />
              Import JSON
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
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] hover:border-[var(--green)] text-xs font-semibold text-[var(--ink)] dark:text-[#C2D6CC] transition-colors cursor-pointer"
              title="Export as Excel / CSV spreadsheet"
            >
              <FileSpreadsheet size={13} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] hover:border-[var(--green)] text-xs font-semibold text-[var(--ink)] dark:text-[#C2D6CC] transition-colors cursor-pointer"
              title="Print executive tender brief or save as PDF"
            >
              <Printer size={13} />
              Print / PDF
            </button>
          </div>

          {/* Reset Action */}
          {isCustomized && (
            <button
              type="button"
              onClick={resetToBaseline}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[var(--ink-soft)] dark:text-[#85A396] hover:text-[var(--danger)] transition-colors cursor-pointer pt-1"
            >
              <RotateCcw size={12} />
              Reset to Research Baseline
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

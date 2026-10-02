import { useBudgetStore, useBudgetSummary } from '../budget-store'

export function BudgetSummaryStrip() {
  const currency = useBudgetStore((s) => s.currency)
  const summary = useBudgetSummary()

  const formatMoney = (ngn: number, usd: number) => {
    const val = currency === 'NGN' ? ngn : usd
    const sym = currency === 'NGN' ? '₦' : '$'
    return `${sym}${Math.round(val).toLocaleString()}`
  }

  const formatCompact = (ngn: number, usd: number) => {
    const val = currency === 'NGN' ? ngn : usd
    const sym = currency === 'NGN' ? '₦' : '$'
    if (val >= 1_000_000_000) return `${sym}${(val / 1_000_000_000).toFixed(2)}B`
    if (val >= 1_000_000) return `${sym}${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `${sym}${(val / 1_000).toFixed(0)}k`
    return `${sym}${Math.round(val)}`
  }

  return (
    <div
      className="sticky top-2 z-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.45fr_1fr] gap-px bg-[var(--line)] dark:bg-[#2a3a31] border border-[var(--line)] dark:border-[#2a3a31] rounded-xl overflow-hidden shadow-md"
      aria-live="polite"
    >
      {/* 1. Build (once) */}
      <div className="bg-white dark:bg-[#18231d] p-3 sm:p-4 min-w-0">
        <div className="text-xs font-semibold text-[var(--ink-soft)] dark:text-[#9bb0a4]">
          Build (once)
        </div>
        <div className="text-xl sm:text-2xl font-black text-[var(--ink)] dark:text-[#e8f0eb] tabular-nums truncate">
          {formatMoney(summary.buildTotalNgn, summary.buildTotalUsd)}
        </div>
        <div className="text-xs text-[var(--ink-soft)] dark:text-[#9bb0a4] tabular-nums">
          {currency === 'NGN'
            ? `≈ $${Math.round(summary.buildTotalUsd).toLocaleString()}`
            : `≈ ₦${Math.round(summary.buildTotalNgn).toLocaleString()}`}
        </div>
      </div>

      {/* 2. Running cost (each month) */}
      <div className="bg-white dark:bg-[#18231d] p-3 sm:p-4 min-w-0">
        <div className="text-xs font-semibold text-[var(--ink-soft)] dark:text-[#9bb0a4]">
          Running cost (each month)
        </div>
        <div className="text-xl sm:text-2xl font-black text-[var(--ink)] dark:text-[#e8f0eb] tabular-nums truncate">
          {formatMoney(summary.runningMonthlyNgn, summary.runningMonthlyUsd)}
        </div>
        <div className="text-xs text-[var(--ink-soft)] dark:text-[#9bb0a4] tabular-nums">
          {currency === 'NGN'
            ? `≈ $${Math.round(summary.runningMonthlyUsd).toLocaleString()}`
            : `≈ ₦${Math.round(summary.runningMonthlyNgn).toLocaleString()}`}
        </div>
      </div>

      {/* 3. Highlighted Grand Total Card */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-[#0b6b3a] dark:bg-[#14532d] text-white p-3.5 sm:p-4 min-w-0 shadow-inner">
        <div className="text-xs font-bold text-emerald-100 flex items-center justify-between">
          <span>Total for {summary.budgetMonths} months</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-black/20 text-white">
            Grand Total
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums truncate my-0.5">
          {formatMoney(summary.grandTotalNgn, summary.grandTotalUsd)}
        </div>
        <div className="text-[11px] text-emerald-100/90 leading-tight">
          {formatCompact(summary.buildTotalNgn, summary.buildTotalUsd)} build + {summary.budgetMonths} ×{' '}
          {formatCompact(summary.runningMonthlyNgn, summary.runningMonthlyUsd)} running
          {summary.safetyBufferPercent > 0
            ? ` + ${summary.safetyBufferPercent}% buffer (${formatCompact(summary.bufferAmountNgn, summary.bufferAmountUsd)})`
            : ` (incl. ₦3M contingency)`}
        </div>
      </div>

      {/* 4. Cost per user, per month */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-white dark:bg-[#18231d] p-3 sm:p-4 min-w-0">
        <div className="text-xs font-semibold text-[var(--ink-soft)] dark:text-[#9bb0a4]">
          Cost per user, per month
        </div>
        <div className="text-xl sm:text-2xl font-black text-[var(--ink)] dark:text-[#e8f0eb] tabular-nums truncate">
          {currency === 'NGN'
            ? `₦${summary.costPerUserPerMonthNgn.toFixed(2)}`
            : `$${summary.costPerUserPerMonthUsd.toFixed(2)}`}
        </div>
        <div className="text-xs text-[var(--ink-soft)] dark:text-[#9bb0a4]">
          running cost ÷ monthly users
        </div>
      </div>
    </div>
  )
}

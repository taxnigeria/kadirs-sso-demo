import type { BudgetItem, BudgetSummary, Currency } from './budget-types'

export interface ExportBudgetPayload {
  version: string
  exportedAt: string
  currency: Currency
  fxRate: number
  monthlyActiveUsers: number
  activeScenarioId?: string
  summary: BudgetSummary
  items: BudgetItem[]
}

/**
 * Trigger download of the complete budget state as a JSON file
 */
export function exportBudgetToJson(payload: ExportBudgetPayload) {
  const jsonStr = JSON.stringify(payload, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const dateStr = new Date().toISOString().split('T')[0]
  const a = document.createElement('a')
  a.href = url
  a.download = `kadirs-auth-budget-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse and validate an uploaded JSON file
 */
export function importBudgetFromJson(file: File): Promise<ExportBudgetPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = JSON.parse(text)
        if (!parsed || !Array.isArray(parsed.items)) {
          throw new Error('Invalid budget JSON structure: missing items array.')
        }
        resolve(parsed as ExportBudgetPayload)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse JSON file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })
}

/**
 * Format and download an executive CSV spreadsheet openable in Excel / Sheets
 */
export function exportBudgetToCsv(payload: ExportBudgetPayload) {
  const { items, summary, fxRate, monthlyActiveUsers } = payload
  const fxLabel = `1 USD = ${fxRate.toLocaleString()} NGN`

  const headers = [
    'Category ID',
    'Item Title',
    'Cost Type',
    'Status',
    'Unit Rate (NGN)',
    'Quantity',
    'Period (Months)',
    'Unit Label',
    'Effective Monthly / One-Time (NGN)',
    'Effective Total (USD)',
    'Notes / Description'
  ]

  const rows = items.map((item) => {
    let effectiveCostNgn = 0
    if (item.costType === 'one-time') {
      effectiveCostNgn = item.unitRateNgn * item.quantity * item.periodMonths
    } else {
      if (item.usageDriver === 'mau_otp') {
        effectiveCostNgn = monthlyActiveUsers * (item.driverMultiplier ?? 1.2) * item.unitRateNgn
      } else if (item.usageDriver === 'mau_nimc') {
        effectiveCostNgn = monthlyActiveUsers * (item.driverMultiplier ?? 0.15) * item.unitRateNgn
      } else if (item.usageDriver === 'mau_cac') {
        effectiveCostNgn = monthlyActiveUsers * (item.driverMultiplier ?? 0.02) * item.unitRateNgn
      } else if (item.usageDriver === 'mau_cloud') {
        effectiveCostNgn = (monthlyActiveUsers / 1000) * (item.driverMultiplier ?? 10) * item.unitRateNgn
      } else {
        effectiveCostNgn = item.unitRateNgn * item.quantity
      }
    }

    const effectiveCostUsd = effectiveCostNgn / fxRate

    return [
      `"${item.categoryId}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.costType.toUpperCase()}"`,
      item.isEnabled ? '"ACTIVE"' : '"DISABLED / EXCLUDED"',
      item.unitRateNgn,
      item.quantity,
      item.periodMonths,
      `"${item.unitLabel}"`,
      Math.round(effectiveCostNgn),
      effectiveCostUsd.toFixed(2),
      `"${(item.description || '').replace(/"/g, '""')}"`
    ].join(',')
  })

  // Add Executive Summary Section at bottom
  const summaryRows = [
    '',
    '--- EXECUTIVE BUDGET SUMMARY ---',
    `FX Rate Reference: ${fxLabel}`,
    `Simulated Monthly Active Users (MAU): ${monthlyActiveUsers.toLocaleString()} citizens`,
    `Active Items: ${summary.totalActiveItems} of ${summary.totalItems} items`,
    '',
    `Total One-Time CAPEX (NGN):,${Math.round(summary.capexTotalNgn)},Total One-Time CAPEX (USD):,$${summary.capexTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `Fixed Monthly OPEX (NGN):,${Math.round(summary.fixedMonthlyOpexNgn)},Fixed Monthly OPEX (USD):,$${summary.fixedMonthlyOpexUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `Variable Monthly OPEX (NGN):,${Math.round(summary.variableMonthlyOpexNgn)},Variable Monthly OPEX (USD):,$${summary.variableMonthlyOpexUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `Total Monthly OPEX (NGN):,${Math.round(summary.totalMonthlyOpexNgn)},Total Monthly OPEX (USD):,$${summary.totalMonthlyOpexUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `Annualized OPEX (12 Months NGN):,${Math.round(summary.annualOpexNgn)},Annualized OPEX (12 Months USD):,$${summary.annualOpexUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `1-Year Total Cost of Ownership (TCO NGN):,${Math.round(summary.year1TcoNgn)},1-Year TCO (USD):,$${summary.year1TcoUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `3-Year Project Lifecycle Total (NGN):,${Math.round(summary.year3LifecycleNgn)},3-Year Lifecycle Total (USD):,$${summary.year3LifecycleUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `Operating Cost per Citizen / Month (NGN):,${summary.costPerCitizenPerMonthNgn.toFixed(2)},Operating Cost per Citizen / Month (USD):,$${summary.costPerCitizenPerMonthUsd.toFixed(2)}`
  ]

  const csvContent = [headers.join(','), ...rows, ...summaryRows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const dateStr = new Date().toISOString().split('T')[0]
  const a = document.createElement('a')
  a.href = url
  a.download = `kadirs-auth-budget-${dateStr}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

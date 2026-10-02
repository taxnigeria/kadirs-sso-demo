export type CostType = 'one-time' | 'recurring'

export type UsageDriver = 'fixed' | 'mau_otp' | 'mau_nimc' | 'mau_cac' | 'mau_cloud'

export type Currency = 'NGN' | 'USD'

export interface BudgetAssumptions {
  rate: number       // Exchange rate (₦ for $1, default: 1500)
  devMonths: number  // Total development timeframe (months, default: 6)
  users: number      // Average users per month (MAU, default: 100,000)
  lpu: number        // Logins per user, per month (default: 8)
  otp: number        // Logins needing SMS code (%) (default: 30)
  reg: number        // New registrations per month (default: 15,000)
  months: number     // Operational months to budget for (default: 12)
  cont: number       // Safety buffer / contingency (%) (default: 10)
}

export interface BudgetItem {
  id: string
  categoryId: string
  title: string
  description: string
  costType: CostType
  unitRateNgn: number
  quantity: number
  periodMonths: number
  usageDriver: UsageDriver
  driverMultiplier?: number
  unitLabel: string
  isEnabled: boolean
  isCustom?: boolean
  notes?: string
  currency?: Currency
  isAutoQuantity?: boolean
}

export interface BudgetCategory {
  id: string
  title: string
  description: string
  iconName: string
  accentColor: string
}

export interface BudgetScenario {
  id: string
  name: string
  badge: string
  description: string
  mau: number
}

export interface CategoryBreakdown {
  categoryId: string
  title: string
  accentColor: string
  oneTimeNgn: number
  monthlyNgn: number
  annualizedNgn: number
  year1TcoNgn: number
  oneTimeUsd: number
  monthlyUsd: number
  annualizedUsd: number
  year1TcoUsd: number
  percentage: number
}

export interface BudgetSummary {
  // Primary KPI metrics for top sticky header
  buildTotalNgn: number
  buildTotalUsd: number
  runningMonthlyNgn: number
  runningMonthlyUsd: number
  grandTotalNgn: number
  grandTotalUsd: number
  bufferAmountNgn: number
  bufferAmountUsd: number
  costPerUserPerMonthNgn: number
  costPerUserPerMonthUsd: number

  // Assumptions & Derived volumes
  budgetMonths: number
  devMonths: number
  safetyBufferPercent: number
  totalLoginsPerMonth: number
  totalOtpPerMonth: number
  totalRegistrationsPerMonth: number

  // Multi-horizon TCO & Legacy aliases for backwards compatibility
  capexTotalNgn: number
  capexTotalUsd: number
  fixedMonthlyOpexNgn: number
  fixedMonthlyOpexUsd: number
  variableMonthlyOpexNgn: number
  variableMonthlyOpexUsd: number
  totalMonthlyOpexNgn: number
  totalMonthlyOpexUsd: number
  annualOpexNgn: number
  annualOpexUsd: number
  year1TcoNgn: number
  year1TcoUsd: number
  year3LifecycleNgn: number
  year3LifecycleUsd: number
  costPerCitizenPerMonthNgn: number
  costPerCitizenPerMonthUsd: number
  totalActiveItems: number
  totalItems: number
  categoryBreakdown: CategoryBreakdown[]
}

export interface BudgetExportPayload {
  metadata: {
    platform: string
    version: string
    exportedAt: string
    currency: Currency
    fxRate: number
    monthlyActiveUsers: number
  }
  summary: {
    capexNgn: number
    monthlyOpexNgn: number
    annualOpexNgn: number
    year1TcoNgn: number
    year3LifecycleNgn: number
    costPerCitizenNgn: number
    capexUsd: number
    monthlyOpexUsd: number
    annualOpexUsd: number
    year1TcoUsd: number
    year3LifecycleUsd: number
    costPerCitizenUsd: number
  }
  items: BudgetItem[]
}

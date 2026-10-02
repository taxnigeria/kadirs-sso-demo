import { useMemo } from 'react'
import { create } from 'zustand'
import budgetJson from '@/data/budget-data.json'
import type {
  BudgetItem,
  BudgetCategory,
  BudgetScenario,
  BudgetSummary,
  Currency,
  CategoryBreakdown,
  CostType,
  UsageDriver,
  BudgetAssumptions
} from './budget-types'
import {
  deserializeBudgetDelta,
  buildShareableUrl,
  buildRelativeUrl,
  type BudgetDelta
} from './budget-url-sync'
import type { ExportBudgetPayload } from './budget-file-utils'

export const DEFAULT_TITLE = 'KADIRS Auth System 2.0 — Cost-Optimized Budget (Lean R1.0 Pilot)'

export const DEFAULT_ASSUMPTIONS: BudgetAssumptions = {
  rate: budgetJson.defaultFxRate || 1500,
  devMonths: 2,
  users: budgetJson.defaultMau || 10000,
  lpu: 3,
  otp: 100,
  reg: 2000,
  months: 12,
  cont: 0
}

interface BudgetState {
  // State
  title: string
  items: BudgetItem[]
  categories: BudgetCategory[]
  scenarios: BudgetScenario[]
  activeScenarioId: string
  assumptions: BudgetAssumptions
  currency: Currency
  lastDeletedItem: BudgetItem | null
  isCustomized: boolean

  // Legacy aliases for backward compatibility
  monthlyActiveUsers: number
  fxRate: number

  // Edit mode lock state (locked in view-only mode by default)
  isEditMode: boolean
  toggleEditMode: () => void
  setEditMode: (enabled: boolean) => void

  // Actions
  setTitle: (title: string) => void
  setCurrency: (currency: Currency) => void
  setAssumption: <K extends keyof BudgetAssumptions>(key: K, value: BudgetAssumptions[K]) => void
  setScenario: (scenarioId: string) => void
  toggleItem: (id: string) => void
  updateItemPrice: (id: string, newRateNgn: number, newQuantity?: number, newPeriod?: number) => void
  updateItemRow: (id: string, updates: Partial<BudgetItem>) => void
  updateItem: (id: string, updates: Partial<BudgetItem>) => void
  addItem: (item: Omit<BudgetItem, 'id' | 'isEnabled'> & { isEnabled?: boolean }) => string
  deleteItem: (id: string) => void
  undoDelete: () => void
  resetToBaseline: () => void
  importFromPayload: (payload: ExportBudgetPayload) => void
  getShareableLink: () => string
  getSummary: () => BudgetSummary
  getEffectiveItemCost: (item: BudgetItem) => { costNgn: number; costUsd: number; effectiveQuantity: number; effectivePeriod: number }
  setMonthlyActiveUsers: (mau: number) => void
  setFxRate: (rate: number) => void
}

const DEFAULT_CATEGORIES: BudgetCategory[] = budgetJson.categories
const DEFAULT_SCENARIOS: BudgetScenario[] = budgetJson.scenarios
const BASELINE_ITEMS: BudgetItem[] = budgetJson.items.map((item) => ({
  ...item,
  costType: item.costType as CostType,
  usageDriver: item.usageDriver as UsageDriver,
  isEnabled: item.isEnabled ?? true,
  currency: 'NGN' as Currency,
  isAutoQuantity: item.isAutoQuantity !== undefined ? item.isAutoQuantity : (item.usageDriver !== 'fixed')
}))

// Helper: Sync delta to URL query string without reloading
let urlSyncTimer: ReturnType<typeof setTimeout> | null = null
function queueUrlSync(getDelta: () => BudgetDelta) {
  if (typeof window === 'undefined') return
  if (urlSyncTimer) clearTimeout(urlSyncTimer)

  urlSyncTimer = setTimeout(() => {
    try {
      const delta = getDelta()
      const relativeUrl = buildRelativeUrl(delta)
      window.history.replaceState(null, '', relativeUrl)
    } catch {
      // ignore in environments without browser history
    }
  }, 400)
}

export function getDerivedDrivers(a: BudgetAssumptions) {
  const totalLogins = Math.round(a.users * a.lpu)
  const otpCount = Math.round(totalLogins * (a.otp / 100))
  const regCount = Math.round(a.reg)
  return {
    totalLogins,
    otpCount,
    regCount
  }
}

function calculateDelta(
  title: string,
  items: BudgetItem[],
  assumptions: BudgetAssumptions,
  currency: Currency,
  scenarioId: string
): BudgetDelta {
  const delta: BudgetDelta = {
    c: currency,
    r: assumptions.rate,
    mau: assumptions.users,
    s: scenarioId,
    p: {},
    q: {},
    u: {},
    mMonths: {},
    d: [],
    a: [],
    as: {}
  }

  if (title && title !== DEFAULT_TITLE) {
    delta.t = title
  }

  if (assumptions.lpu !== DEFAULT_ASSUMPTIONS.lpu) delta.as!.lpu = assumptions.lpu
  if (assumptions.otp !== DEFAULT_ASSUMPTIONS.otp) delta.as!.otp = assumptions.otp
  if (assumptions.reg !== DEFAULT_ASSUMPTIONS.reg) delta.as!.reg = assumptions.reg
  if (assumptions.months !== DEFAULT_ASSUMPTIONS.months) delta.as!.months = assumptions.months
  if (assumptions.devMonths !== DEFAULT_ASSUMPTIONS.devMonths) delta.as!.devMonths = assumptions.devMonths
  if (assumptions.cont !== DEFAULT_ASSUMPTIONS.cont) delta.as!.cont = assumptions.cont

  const baselineMap = new Map(BASELINE_ITEMS.map((b) => [b.id, b]))

  for (const item of items) {
    if (item.isCustom) {
      delta.a?.push(item)
      continue
    }

    const base = baselineMap.get(item.id)
    if (!base) continue

    if (item.unitRateNgn !== base.unitRateNgn) {
      delta.p![item.id] = item.unitRateNgn
    }
    if (item.quantity !== base.quantity) {
      delta.q![item.id] = item.quantity
    }
    if (item.unitLabel !== base.unitLabel) {
      delta.u![item.id] = item.unitLabel
    }
    if (item.periodMonths !== base.periodMonths) {
      delta.mMonths![item.id] = item.periodMonths
    }
    if (!item.isEnabled) {
      delta.d?.push(item.id)
    }
  }

  // Cleanup empty delta fields
  if (Object.keys(delta.p!).length === 0) delete delta.p
  if (Object.keys(delta.q!).length === 0) delete delta.q
  if (Object.keys(delta.u!).length === 0) delete delta.u
  if (Object.keys(delta.mMonths!).length === 0) delete delta.mMonths
  if (delta.d!.length === 0) delete delta.d
  if (delta.a!.length === 0) delete delta.a
  if (Object.keys(delta.as!).length === 0) delete delta.as

  return delta
}

// Initial hydration from URL delta if present
function getInitialState(): {
  title: string
  items: BudgetItem[]
  assumptions: BudgetAssumptions
  currency: Currency
  scenarioId: string
  isCustomized: boolean
  isEditMode: boolean
} {
  const initialItems = BASELINE_ITEMS.map((i) => ({ ...i }))
  let title = DEFAULT_TITLE
  const assumptions: BudgetAssumptions = { ...DEFAULT_ASSUMPTIONS }
  let currency: Currency = 'NGN'
  let scenarioId = 'lean'
  let isCustomized = false
  let isEditMode = false

  if (typeof window !== 'undefined' && window.location.search) {
    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') === '1' || params.get('edit') === 'true' || params.get('mode') === 'edit') {
      isEditMode = true
    }

    const delta = deserializeBudgetDelta(window.location.search)
    if (delta) {
      isCustomized = true
      if (delta.t) title = delta.t
      if (delta.mau) assumptions.users = delta.mau
      if (delta.r) assumptions.rate = delta.r
      if (delta.c) currency = delta.c
      if (delta.s) scenarioId = delta.s

      if (delta.as) {
        if (delta.as.lpu !== undefined) assumptions.lpu = delta.as.lpu
        if (delta.as.otp !== undefined) assumptions.otp = delta.as.otp
        if (delta.as.reg !== undefined) assumptions.reg = delta.as.reg
        if (delta.as.months !== undefined) assumptions.months = delta.as.months
        if (delta.as.devMonths !== undefined) assumptions.devMonths = delta.as.devMonths
        if (delta.as.cont !== undefined) assumptions.cont = delta.as.cont
      }

      // Apply price overrides
      if (delta.p) {
        for (const [id, price] of Object.entries(delta.p)) {
          const item = initialItems.find((i) => i.id === id)
          if (item) item.unitRateNgn = price
        }
      }

      // Apply quantity overrides
      if (delta.q) {
        for (const [id, qty] of Object.entries(delta.q)) {
          const item = initialItems.find((i) => i.id === id)
          if (item) {
            item.quantity = qty
            item.isAutoQuantity = false
          }
        }
      }

      // Apply unit overrides
      if (delta.u) {
        for (const [id, unit] of Object.entries(delta.u)) {
          const item = initialItems.find((i) => i.id === id)
          if (item) item.unitLabel = unit
        }
      }

      // Apply period overrides
      if (delta.mMonths) {
        for (const [id, per] of Object.entries(delta.mMonths)) {
          const item = initialItems.find((i) => i.id === id)
          if (item) item.periodMonths = per
        }
      }

      // Apply disabled states
      if (delta.d) {
        const disabledSet = new Set(delta.d)
        for (const item of initialItems) {
          if (disabledSet.has(item.id)) {
            item.isEnabled = false
          }
        }
      }

      // Append custom items
      if (delta.a && Array.isArray(delta.a)) {
        for (const customItem of delta.a) {
          initialItems.push({ ...customItem, isCustom: true })
        }
      }
    }
  }

  return { title, items: initialItems, assumptions, currency, scenarioId, isCustomized, isEditMode }
}

const initial = getInitialState()

export const useBudgetStore = create<BudgetState>((set, get) => ({
  title: initial.title,
  items: initial.items,
  categories: DEFAULT_CATEGORIES,
  scenarios: DEFAULT_SCENARIOS,
  activeScenarioId: initial.scenarioId,
  assumptions: initial.assumptions,
  currency: initial.currency,
  lastDeletedItem: null,
  isCustomized: initial.isCustomized,
  isEditMode: initial.isEditMode,

  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setEditMode: (enabled: boolean) => set({ isEditMode: enabled }),

  // Legacy aliases
  monthlyActiveUsers: initial.assumptions.users,
  fxRate: initial.assumptions.rate,

  setTitle: (title: string) => {
    set({ title, isCustomized: true })
    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  setCurrency: (currency: Currency) => {
    set({ currency })
    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  setAssumption: (key, value) => {
    set((state) => {
      const nextAssumptions = {
        ...state.assumptions,
        [key]: Math.max(0, Number(value) || 0)
      }
      return {
        assumptions: nextAssumptions,
        monthlyActiveUsers: nextAssumptions.users,
        fxRate: nextAssumptions.rate,
        isCustomized: true
      }
    })
    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  setMonthlyActiveUsers: (users: number) => {
    get().setAssumption('users', users)
  },

  setFxRate: (rate: number) => {
    get().setAssumption('rate', rate)
  },

  setScenario: (scenarioId: string) => {
    const scenario = DEFAULT_SCENARIOS.find((s) => s.id === scenarioId)
    if (!scenario) return

    set((state) => {
      let updatedItems = state.items.map((item) => ({ ...item }))
      const updatedMau = scenario.mau

      if (scenarioId === 'lean') {
        updatedItems = updatedItems.map((item) => {
          if (item.id === 'sec-pen-testing') return { ...item, isEnabled: false }
          if (item.id === 'infra-waf-ddos') return { ...item, isEnabled: false }
          if (item.id === 'dep-data-migration') return { ...item, unitRateNgn: 4000000 }
          if (item.id === 'dep-lga-training') return { ...item, unitRateNgn: 5000000 }
          return item
        })
      } else if (scenarioId === 'turnkey') {
        updatedItems = updatedItems.map((item) => {
          if (item.id === 'dep-sla-retainer') return { ...item, unitRateNgn: 4500000 }
          return { ...item, isEnabled: true }
        })
      } else {
        updatedItems = BASELINE_ITEMS.map((item) => ({ ...item }))
      }

      const nextAssumptions = {
        ...state.assumptions,
        users: updatedMau
      }

      return {
        activeScenarioId: scenarioId,
        assumptions: nextAssumptions,
        monthlyActiveUsers: updatedMau,
        items: updatedItems,
        isCustomized: scenarioId !== 'enterprise'
      }
    })

    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  toggleItem: (id: string) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, isEnabled: !item.isEnabled } : item)),
      isCustomized: true
    }))

    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  updateItemPrice: (id: string, newRateNgn: number, newQuantity?: number, newPeriod?: number) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          unitRateNgn: Math.max(0, newRateNgn),
          quantity: newQuantity !== undefined ? Math.max(0, newQuantity) : item.quantity,
          periodMonths: newPeriod !== undefined ? Math.max(1, newPeriod) : item.periodMonths
        }
      }),
      isCustomized: true
    }))

    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  updateItemRow: (id: string, updates: Partial<BudgetItem>) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      isCustomized: true
    }))

    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  updateItem: (id: string, updates: Partial<BudgetItem>) => {
    get().updateItemRow(id, updates)
  },

  addItem: (newItemData: Omit<BudgetItem, 'id' | 'isEnabled'> & { isEnabled?: boolean }) => {
    const newId = `custom-${Date.now()}`
    const item: BudgetItem = {
      ...newItemData,
      id: newId,
      isCustom: true,
      isEnabled: newItemData.isEnabled ?? true,
      currency: newItemData.currency || 'NGN',
      isAutoQuantity: false
    }

    set((state) => ({
      items: [...state.items, item],
      isCustomized: true
    }))

    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })

    return newId
  },

  deleteItem: (id: string) => {
    const currentItems = get().items
    const target = currentItems.find((i) => i.id === id)
    if (!target) return

    set({
      items: currentItems.filter((i) => i.id !== id),
      lastDeletedItem: target,
      isCustomized: true
    })

    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  undoDelete: () => {
    const { lastDeletedItem, items } = get()
    if (!lastDeletedItem) return

    set({
      items: [...items, lastDeletedItem],
      lastDeletedItem: null
    })

    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  resetToBaseline: () => {
    set({
      title: DEFAULT_TITLE,
      items: BASELINE_ITEMS.map((item) => ({ ...item })),
      assumptions: { ...DEFAULT_ASSUMPTIONS },
      monthlyActiveUsers: DEFAULT_ASSUMPTIONS.users,
      fxRate: DEFAULT_ASSUMPTIONS.rate,
      currency: 'NGN',
      activeScenarioId: 'lean',
      lastDeletedItem: null,
      isCustomized: false
    })

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/budget')
    }
  },

  importFromPayload: (payload: ExportBudgetPayload) => {
    if (!payload || !Array.isArray(payload.items)) return

    const newAssumptions: BudgetAssumptions = {
      ...DEFAULT_ASSUMPTIONS,
      rate: payload.fxRate || 1500,
      users: payload.monthlyActiveUsers || 100000
    }

    set({
      items: payload.items,
      currency: payload.currency || 'NGN',
      assumptions: newAssumptions,
      monthlyActiveUsers: newAssumptions.users,
      fxRate: newAssumptions.rate,
      activeScenarioId: payload.activeScenarioId || 'custom',
      isCustomized: true
    })

    queueUrlSync(() => {
      const s = get()
      return calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    })
  },

  getShareableLink: () => {
    const s = get()
    const delta = calculateDelta(s.title, s.items, s.assumptions, s.currency, s.activeScenarioId)
    return buildShareableUrl(delta)
  },

  getEffectiveItemCost: (item: BudgetItem) => {
    const { assumptions } = get()
    return calculateEffectiveItemCost(item, assumptions)
  },

  getSummary: (): BudgetSummary => {
    const { items, assumptions, categories } = get()
    return calculateBudgetSummary(items, assumptions, categories)
  }
}))

/**
 * Pure calculation for an individual budget item's cost and effective volume
 */
export function calculateEffectiveItemCost(
  item: BudgetItem,
  assumptions: BudgetAssumptions
): { costNgn: number; costUsd: number; effectiveQuantity: number; effectivePeriod: number } {
  const rate = assumptions.rate > 0 ? assumptions.rate : 1
  let effectiveQuantity = item.quantity

  // If item is marked as auto-quantity, derive it from assumptions
  if (item.costType === 'recurring' && item.isAutoQuantity !== false) {
    if (item.usageDriver === 'mau_otp') {
      const derived = getDerivedDrivers(assumptions)
      effectiveQuantity = Math.round(derived.otpCount * (item.driverMultiplier ?? 1.0))
    } else if (item.usageDriver === 'mau_nimc') {
      const derived = getDerivedDrivers(assumptions)
      effectiveQuantity = Math.round(derived.regCount * (item.driverMultiplier ?? 1.0))
    } else if (item.usageDriver === 'mau_cac') {
      effectiveQuantity = Math.round(assumptions.users * (item.driverMultiplier ?? 0.02))
    } else if (item.usageDriver === 'mau_cloud') {
      effectiveQuantity = Math.max(1, Math.round((assumptions.users / 1000) * (item.driverMultiplier ?? 10)))
    }
  } else if (item.costType === 'one-time' && item.isAutoQuantity !== false) {
    const isMonthlyUnit =
      item.unitLabel === 'month' ||
      item.unitLabel === 'months' ||
      item.unitLabel === 'dev/mo' ||
      item.unitLabel === 'per dev/mo' ||
      item.unitLabel === 'per dev/month' ||
      item.unitLabel === 'per engineer/month'
    if (isMonthlyUnit) {
      effectiveQuantity = Math.max(1, assumptions.devMonths || 2)
    }
  }

  const effectivePeriod = 1

  let costNgn = 0
  if (item.currency === 'USD') {
    const totalUsd = item.unitRateNgn * effectiveQuantity * effectivePeriod
    costNgn = totalUsd * rate
  } else {
    costNgn = item.unitRateNgn * effectiveQuantity * effectivePeriod
  }

  return {
    costNgn: Math.round(costNgn),
    costUsd: costNgn / rate,
    effectiveQuantity,
    effectivePeriod
  }
}

/**
 * Pure calculation for overall executive summary and category breakdowns
 */
export function calculateBudgetSummary(
  items: BudgetItem[],
  assumptions: BudgetAssumptions,
  categories: BudgetCategory[]
): BudgetSummary {
  const rate = assumptions.rate > 0 ? assumptions.rate : 1
  const m = Math.max(1, Math.round(assumptions.months) || 1)

  let buildTotalNgn = 0
  let runningMonthlyNgn = 0
  let fixedMonthlyOpexNgn = 0
  let variableMonthlyOpexNgn = 0
  let totalActiveItems = 0

  // Category totals accumulator
  const catTotals: Record<
    string,
    { oneTimeNgn: number; monthlyNgn: number; annualizedNgn: number; year1TcoNgn: number }
  > = {}
  for (const cat of categories) {
    catTotals[cat.id] = { oneTimeNgn: 0, monthlyNgn: 0, annualizedNgn: 0, year1TcoNgn: 0 }
  }

  for (const item of items) {
    if (!item.isEnabled) continue
    totalActiveItems++

    const { costNgn } = calculateEffectiveItemCost(item, assumptions)

    if (item.costType === 'one-time') {
      buildTotalNgn += costNgn
      if (catTotals[item.categoryId]) {
        catTotals[item.categoryId].oneTimeNgn += costNgn
        catTotals[item.categoryId].year1TcoNgn += costNgn
      }
    } else {
      runningMonthlyNgn += costNgn
      if (item.usageDriver === 'fixed') {
        fixedMonthlyOpexNgn += costNgn
      } else {
        variableMonthlyOpexNgn += costNgn
      }

      const annualItemCost = costNgn * 12
      if (catTotals[item.categoryId]) {
        catTotals[item.categoryId].monthlyNgn += costNgn
        catTotals[item.categoryId].annualizedNgn += annualItemCost
        catTotals[item.categoryId].year1TcoNgn += annualItemCost
      }
    }
  }

  // Baseline grand total calculation
  const baseCostNgn = buildTotalNgn + runningMonthlyNgn * m
  const bufferAmountNgn = baseCostNgn * (assumptions.cont / 100)
  const grandTotalNgn = baseCostNgn + bufferAmountNgn

  const buildTotalUsd = buildTotalNgn / rate
  const runningMonthlyUsd = runningMonthlyNgn / rate
  const bufferAmountUsd = bufferAmountNgn / rate
  const grandTotalUsd = grandTotalNgn / rate

  const costPerUserPerMonthNgn = assumptions.users > 0 ? runningMonthlyNgn / assumptions.users : 0
  const costPerUserPerMonthUsd = costPerUserPerMonthNgn / rate

  const derived = getDerivedDrivers(assumptions)

  const year1TcoNgn = buildTotalNgn + runningMonthlyNgn * 12
  const year3LifecycleNgn = buildTotalNgn + runningMonthlyNgn * 36
  const year1TcoUsd = year1TcoNgn / rate
  const year3LifecycleUsd = year3LifecycleNgn / rate

  // Category breakdown with percentages of Year-1 TCO
  const categoryBreakdown: CategoryBreakdown[] = categories.map((cat) => {
    const totals = catTotals[cat.id] || { oneTimeNgn: 0, monthlyNgn: 0, annualizedNgn: 0, year1TcoNgn: 0 }
    const percentage = year1TcoNgn > 0 ? Math.round((totals.year1TcoNgn / year1TcoNgn) * 100) : 0

    return {
      categoryId: cat.id,
      title: cat.title,
      accentColor: cat.accentColor,
      oneTimeNgn: totals.oneTimeNgn,
      monthlyNgn: totals.monthlyNgn,
      annualizedNgn: totals.annualizedNgn,
      year1TcoNgn: totals.year1TcoNgn,
      oneTimeUsd: totals.oneTimeNgn / rate,
      monthlyUsd: totals.monthlyNgn / rate,
      annualizedUsd: totals.annualizedNgn / rate,
      year1TcoUsd: totals.year1TcoNgn / rate,
      percentage
    }
  })

  return {
    buildTotalNgn,
    buildTotalUsd,
    runningMonthlyNgn,
    runningMonthlyUsd,
    grandTotalNgn,
    grandTotalUsd,
    bufferAmountNgn,
    bufferAmountUsd,
    costPerUserPerMonthNgn,
    costPerUserPerMonthUsd,
    budgetMonths: m,
    devMonths: assumptions.devMonths !== undefined ? assumptions.devMonths : 6,
    safetyBufferPercent: assumptions.cont,
    totalLoginsPerMonth: derived.totalLogins,
    totalOtpPerMonth: derived.otpCount,
    totalRegistrationsPerMonth: derived.regCount,

    capexTotalNgn: buildTotalNgn,
    capexTotalUsd: buildTotalUsd,
    fixedMonthlyOpexNgn,
    fixedMonthlyOpexUsd: fixedMonthlyOpexNgn / rate,
    variableMonthlyOpexNgn,
    variableMonthlyOpexUsd: variableMonthlyOpexNgn / rate,
    totalMonthlyOpexNgn: runningMonthlyNgn,
    totalMonthlyOpexUsd: runningMonthlyUsd,
    annualOpexNgn: runningMonthlyNgn * 12,
    annualOpexUsd: runningMonthlyUsd * 12,
    year1TcoNgn,
    year1TcoUsd,
    year3LifecycleNgn,
    year3LifecycleUsd,
    costPerCitizenPerMonthNgn: costPerUserPerMonthNgn,
    costPerCitizenPerMonthUsd: costPerUserPerMonthUsd,
    totalActiveItems,
    totalItems: items.length,
    categoryBreakdown
  }
}

/**
 * Memoized React hook for calculating budget summary with stable Zustand selector references
 */
export function useBudgetSummary(): BudgetSummary {
  const items = useBudgetStore((s) => s.items)
  const assumptions = useBudgetStore((s) => s.assumptions)
  const categories = useBudgetStore((s) => s.categories)

  return useMemo(() => {
    return calculateBudgetSummary(items, assumptions, categories)
  }, [items, assumptions, categories])
}

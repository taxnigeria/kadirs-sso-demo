import {
  calculateEffectiveItemCost,
  calculateBudgetSummary,
  useBudgetStore,
  DEFAULT_ASSUMPTIONS
} from './budget-store'
import {
  serializeBudgetDelta,
  deserializeBudgetDelta,
  buildShareableUrl,
  buildRelativeUrl,
  type BudgetDelta
} from './budget-url-sync'
import type { BudgetItem, BudgetCategory, BudgetAssumptions } from './budget-types'
import budgetJson from '@/data/budget-data.json'

declare const process: any

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertEquals(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`)
  }
}

async function runBudgetTests() {
  console.log('--- [1] Testing calculateEffectiveItemCost with assumptions ---')
  const assumptions: BudgetAssumptions = {
    rate: 1500,
    devMonths: 6,
    users: 100000,
    lpu: 8,
    otp: 30,
    reg: 15000,
    months: 12,
    cont: 10
  }

  // 1. One-time item test
  const oneTimeItem: BudgetItem = {
    id: 'test-1',
    categoryId: 'engineering',
    title: 'Test Senior Engineer',
    description: 'Senior software engineering rate',
    costType: 'one-time',
    unitRateNgn: 1_500_000,
    unitLabel: 'per engineer/month',
    quantity: 2,
    periodMonths: 6,
    usageDriver: 'fixed',
    isEnabled: true
  }

  const oneTimeCost = calculateEffectiveItemCost(oneTimeItem, assumptions)
  assertEquals(oneTimeCost.costNgn, 18_000_000, 'One-time cost: 1.5M * 2 * 6 = 18M')
  assertEquals(oneTimeCost.costUsd, 18_000_000 / 1500, 'One-time USD conversion matches FX rate')
  assertEquals(oneTimeCost.effectivePeriod, 6, 'Effective period matches devMonths 6')

  // Test devMonths modification: reducing timeframe to 3 months cuts engineering build cost in half
  const halfDevCost = calculateEffectiveItemCost(oneTimeItem, { ...assumptions, devMonths: 3 })
  assertEquals(halfDevCost.costNgn, 9_000_000, 'One-time cost at 3 devMonths: 1.5M * 2 * 3 = 9M')
  assertEquals(halfDevCost.effectivePeriod, 3, 'Effective period matches modified devMonths 3')
  console.log('✓ One-time cost calculation verified')

  // 2. Variable OPEX: SMS OTP driven by users * lpu * (otp / 100)
  // 100k users * 8 logins * 30% = 240,000 SMS
  const otpItem: BudgetItem = {
    id: 'test-otp',
    categoryId: 'infrastructure',
    title: 'SMS OTP Service',
    description: 'Transactional SMS messages',
    costType: 'recurring',
    unitRateNgn: 5,
    unitLabel: 'SMS',
    quantity: 1,
    periodMonths: 1,
    usageDriver: 'mau_otp',
    driverMultiplier: 1.0,
    isEnabled: true
  }
  const otpCost = calculateEffectiveItemCost(otpItem, assumptions)
  assertEquals(otpCost.effectiveQuantity, 240_000, 'Derived OTP count: 100k * 8 * 30% = 240k')
  assertEquals(otpCost.costNgn, 240_000 * 5, 'OTP cost: 240k * 5 = 1,200,000 NGN')
  console.log('✓ MAU OTP cost calculation verified')

  // 3. Variable OPEX: NIMC Verification driven by reg = 15,000
  const nimcItem: BudgetItem = {
    id: 'test-nimc',
    categoryId: 'infrastructure',
    title: 'NIMC Verification',
    description: 'NIN identity verification',
    costType: 'recurring',
    unitRateNgn: 60,
    unitLabel: 'checks',
    quantity: 1,
    periodMonths: 1,
    usageDriver: 'mau_nimc',
    driverMultiplier: 1.0,
    isEnabled: true
  }
  const nimcCost = calculateEffectiveItemCost(nimcItem, assumptions)
  assertEquals(nimcCost.effectiveQuantity, 15_000, 'Derived registration NIN count: 15,000')
  assertEquals(nimcCost.costNgn, 15_000 * 60, 'NIMC cost: 15k * 60 = 900,000 NGN')
  console.log('✓ MAU NIMC cost calculation verified')

  console.log('\n--- [2] Testing calculateBudgetSummary Formula ---')
  const categories: BudgetCategory[] = budgetJson.categories
  const baselineItems: BudgetItem[] = budgetJson.items.map((i) => ({
    ...i,
    costType: i.costType as any,
    usageDriver: i.usageDriver as any,
    isEnabled: true
  }))

  const summary = calculateBudgetSummary(baselineItems, assumptions, categories)
  assert(summary.buildTotalNgn > 0, 'Build total should be positive')
  assert(summary.runningMonthlyNgn > 0, 'Monthly running cost should be positive')

  // Reference grand total formula check:
  // Base = Build + Running * Months
  // Buffer = Base * (Contingency% / 100)
  // Grand = Base + Buffer
  const expectedBase = summary.buildTotalNgn + summary.runningMonthlyNgn * assumptions.months
  const expectedBuffer = expectedBase * (assumptions.cont / 100)
  const expectedGrand = expectedBase + expectedBuffer

  assertEquals(summary.bufferAmountNgn, expectedBuffer, 'Buffer amount matches formula')
  assertEquals(summary.grandTotalNgn, expectedGrand, 'Grand total matches formula')
  assertEquals(
    summary.costPerUserPerMonthNgn,
    summary.runningMonthlyNgn / assumptions.users,
    'Cost per user per month = runningMonthly / users'
  )
  assert(summary.categoryBreakdown.length === categories.length, 'All categories represented')
  console.log('✓ calculateBudgetSummary mathematical consistency verified')
  console.log(`  Build Total: ₦${summary.buildTotalNgn.toLocaleString()}`)
  console.log(`  Monthly Running: ₦${summary.runningMonthlyNgn.toLocaleString()}/mo`)
  console.log(`  Grand Total (12m + 10% buffer): ₦${summary.grandTotalNgn.toLocaleString()}`)
  console.log(`  Cost Per Taxpayer/Month: ₦${summary.costPerUserPerMonthNgn.toFixed(2)}`)

  console.log('\n--- [3] Testing Zustand Store Actions & Assumptions ---')
  const store = useBudgetStore.getState()
  store.resetToBaseline()

  // Update assumption
  store.setAssumption('otp', 40)
  assertEquals(useBudgetStore.getState().assumptions.otp, 40, 'OTP assumption updated to 40%')

  // Update item row
  const targetItem = useBudgetStore.getState().items[0]
  store.updateItemRow(targetItem.id, { unitRateNgn: 9_999_999, unitLabel: 'specialist' })
  const updatedItem = useBudgetStore.getState().items.find((i) => i.id === targetItem.id)
  assertEquals(updatedItem?.unitRateNgn, 9_999_999, 'Unit rate updated')
  assertEquals(updatedItem?.unitLabel, 'specialist', 'Unit label updated')

  // Add custom item
  const newId = store.addItem({
    title: 'Custom Sovereign Cluster Node',
    categoryId: 'infrastructure',
    costType: 'recurring',
    unitRateNgn: 250_000,
    unitLabel: 'node',
    quantity: 3,
    periodMonths: 1,
    usageDriver: 'fixed',
    description: 'Secondary failover server'
  })
  assert(useBudgetStore.getState().items.some((i) => i.id === newId), 'Custom item added')

  // Delete item and undo
  store.deleteItem(newId)
  assert(!useBudgetStore.getState().items.some((i) => i.id === newId), 'Custom item deleted')
  store.undoDelete()
  assert(useBudgetStore.getState().items.some((i) => i.id === newId), 'Undo restored custom item')

  // Reset to baseline
  store.resetToBaseline()
  assertEquals(useBudgetStore.getState().assumptions.otp, DEFAULT_ASSUMPTIONS.otp, 'Reset restored baseline assumptions')
  console.log('✓ Store mutations and assumptions passed')

  console.log('\n--- [4] Testing URL Delta Serialization & Deserialization ---')
  const delta: BudgetDelta = {
    mau: 200000,
    c: 'USD',
    r: 1600,
    s: 'custom',
    t: 'Custom Tender Budget 2026',
    as: { lpu: 10, otp: 50, months: 24, devMonths: 8, cont: 15 },
    p: { 'dev-lead-architect': 3500000 },
    d: ['sec-pen-testing']
  }

  const serialized = serializeBudgetDelta(delta)
  assert(typeof serialized === 'string' && serialized.length > 0, 'Serialized delta non-empty')
  
  const parsed = deserializeBudgetDelta(`?b=${serialized}`)
  assert(parsed !== null, 'Deserialized delta not null')
  assertEquals(parsed.mau, 200000, 'Delta MAU preserved')
  assertEquals(parsed.t, 'Custom Tender Budget 2026', 'Delta title preserved')
  assertEquals(parsed.as?.months, 24, 'Delta budget months preserved')
  assertEquals(parsed.as?.devMonths, 8, 'Delta dev timeframe preserved')
  assertEquals(parsed.as?.cont, 15, 'Delta contingency preserved')
  assertEquals(parsed.p?.['dev-lead-architect'], 3500000, 'Delta price override preserved')

  const relativeUrl = buildRelativeUrl(delta)
  assertEquals(relativeUrl, `/budget?b=${serialized}`, 'buildRelativeUrl correctly formats path')

  const shareableUrl = buildShareableUrl(delta)
  assert(shareableUrl.includes(`/budget?b=${serialized}`), 'buildShareableUrl correctly contains delta query')
  console.log('✓ URL Delta serialization and deserialization verified')


  console.log('\n=== ALL BUDGET UNIT TESTS PASSED SUCCESSFULLY! ===')
}

runBudgetTests().catch((err) => {
  console.error('❌ Test failed with error:', err)
  process.exit(1)
})

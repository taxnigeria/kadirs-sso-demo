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
  console.log('--- [1] Testing calculateEffectiveItemCost with Pilot Assumptions ---')
  const assumptions: BudgetAssumptions = { ...DEFAULT_ASSUMPTIONS }

  // 1. One-time item test (auto-scaled with devMonths)
  const discoveryItem: BudgetItem = {
    id: 'build-discovery',
    categoryId: 'engineering',
    title: 'Product discovery and solution architecture',
    description: 'Freeze pilot requirements, data model, threat model, acceptance criteria',
    costType: 'one-time',
    unitRateNgn: 600000,
    quantity: 2,
    periodMonths: 2,
    usageDriver: 'fixed',
    unitLabel: 'months',
    isEnabled: true,
    isAutoQuantity: true
  }

  const discoveryCost = calculateEffectiveItemCost(discoveryItem, assumptions)
  assertEquals(discoveryCost.costNgn, 1_200_000, 'Discovery cost: 600k * 2 = 1.2M NGN')
  assertEquals(discoveryCost.effectiveQuantity, 2, 'Effective quantity matches devMonths 2')

  // Test devMonths scaling: changing devMonths to 3 scales monthly engineering items
  const scaledDiscoveryCost = calculateEffectiveItemCost(discoveryItem, { ...assumptions, devMonths: 3 })
  assertEquals(scaledDiscoveryCost.costNgn, 1_800_000, 'Discovery cost at 3 months: 600k * 3 = 1.8M NGN')
  assertEquals(scaledDiscoveryCost.effectiveQuantity, 3, 'Effective quantity updates to 3')
  console.log('✓ One-time cost calculation and devMonths scaling verified')

  // 2. Variable OPEX: SMS OTP driven by users * lpu * (otp / 100)
  // 10,000 users * 3 logins * 100% = 30,000 SMS
  const otpItem: BudgetItem = {
    id: 'run-sms',
    categoryId: 'integrations',
    title: 'SMS/OTP',
    description: 'Transactional SMS messages',
    costType: 'recurring',
    unitRateNgn: 8,
    unitLabel: 'messages',
    quantity: 30000,
    periodMonths: 12,
    usageDriver: 'mau_otp',
    driverMultiplier: 1.0,
    isEnabled: true,
    isAutoQuantity: true
  }
  const otpCost = calculateEffectiveItemCost(otpItem, assumptions)
  assertEquals(otpCost.effectiveQuantity, 30_000, 'Derived OTP count: 10,000 * 3 * 100% = 30,000')
  assertEquals(otpCost.costNgn, 30_000 * 8, 'OTP cost: 30,000 * 8 = 240,000 NGN/mo')
  console.log('✓ MAU OTP cost calculation verified')

  // 3. Variable OPEX: NIN/CAC Verification driven by reg = 2,000 checks
  const kycItem: BudgetItem = {
    id: 'run-kyc',
    categoryId: 'integrations',
    title: 'NIN/CAC verification',
    description: 'Pilot KYC query allowance',
    costType: 'recurring',
    unitRateNgn: 100,
    unitLabel: 'checks',
    quantity: 2000,
    periodMonths: 12,
    usageDriver: 'mau_nimc',
    driverMultiplier: 1.0,
    isEnabled: true,
    isAutoQuantity: true
  }
  const kycCost = calculateEffectiveItemCost(kycItem, assumptions)
  assertEquals(kycCost.effectiveQuantity, 2000, 'Derived KYC registration checks: 2,000')
  assertEquals(kycCost.costNgn, 2000 * 100, 'KYC cost: 2,000 * 100 = 200,000 NGN/mo')
  console.log('✓ MAU KYC verification cost calculation verified')

  console.log('\n--- [2] Testing calculateBudgetSummary Formula & Exact Pilot Totals ---')
  const categories: BudgetCategory[] = budgetJson.categories
  const baselineItems: BudgetItem[] = budgetJson.items.map((i) => ({
    ...i,
    costType: i.costType as any,
    usageDriver: i.usageDriver as any,
    isEnabled: true
  }))

  const summary = calculateBudgetSummary(baselineItems, assumptions, categories)
  assertEquals(summary.buildTotalNgn, 34_000_000, 'Build total must equal ₦34,000,000')
  assertEquals(summary.runningMonthlyNgn, 1_035_000, 'Monthly running cost must equal ₦1,035,000/mo')
  assertEquals(summary.grandTotalNgn, 46_420_000, 'Grand total must equal ₦46,420,000 (first-year ceiling)')
  assertEquals(summary.costPerUserPerMonthNgn, 103.5, 'Cost per taxpayer per month = 1,035,000 / 10,000 = ₦103.50')

  // Headroom check under ₦48M
  const headroomNgn = 48_000_000 - summary.grandTotalNgn
  assertEquals(headroomNgn, 1_580_000, 'Headroom under ₦48M ceiling must equal ₦1,580,000')

  assert(summary.categoryBreakdown.length === categories.length, 'All categories represented')
  console.log('✓ calculateBudgetSummary mathematical consistency and exact pilot figures verified')
  console.log(`  Build Total: ₦${summary.buildTotalNgn.toLocaleString()}`)
  console.log(`  Monthly Running: ₦${summary.runningMonthlyNgn.toLocaleString()}/mo`)
  console.log(`  Grand Total (12m): ₦${summary.grandTotalNgn.toLocaleString()}`)
  console.log(`  Cost Per Taxpayer/Month: ₦${summary.costPerUserPerMonthNgn.toFixed(2)}`)
  console.log(`  Headroom Under ₦48M: ₦${headroomNgn.toLocaleString()}`)

  console.log('\n--- [3] Testing Zustand Store Actions & Assumptions ---')
  const store = useBudgetStore.getState()
  store.resetToBaseline()

  // Update assumption
  store.setAssumption('otp', 50)
  assertEquals(useBudgetStore.getState().assumptions.otp, 50, 'OTP assumption updated to 50%')

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
  assertEquals(useBudgetStore.getState().activeScenarioId, 'lean', 'Reset restored lean scenario')
  console.log('✓ Store mutations and assumptions passed')

  console.log('\n--- [4] Testing URL Delta Serialization & Deserialization ---')
  const delta: BudgetDelta = {
    mau: 25000,
    c: 'USD',
    r: 1600,
    s: 'custom',
    t: 'Custom Tender Budget 2026',
    as: { lpu: 5, otp: 80, months: 12, devMonths: 3, cont: 5 },
    p: { 'build-discovery': 700000 },
    d: ['run-email']
  }

  const serialized = serializeBudgetDelta(delta)
  assert(typeof serialized === 'string' && serialized.length > 0, 'Serialized delta non-empty')
  
  const parsed = deserializeBudgetDelta(`?b=${serialized}`)
  assert(parsed !== null, 'Deserialized delta not null')
  assertEquals(parsed.mau, 25000, 'Delta MAU preserved')
  assertEquals(parsed.t, 'Custom Tender Budget 2026', 'Delta title preserved')
  assertEquals(parsed.as?.months, 12, 'Delta budget months preserved')
  assertEquals(parsed.as?.devMonths, 3, 'Delta dev timeframe preserved')
  assertEquals(parsed.as?.cont, 5, 'Delta contingency preserved')
  assertEquals(parsed.p?.['build-discovery'], 700000, 'Delta price override preserved')

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

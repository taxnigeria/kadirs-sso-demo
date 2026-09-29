import { useInvoiceStore } from './invoice-store'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

async function runInvoiceStoreTests() {
  console.log('--- Testing useInvoiceStore ---')

  const store = useInvoiceStore.getState()
  assert(store.invoices.length > 0, 'Invoices should be pre-seeded')
  console.log(`✓ Pre-seeded with ${store.invoices.length} invoices across TSPs`)

  // Check metrics
  const initialMetrics = store.getSummaryMetrics()
  assert(initialMetrics.totalBilled > 0, 'Total billed should be > 0')
  assert(initialMetrics.paidCount > 0, 'Should have paid invoices')
  assert(initialMetrics.unpaidCount > 0, 'Should have unpaid invoices')
  assert(initialMetrics.activeTspsCount >= 5, 'Should span at least 5 TSPs')
  console.log('✓ Initial summary metrics computed correctly:', initialMetrics)

  // Find an unpaid invoice and pay it
  const unpaidInvoice = store.invoices.find((i) => i.status === 'unpaid')
  assert(unpaidInvoice !== undefined, 'Must find an unpaid invoice')
  const initialUnpaidCount = initialMetrics.unpaidCount
  const initialPaidCount = initialMetrics.paidCount

  console.log(`Testing payment for invoice: ${unpaidInvoice.invoiceNumber} (${unpaidInvoice.tspName})`)
  const result = await store.payInvoice(unpaidInvoice.id, 'Test PayKaduna Gateway')
  assert(result.success === true, 'Payment should succeed')
  assert(result.receiptNumber.startsWith('RCP-2026-'), 'Receipt number should follow RCP-2026 format')

  // Verify updated state
  const updatedInvoice = useInvoiceStore.getState().invoices.find((i) => i.id === unpaidInvoice.id)
  assert(updatedInvoice !== undefined, 'Updated invoice must exist')
  assert(updatedInvoice.status === 'paid', 'Invoice status should now be paid')
  assert(updatedInvoice.receiptNumber === result.receiptNumber, 'Receipt number should match')
  assert(updatedInvoice.paymentChannel === 'Test PayKaduna Gateway', 'Payment channel should be recorded')

  const updatedMetrics = useInvoiceStore.getState().getSummaryMetrics()
  assert(updatedMetrics.unpaidCount === initialUnpaidCount - 1, 'Unpaid count should decrease by 1')
  assert(updatedMetrics.paidCount === initialPaidCount + 1, 'Paid count should increase by 1')
  console.log('✓ Payment successfully settled, status transitioned, and metrics updated')

  console.log('--- All useInvoiceStore tests passed! ---')
}

runInvoiceStoreTests().catch((err) => {
  console.error('Test failed:', err)
  throw err
})

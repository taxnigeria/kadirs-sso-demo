import { create } from 'zustand'
import { useEventLogger } from './event-logger'

export interface InvoiceLineItem {
  head: string
  description: string
  amount: number
}

export interface TspInvoice {
  id: string
  invoiceNumber: string
  citizenId: string
  taxpayerName: string
  taxpayerId: string // e.g. NIN or RC
  tin: string
  tspId: string
  tspName: string
  category: 'vehicle' | 'tax' | 'land' | 'utility' | 'environment' | 'education' | 'business' | 'general'
  billTitle: string
  revenueHead: string
  issueDate: string
  dueDate: string
  amount: number
  status: 'unpaid' | 'paid' | 'overdue'
  paidDate?: string
  receiptNumber?: string
  paymentChannel?: string
  rrr?: string
  securityHash: string
  lineItems: InvoiceLineItem[]
  vehicleDetails?: {
    make: string
    plateNo: string
    chassisNo: string
    engineNo: string
  }
  propertyDetails?: {
    plotNo: string
    location: string
    certificateNo: string
  }
}

export interface InvoiceSummaryMetrics {
  totalBilled: number
  totalPaid: number
  totalUnpaid: number
  unpaidCount: number
  paidCount: number
  overdueCount: number
  activeTspsCount: number
}

interface InvoiceStoreState {
  invoices: TspInvoice[]
  isBillingModalOpen: boolean
  selectedInvoiceId: string | null
  activeFilterTsp: string
  activeFilterStatus: 'all' | 'unpaid' | 'paid' | 'overdue'
  searchQuery: string
  viewMode: 'flat' | 'grouped'

  // Actions
  openBillingModal: (preselectedTspId?: string) => void
  closeBillingModal: () => void
  selectInvoice: (id: string | null) => void
  setFilterTsp: (tspId: string) => void
  setFilterStatus: (status: 'all' | 'unpaid' | 'paid' | 'overdue') => void
  setSearchQuery: (query: string) => void
  setViewMode: (mode: 'flat' | 'grouped') => void
  payInvoice: (invoiceId: string, channel?: string) => Promise<{ success: boolean; receiptNumber: string }>
  getSummaryMetrics: () => InvoiceSummaryMetrics
}

const INITIAL_INVOICES: TspInvoice[] = [
  // ── 1. KADVREG: Unpaid Vehicle License Renewal ──
  {
    id: 'inv-kv-001',
    invoiceNumber: 'INV-2026-KV-4412',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'kadvreg',
    tspName: 'KADVREG — Vehicle Licensing',
    category: 'vehicle',
    billTitle: 'Annual Road Tax & Vehicle License Renewal (KAD-582-AA)',
    revenueHead: 'REV-VEH-002: Motor Vehicle Administration',
    issueDate: '2026-02-10',
    dueDate: '2026-03-15',
    amount: 18500,
    status: 'unpaid',
    rrr: 'RRR-2409-1823-4412',
    securityHash: 'SHA256: 7e2f...a109',
    lineItems: [
      { head: 'REV-VEH-002A', description: 'Vehicle License (Private Saloon Car 1.8L-2.5L)', amount: 10000 },
      { head: 'REV-VEH-002B', description: 'Road Worthiness Inspection Electronic Fee', amount: 5000 },
      { head: 'REV-VEH-002C', description: 'Kaduna State Road Infrastructure Development Charge', amount: 3500 }
    ],
    vehicleDetails: {
      make: 'Toyota Corolla 2018 (Grey Metallic)',
      plateNo: 'KAD-582-AA',
      chassisNo: 'JT2BF28K9C0182991',
      engineNo: '2ZR-FE-901844'
    }
  },

  // ── 2. KADVREG: Paid Vehicle Plate & Registration ──
  {
    id: 'inv-kv-002',
    invoiceNumber: 'RCP-2026-KV-3910',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'kadvreg',
    tspName: 'KADVREG — Vehicle Licensing',
    category: 'vehicle',
    billTitle: 'State Vehicle Number Plate Issuance & Original Registration',
    revenueHead: 'REV-VEH-001: Initial Motor Registration',
    issueDate: '2026-01-10',
    dueDate: '2026-01-20',
    amount: 45000,
    status: 'paid',
    paidDate: '2026-01-12T10:35:00Z',
    receiptNumber: 'RCP-2026-KV-3910',
    paymentChannel: 'PayKaduna Central Gateway · Interswitch WebPay',
    rrr: 'RRR-2409-1823-3910',
    securityHash: 'SHA256: 4f8a...92b1',
    lineItems: [
      { head: 'REV-VEH-001A', description: 'Standard Kaduna State Number Plate Production', amount: 25000 },
      { head: 'REV-VEH-001B', description: 'Proof of Ownership Certificate (POC) Verification', amount: 12000 },
      { head: 'REV-VEH-001C', description: 'Central Vehicle Registry Biometric Profiling', amount: 8000 }
    ],
    vehicleDetails: {
      make: 'Toyota Corolla 2018 (Grey Metallic)',
      plateNo: 'KAD-582-AA',
      chassisNo: 'JT2BF28K9C0182991',
      engineNo: '2ZR-FE-901844'
    }
  },

  // ── 3. PIT Portal: Unpaid Direct Assessment Tax ──
  {
    id: 'inv-pit-001',
    invoiceNumber: 'INV-2026-PIT-8802',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'pit',
    tspName: 'PIT Portal (Personal Income Tax)',
    category: 'tax',
    billTitle: 'Direct Assessment Personal Income Tax (Assessment Year 2025/2026)',
    revenueHead: 'REV-PIT-001: Direct Assessment PIT',
    issueDate: '2026-02-01',
    dueDate: '2026-03-31',
    amount: 35000,
    status: 'unpaid',
    rrr: 'RRR-8802-9912-4110',
    securityHash: 'SHA256: 1c9b...773a',
    lineItems: [
      { head: 'REV-PIT-001A', description: 'Self-Employed / Consultancy Direct Assessment Tax', amount: 28000 },
      { head: 'REV-PIT-001B', description: 'Kaduna State Social Development & Infrastructure Levy', amount: 5000 },
      { head: 'REV-PIT-001C', description: 'Taxpayer Digital Certificate & Clearance Fee', amount: 2000 }
    ]
  },

  // ── 4. PIT Portal: Paid Consolidated Tax Assessment (Settled) ──
  {
    id: 'inv-pit-002',
    invoiceNumber: 'RCP-2025-PIT-1194',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'pit',
    tspName: 'PIT Portal (Personal Income Tax)',
    category: 'tax',
    billTitle: 'Consolidated Personal Income Tax Remittance & eTCC Clearance (AY 2024/2025)',
    revenueHead: 'REV-PIT-002: Annual Tax Settlement',
    issueDate: '2025-11-15',
    dueDate: '2025-12-31',
    amount: 82500,
    status: 'paid',
    paidDate: '2025-12-18T14:22:00Z',
    receiptNumber: 'RCP-2025-PIT-1194',
    paymentChannel: 'PayKaduna NIBSS Direct Debit · Zenith Bank',
    rrr: 'RRR-1194-4432-8871',
    securityHash: 'SHA256: 98ea...3341',
    lineItems: [
      { head: 'REV-PIT-002A', description: 'Net Assessed Statutory Income Tax Balance', amount: 72500 },
      { head: 'REV-PIT-002B', description: 'Electronic Tax Clearance Certificate Filing Fee', amount: 10000 }
    ]
  },

  // ── 5. KADGIS / Land Registry: Unpaid Ground Rent ──
  {
    id: 'inv-lnd-001',
    invoiceNumber: 'INV-2026-LND-0914',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'land-reg',
    tspName: 'KADGIS — Lands & Geographic Services',
    category: 'land',
    billTitle: 'Annual Statutory Ground Rent & Cadastral Maintenance (Plot 14B Millennium City)',
    revenueHead: 'REV-LND-004: Ground Rent & Urban Title',
    issueDate: '2026-01-20',
    dueDate: '2026-04-15',
    amount: 22000,
    status: 'unpaid',
    rrr: 'RRR-0914-7721-3301',
    securityHash: 'SHA256: 34aa...5510',
    lineItems: [
      { head: 'REV-LND-004A', description: 'Annual Ground Rent for Residential Property (1,200 sqm)', amount: 15000 },
      { head: 'REV-LND-004B', description: 'Geographic Cadastral GIS Maintenance Levy', amount: 5000 },
      { head: 'REV-LND-004C', description: 'Digital Title Recertification Archive Fee', amount: 2000 }
    ],
    propertyDetails: {
      plotNo: 'Plot 14B, Sector 3',
      location: 'Millennium City Layout, Chikun LGA, Kaduna',
      certificateNo: 'KADGIS/C-of-O/2022/9904'
    }
  },

  // ── 6. KASEPA: Overdue Environmental Levy ──
  {
    id: 'inv-kas-001',
    invoiceNumber: 'INV-2026-KAS-1029',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'kasepa',
    tspName: 'KASEPA (Environmental Protection)',
    category: 'environment',
    billTitle: 'Commercial & Domestic Waste Management & Environmental Sanitation Assessment',
    revenueHead: 'REV-ENV-003: Environmental Sanitation Assessment',
    issueDate: '2026-01-05',
    dueDate: '2026-02-15',
    amount: 12500,
    status: 'overdue',
    rrr: 'RRR-1029-6612-9904',
    securityHash: 'SHA256: b801...df44',
    lineItems: [
      { head: 'REV-ENV-003A', description: 'Annual Solid Waste Collection & Landfill Assessment', amount: 8500 },
      { head: 'REV-ENV-003B', description: 'Pollution Abatement & Environmental Inspection', amount: 3000 },
      { head: 'REV-ENV-003C', description: 'Statutory Default Surcharge (Late Assessment)', amount: 1000 }
    ]
  },

  // ── 7. Water Board: Paid Utility Charges ──
  {
    id: 'inv-wat-001',
    invoiceNumber: 'RCP-2026-WAT-3310',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'water',
    tspName: 'Kaduna State Water Corporation',
    category: 'utility',
    billTitle: 'Residential Metered Water Consumption Charges (Q1 2026)',
    revenueHead: 'REV-WAT-001: Public Water Utility',
    issueDate: '2026-01-25',
    dueDate: '2026-02-10',
    amount: 6800,
    status: 'paid',
    paidDate: '2026-02-08T09:14:00Z',
    receiptNumber: 'RCP-2026-WAT-3310',
    paymentChannel: 'PayKaduna QuickPay · Stanbic IBTC Bank Transfer',
    rrr: 'RRR-3310-8819-2041',
    securityHash: 'SHA256: 77a0...88ec',
    lineItems: [
      { head: 'REV-WAT-001A', description: 'Metered Potable Water Supply Consumption (48 m³)', amount: 5600 },
      { head: 'REV-WAT-001B', description: 'Meter Maintenance & Pipeline Infrastructure Fee', amount: 1200 }
    ]
  },

  // ── 8. PayKaduna Central Gateway: Paid Processing Fee ──
  {
    id: 'inv-pk-001',
    invoiceNumber: 'RCP-2026-PK-0019',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'paykaduna',
    tspName: 'PayKaduna Central Revenue Gateway',
    category: 'general',
    billTitle: 'Unified Identity Verification & Cross-Portal Processing Fee',
    revenueHead: 'REV-REV-005: Consolidated Portal Charges',
    issueDate: '2026-01-02',
    dueDate: '2026-01-02',
    amount: 2500,
    status: 'paid',
    paidDate: '2026-01-02T16:45:00Z',
    receiptNumber: 'RCP-2026-PK-0019',
    paymentChannel: 'PayKaduna Central Wallet · One-Click Authorization',
    rrr: 'RRR-0019-1122-3344',
    securityHash: 'SHA256: ee02...b311',
    lineItems: [
      { head: 'REV-REV-005A', description: 'NIMC vNIN Verification & KYC Tier 2 Tokenization', amount: 1500 },
      { head: 'REV-REV-005B', description: 'Kaduna State Consolidated Stamp Duty Remittance', amount: 1000 }
    ]
  },

  // ── 9. SUBEB: Paid Education Development Levy ──
  {
    id: 'inv-sub-001',
    invoiceNumber: 'RCP-2025-EDU-5501',
    citizenId: 'CIT-KAD-2024-00847',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    tspId: 'subeb',
    tspName: 'SUBEB (Universal Basic Education)',
    category: 'education',
    billTitle: 'Basic Education Development Contribution & School Verification Levy',
    revenueHead: 'REV-EDU-002: Educational Trust Fund',
    issueDate: '2025-09-10',
    dueDate: '2025-09-30',
    amount: 4500,
    status: 'paid',
    paidDate: '2025-09-14T11:05:00Z',
    receiptNumber: 'RCP-2025-EDU-5501',
    paymentChannel: 'PayKaduna KADIRS POS Branch Payment',
    rrr: 'RRR-5501-9922-8810',
    securityHash: 'SHA256: 419b...cc29',
    lineItems: [
      { head: 'REV-EDU-002A', description: 'Kaduna State Basic Education Facility Support Contribution', amount: 3500 },
      { head: 'REV-EDU-002B', description: 'Electronic Record Archiving & Certification Stamp', amount: 1000 }
    ]
  }
]

export const useInvoiceStore = create<InvoiceStoreState>((set, get) => ({
  invoices: INITIAL_INVOICES,
  isBillingModalOpen: false,
  selectedInvoiceId: null,
  activeFilterTsp: 'all',
  activeFilterStatus: 'all',
  searchQuery: '',
  viewMode: 'flat',

  openBillingModal: (preselectedTspId?: string) => {
    set({
      isBillingModalOpen: true,
      activeFilterTsp: preselectedTspId || 'all',
      selectedInvoiceId: null
    })
  },

  closeBillingModal: () => {
    set({ isBillingModalOpen: false, selectedInvoiceId: null })
  },

  selectInvoice: (id: string | null) => {
    set({ selectedInvoiceId: id })
  },

  setFilterTsp: (tspId: string) => {
    set({ activeFilterTsp: tspId })
  },

  setFilterStatus: (status: 'all' | 'unpaid' | 'paid' | 'overdue') => {
    set({ activeFilterStatus: status })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setViewMode: (mode: 'flat' | 'grouped') => {
    set({ viewMode: mode })
  },

  payInvoice: async (invoiceId: string, channel?: string) => {
    const invoice = get().invoices.find((i) => i.id === invoiceId)
    if (!invoice) return { success: false, receiptNumber: '' }

    const receiptNumber = `RCP-2026-${invoice.tspId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    const paymentTimestamp = new Date().toISOString()
    const chosenChannel = channel || 'PayKaduna Central Gateway · Instant Settlement'

    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'paid',
              paidDate: paymentTimestamp,
              receiptNumber,
              paymentChannel: chosenChannel
            }
          : inv
      )
    }))

    // Log to immutable security event stream
    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'TSP_INVOICE_SETTLED',
      actor: invoice.citizenId,
      tspId: invoice.tspId,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber,
        amount: invoice.amount,
        revenueHead: invoice.revenueHead,
        channel: chosenChannel
      }
    })

    return { success: true, receiptNumber }
  },

  getSummaryMetrics: () => {
    const list = get().invoices
    const totalBilled = list.reduce((sum, i) => sum + i.amount, 0)
    const paidList = list.filter((i) => i.status === 'paid')
    const unpaidList = list.filter((i) => i.status === 'unpaid')
    const overdueList = list.filter((i) => i.status === 'overdue')

    const totalPaid = paidList.reduce((sum, i) => sum + i.amount, 0)
    const totalUnpaid = unpaidList.concat(overdueList).reduce((sum, i) => sum + i.amount, 0)

    const uniqueTsps = new Set(list.map((i) => i.tspId))

    return {
      totalBilled,
      totalPaid,
      totalUnpaid,
      unpaidCount: unpaidList.length,
      paidCount: paidList.length,
      overdueCount: overdueList.length,
      activeTspsCount: uniqueTsps.size
    }
  }
}))

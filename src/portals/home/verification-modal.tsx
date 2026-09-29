import { useEffect } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Printer,
  ShieldCheck,
  QrCode,
  Building2,
  CreditCard,
  FileCheck,
  Car,
  BadgeAlert
} from 'lucide-react'

export interface VerificationDoc {
  type: 'etcc' | 'receipt' | 'invoice' | 'flagged'
  docNumber: string
  title: string
  taxpayerName: string
  taxpayerId: string // NIN or RC
  tin: string
  address: string
  lga: string
  taxOffice: string
  issueDate: string
  expiryDate?: string
  status: 'VALID & CERTIFIED' | 'SETTLED & RECONCILED' | 'FLAGGED / SUSPENDED'
  totalAmount?: string
  photoUrl?: string
  etccRecords?: Array<{
    year: string
    income: string
    taxPaid: string
    receiptNo: string
    status: string
  }>
  receiptItems?: Array<{
    head: string
    description: string
    amount: string
  }>
  paymentChannel?: string
  rrr?: string
  vehicleDetails?: {
    make: string
    plateNo: string
    chassisNo: string
    engineNo: string
  }
  securityHash: string
  flagReason?: string
}

export const DEMO_VERIFICATION_PRESETS: Record<string, VerificationDoc> = {
  // Preset 1: Official eTCC for Fatima Abdullahi
  'ETCC-2026-KAD-00847': {
    type: 'etcc',
    docNumber: 'ETCC-2026-KAD-00847',
    title: 'Kaduna State Electronic Tax Clearance Certificate (eTCC)',
    taxpayerName: 'Fatima Aminu Abdullahi',
    taxpayerId: 'NIN: 12345678901',
    tin: 'KAD-TIN-2024-00847',
    address: '14 Swimming Pool Road, Kabala Doki, Kaduna',
    lga: 'Kaduna North LGA',
    taxOffice: 'Kaduna North Tax Office (Kawo Branch)',
    issueDate: '15 January 2026',
    expiryDate: '31 December 2026',
    status: 'VALID & CERTIFIED',
    totalAmount: '₦ 1,545,000.00',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    etccRecords: [
      {
        year: '2023',
        income: '₦ 4,800,000.00',
        taxPaid: '₦ 420,000.00',
        receiptNo: 'KAD-2023-882190',
        status: 'Cleared & Reconciled'
      },
      {
        year: '2024',
        income: '₦ 5,600,000.00',
        taxPaid: '₦ 510,000.00',
        receiptNo: 'KAD-2024-991420',
        status: 'Cleared & Reconciled'
      },
      {
        year: '2025',
        income: '₦ 6,400,000.00',
        taxPaid: '₦ 615,000.00',
        receiptNo: 'KAD-2025-014285',
        status: 'Cleared & Reconciled'
      }
    ],
    securityHash: 'SHA256: 8f9b42c19e34a02d88fa7b41e6c382104598d1bb'
  },

  // Preset 2: Official Motor Vehicle Treasury Receipt for Emeka Obi
  'RCP-2026-KV-3910': {
    type: 'receipt',
    docNumber: 'RCP-2026-KV-3910',
    title: 'Kaduna State Treasury Revenue e-Receipt (KADVREG)',
    taxpayerName: 'Emeka Obi (Obi Logistics Transport Ltd)',
    taxpayerId: 'NIN: 33445566778',
    tin: 'KAD-TIN-2024-99412',
    address: 'Plot 7 Kakuri Industrial Layout, Kaduna South',
    lga: 'Kaduna South LGA',
    taxOffice: 'KADVREG Central Motor Licensing Authority',
    issueDate: '12 February 2026',
    status: 'SETTLED & RECONCILED',
    totalAmount: '₦ 38,500.00',
    paymentChannel: 'PayKaduna Interswitch Gateway (Instant Settlement)',
    rrr: '2901-4482-9018',
    vehicleDetails: {
      make: 'Toyota Hilux 2.8 D-4D (Double Cabin)',
      plateNo: 'KAD-582-AA',
      chassisNo: 'MHF-7782190-KL',
      engineNo: '1GD-8924012'
    },
    receiptItems: [
      {
        head: 'KADVREG-01',
        description: 'Annual Motor Vehicle License Renewal (Commercial)',
        amount: '₦ 18,000.00'
      },
      {
        head: 'KADVREG-02',
        description: 'Computerized Road Worthiness Certificate & Inspection',
        amount: '₦ 12,500.00'
      },
      {
        head: 'KASTLEA-04',
        description: 'State Hackney Carrier Permit & Route Badge 2026',
        amount: '₦ 8,000.00'
      }
    ],
    securityHash: 'SHA256: 3c7a102b5589ef44d187cc89021e54911aa48c21'
  },

  // Preset 3: Corporate Environmental Assessment Invoice for Amina Yusuf
  'INV-2026-KDSME-991': {
    type: 'invoice',
    docNumber: 'INV-2026-KDSME-991',
    title: 'Kaduna State Consolidated Assessment & Revenue Clearance',
    taxpayerName: 'Yusuf Agro-Allied Nig Ltd (Director: Amina Gambo Yusuf)',
    taxpayerId: 'CAC RC: 1849204',
    tin: 'KAD-CORP-2024-18492',
    address: '42 Constitution Road, Kaduna South',
    lga: 'Kaduna South LGA',
    taxOffice: 'KADIRS Large Taxpayer Unit (LTU), Kaduna HQ',
    issueDate: '28 January 2026',
    status: 'SETTLED & RECONCILED',
    totalAmount: '₦ 420,000.00',
    paymentChannel: 'Remita Central Settlement / PayKaduna Corporate Direct',
    rrr: '4402-9910-8812',
    receiptItems: [
      {
        head: 'KASEPA-REV-01',
        description: 'Industrial Environmental Sanitation & Effluent Permit',
        amount: '₦ 180,000.00'
      },
      {
        head: 'COMM-BIZ-03',
        description: 'Urban Business Premises Operational License (Grade A Facility)',
        amount: '₦ 150,000.00'
      },
      {
        head: 'KADIRS-DEV-08',
        description: 'Kaduna State Infrastructure & Agro-Logistics Development Levy',
        amount: '₦ 90,000.00'
      }
    ],
    securityHash: 'SHA256: e8810ab512fec90012781bca66471809d43109a1'
  },

  // Preset 4: Flagged / Revoked Reference
  'INV-FLAGGED-004': {
    type: 'flagged',
    docNumber: 'INV-FLAGGED-004',
    title: 'KADIRS Revenue Enforcement Alert: Revoked / Suspect Document',
    taxpayerName: 'Unverified Entity / Fictitious Assessment',
    taxpayerId: 'NIN: UNKNOWN',
    tin: 'SUSPENDED',
    address: 'Location Undisclosed',
    lga: 'Flagged by Central Auditing AI',
    taxOffice: 'KADIRS Enforcement & Fraud Prevention Directorate',
    issueDate: 'N/A (Revoked)',
    status: 'FLAGGED / SUSPENDED',
    flagReason:
      'This reference number has been revoked due to altered receipt headers and missing bank settlement confirmation. Possession of altered tax instruments constitutes an offence under the Kaduna State Tax Codification and Consolidation Law.',
    securityHash: 'FLAGGED: 0000-FRAUD-BLOCKED-BY-LEDGER'
  }
}

interface VerificationModalProps {
  doc: VerificationDoc
  onClose: () => void
}

export function VerificationModal({ doc, onClose }: VerificationModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handlePrint = () => {
    window.print()
  }

  const isFlagged = doc.type === 'flagged' || doc.status === 'FLAGGED / SUSPENDED'

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto flex items-center justify-center p-3 sm:p-6 lg:p-10 animate-in fade-in duration-200"
    >
      {/* ── Main Document Container ── */}
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="bg-[#0B1E1C] text-white px-5 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            {isFlagged ? (
              <BadgeAlert className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-300 block">
                Official KADIRS Document Verification
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-white">
                {doc.docNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFlagged && (
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer size={14} />
                <span>Print Document</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas */}
        <div className="overflow-y-auto p-6 sm:p-10 flex-1 print:p-0">
          {/* ── FLAG ALERT STATE ── */}
          {isFlagged ? (
            <div className="space-y-6">
              <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center">
                <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-rose-800 tracking-tight">
                  SECURITY WARNING: INVALID OR SUSPENDED RECORD
                </h2>
                <p className="text-sm font-mono text-rose-700 font-bold mt-1">
                  Reference: {doc.docNumber}
                </p>
                <p className="text-xs sm:text-sm text-rose-900/90 max-w-2xl mx-auto mt-3 leading-relaxed">
                  {doc.flagReason}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-800 uppercase tracking-wide">
                  Enforcement Telemetry:
                </p>
                <ul className="list-disc pl-5 text-slate-600 space-y-1">
                  <li>Document verification checksum failed against KADIRS immutable state ledger.</li>
                  <li>Incident logged with timestamp {new Date().toISOString()}.</li>
                  <li>For legitimate assessment clearance, visit any designated Kaduna Revenue Office or call Toll-Free Helpline: <strong>+234 800-KADIRS</strong>.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* ── AUTHENTIC GOVERNMENT DOCUMENT ── */
            <div className="relative border-4 border-double border-slate-200 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[#FDFFFC] to-[#F7FAF7]">
              {/* Background Watermark Seal */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-center"
                aria-hidden="true"
              >
                <Building2 className="w-[450px] h-[450px] text-emerald-950" />
              </div>

              {/* Official Header */}
              <div className="border-b-2 border-emerald-800 pb-5 mb-6 text-center relative z-10">
                <div className="flex justify-center items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    KD
                  </div>
                </div>
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900 font-serif">
                  Kaduna State Government of Nigeria
                </h1>
                <h2 className="text-sm sm:text-base font-bold text-emerald-800 uppercase tracking-wide">
                  Kaduna State Internal Revenue Service (KADIRS)
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Central Revenue &amp; Identity Verification Platform · Tax Law Cap 143 Laws of Kaduna State
                </p>

                <div className="inline-block mt-3 px-4 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs uppercase tracking-wider">
                  {doc.title}
                </div>
              </div>

              {/* Taxpayer Information Block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 relative z-10 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
                {/* Photo (if eTCC) */}
                {doc.photoUrl ? (
                  <div className="flex flex-col items-center justify-center md:border-r border-slate-100 pr-2">
                    <img
                      src={doc.photoUrl}
                      alt={doc.taxpayerName}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-600 shadow-sm"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle2 size={11} /> NIMC Verified
                    </span>
                  </div>
                ) : null}

                <div className={doc.photoUrl ? 'md:col-span-3 space-y-1.5' : 'md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3'}>
                  <div>
                    <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                      Taxpayer / Entity Name
                    </span>
                    <strong className="text-sm sm:text-base text-slate-900 font-bold">
                      {doc.taxpayerName}
                    </strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Identifier
                      </span>
                      <span className="font-mono font-bold text-slate-800">{doc.taxpayerId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        State TIN
                      </span>
                      <span className="font-mono font-bold text-emerald-700">{doc.tin}</span>
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Registered Address &amp; LGA
                    </span>
                    <span className="text-slate-700">
                      {doc.address} · <strong className="text-slate-900">{doc.lga}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* ── SPECIFIC DOCUMENT BODY: eTCC TABLE ── */}
              {doc.type === 'etcc' && doc.etccRecords && (
                <div className="mb-6 relative z-10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <FileCheck size={14} className="text-emerald-600" />
                    Three-Year Statutory Tax Assessment &amp; Payment Record:
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Tax Year</th>
                          <th className="py-2.5 px-3">Declared Income</th>
                          <th className="py-2.5 px-3">Tax Paid</th>
                          <th className="py-2.5 px-3">Official Receipt No</th>
                          <th className="py-2.5 px-3 text-right">Clearance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {doc.etccRecords.map((r) => (
                          <tr key={r.year} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{r.year}</td>
                            <td className="py-2.5 px-3 font-mono">{r.income}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                              {r.taxPaid}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{r.receiptNo}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 size={10} /> {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── SPECIFIC DOCUMENT BODY: VEHICLE RECEIPT ── */}
              {doc.type === 'receipt' && doc.vehicleDetails && (
                <div className="mb-6 relative z-10 bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <Car size={16} /> Certified Vehicle Registration Particulars
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Vehicle:</span>
                      <strong className="text-slate-800 text-[11.5px]">{doc.vehicleDetails.make}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Plate Number:</span>
                      <strong className="text-emerald-800 font-mono text-xs">{doc.vehicleDetails.plateNo}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Chassis No:</span>
                      <span className="font-mono text-slate-700 text-[11px]">{doc.vehicleDetails.chassisNo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Engine No:</span>
                      <span className="font-mono text-slate-700 text-[11px]">{doc.vehicleDetails.engineNo}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Itemized Heads Table (Receipt & Invoice) */}
              {doc.receiptItems && (
                <div className="mb-6 relative z-10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-emerald-600" />
                    Itemized Revenue Heads Breakdown:
                  </h3>
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Revenue Code</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Amount (NGN)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {doc.receiptItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 font-mono font-semibold text-slate-600">
                              {item.head}
                            </td>
                            <td className="py-2 px-3 text-slate-800 font-medium">
                              {item.description}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {item.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={2} className="py-2.5 px-3 font-bold text-slate-900 uppercase">
                            Total Settled Amount:
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-emerald-800">
                            {doc.totalAmount}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Verification & Digital Signature Footer */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative z-10 text-xs">
                {/* QR Code Validation */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-xs">
                    <QrCode className="w-12 h-12 text-slate-900" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Authenticity QR
                    </span>
                    <span className="text-[10.5px] text-slate-600 block leading-tight">
                      Scan with any camera to verify against KADIRS live registry.
                    </span>
                  </div>
                </div>

                {/* Status & Validity */}
                <div className="text-center sm:border-x border-slate-100 px-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Certificate Status
                  </span>
                  <span className="inline-block mt-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ {doc.status}
                  </span>
                  <span className="text-[10.5px] text-slate-500 block mt-1">
                    Issued: {doc.issueDate}
                  </span>
                </div>

                {/* Digital Signature */}
                <div className="text-right space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Digitally Authorized By
                  </span>
                  <div className="font-serif italic font-bold text-emerald-900 text-sm">
                    Executive Chairman, KADIRS
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    {doc.securityHash}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>Kaduna State Internal Revenue Service · Official Online Verification</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors cursor-pointer"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  )
}

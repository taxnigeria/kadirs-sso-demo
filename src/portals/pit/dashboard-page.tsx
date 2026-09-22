import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  CheckCircle2,
  Building2,
  Calculator,
  Award,
  CreditCard,
  QrCode,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Lock
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useEventLogger } from '@/engine/event-logger'
import { analyzeProfileGaps } from '@/engine/progressive-profiling-engine'
import { ProgressiveProfilingModal } from './progressive-profiling-modal'
import './pit.css'

export default function PITDashboard() {
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const isAuthenticated = useAuthEngine((s) => s.isAuthenticated)
  const currentToken = useAuthEngine((s) => s.currentToken)
  const switchTspContext = useAuthEngine((s) => s.switchTspContext)

  // Ensure audience-locked token for PIT when authenticated (Journey 4 SSO exchange)
  useEffect(() => {
    if (isAuthenticated && currentUser && currentToken?.aud !== 'pit') {
      try {
        switchTspContext('pit')
      } catch {
        // Fallback safe
      }
    }
  }, [isAuthenticated, currentUser, currentToken?.aud, switchTspContext])

  // Gap analysis check
  const gapAnalysis = analyzeProfileGaps(currentUser, identity, 'pit')

  // Auto-launch Progressive Profiling modal if gaps exist (e.g. Emeka Obi's first arrival)
  const [isProfilingModalOpen, setIsProfilingModalOpen] = useState(false)
  const [profileUpdatedFeedback, setProfileUpdatedFeedback] = useState(false)

  useEffect(() => {
    if (isAuthenticated && gapAnalysis.hasGaps) {
      setIsProfilingModalOpen(true)
    }
  }, [isAuthenticated, gapAnalysis.hasGaps])

  // Active navigation tab: 'overview' | 'calculator' | 'tcc' | 'receipts'
  const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'tcc' | 'receipts'>('overview')

  // Self-Assessment Tax Calculator State
  const [grossIncomeInput, setGrossIncomeInput] = useState<number>(3200000)
  const [assessmentFiledSuccess, setAssessmentFiledSuccess] = useState(false)

  // Remita RRR payment simulation state
  const [paidBalance, setPaidBalance] = useState(false)
  const [simulatedRrr, setSimulatedRrr] = useState<string | null>(null)

  // Calculate Nigerian PITA (Personal Income Tax Act) figures
  const craFixed = Math.max(200000, grossIncomeInput * 0.01)
  const craPercentage = grossIncomeInput * 0.2
  const totalCRA = craFixed + craPercentage
  const taxableIncome = Math.max(0, grossIncomeInput - totalCRA)

  // Graduated brackets (PITA)
  const computePITA = (taxable: number) => {
    let tax = 0
    let rem = taxable

    // 1st 300k @ 7%
    const b1 = Math.min(rem, 300000)
    tax += b1 * 0.07
    rem -= b1

    // 2nd 300k @ 11%
    if (rem > 0) {
      const b2 = Math.min(rem, 300000)
      tax += b2 * 0.11
      rem -= b2
    }

    // 3rd 500k @ 15%
    if (rem > 0) {
      const b3 = Math.min(rem, 500000)
      tax += b3 * 0.15
      rem -= b3
    }

    // 4th 500k @ 19%
    if (rem > 0) {
      const b4 = Math.min(rem, 500000)
      tax += b4 * 0.19
      rem -= b4
    }

    // 5th 1.6m @ 21%
    if (rem > 0) {
      const b5 = Math.min(rem, 1600000)
      tax += b5 * 0.21
      rem -= b5
    }

    // Balance @ 24%
    if (rem > 0) {
      tax += rem * 0.24
    }

    return Math.round(tax)
  }

  const computedAnnualTax = computePITA(taxableIncome)
  const monthlyTaxWithholding = Math.round(computedAnnualTax / 12)
  const effectiveTaxRate = grossIncomeInput > 0 ? ((computedAnnualTax / grossIncomeInput) * 100).toFixed(1) : '0.0'

  const handleFileSelfAssessment = () => {
    setAssessmentFiledSuccess(true)
    useEventLogger.getState().logEvent({
      category: 'profile',
      action: 'PIT_SELF_ASSESSMENT_FILED',
      actor: currentUser?.citizenId || 'UNKNOWN',
      tspId: 'pit',
      details: {
        grossIncome: grossIncomeInput,
        assessedTax: computedAnnualTax,
        taxYear: 2024
      }
    })
    setTimeout(() => setAssessmentFiledSuccess(false), 5000)
  }

  const handlePayBalance = () => {
    const generatedRrr = `RRR-KD-${Math.floor(10000000 + Math.random() * 90000000)}`
    setSimulatedRrr(generatedRrr)
    setPaidBalance(true)

    useEventLogger.getState().logEvent({
      category: 'profile',
      action: 'PIT_ASSESSMENT_BALANCE_SETTLED',
      actor: currentUser?.citizenId || 'UNKNOWN',
      tspId: 'pit',
      details: {
        rrrReference: generatedRrr,
        amount: 13500,
        taxYear: 2024,
        paymentChannel: 'Remita Kadirs Gateway'
      }
    })
  }

  const citizenName = identity?.legalName || currentUser?.email?.split('@')[0] || 'Taxpayer'
  const citizenTin = currentUser?.tin || 'TIN-KD-2024-PENDING'
  const employerDisplay = currentUser?.employerName || 'Ahmadu Bello University, Zaria'
  const taxOfficeDisplay = currentUser?.taxOffice || 'Zaria Central Tax Office'

  return (
    <div className="pit-root selection:bg-amber-100 selection:text-amber-950">
      {/* ========================================================================= */}
      {/* PIT INSTITUTIONAL DEEP NAVY NAVBAR (Distinct External Platform)           */}
      {/* ========================================================================= */}
      <header className="pit-navbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-1">
          {/* Left: Dual Government Branding */}
          <div className="flex items-center gap-3.5">
            <Link to="/pit" className="flex items-center gap-3">
              {/* Kaduna State Government Coat of Arms Circular Seal */}
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-amber-500 bg-white shadow-xs p-1">
                <div className="w-full h-full rounded-full border border-emerald-700 bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center text-center">
                  <span className="text-[5.5px] font-extrabold uppercase text-emerald-800 leading-none tracking-tighter">
                    KADUNA STATE
                  </span>
                  <div className="w-4 h-3.5 my-0.5 border border-amber-600 bg-amber-500 rounded-xs flex items-center justify-center text-[6.5px] text-white font-black">
                    KD
                  </div>
                  <span className="text-[5px] font-bold uppercase text-emerald-900 leading-none tracking-tighter">
                    GOVERNMENT
                  </span>
                </div>
              </div>

              {/* Text Badge */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <span>KADIRS e-Tax</span>
                    <span className="text-amber-400 font-serif italic text-sm">Portal</span>
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                    PIT Directorate
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-300">
                  Directorate of Personal Income Tax &middot; Direct Assessment &amp; PAYE System
                </p>
              </div>
            </Link>
          </div>

          {/* Right: SSO Identity & Live Status */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {/* Audience Proof Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-slate-300 text-[11px] font-mono">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>aud:</span>
              <strong className="text-amber-400">pit</strong>
              <span className="text-slate-500">&middot;</span>
              <span className="text-emerald-400">RS256 Verified</span>
            </div>

            {/* Tax Year Badge */}
            <div className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
              2024 TAX YEAR
            </div>

            {/* Quick Switch to PayKaduna or KADVREG */}
            <Link
              to="/paykaduna"
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors flex items-center gap-1"
            >
              <span>PayKaduna Hub</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <Link
              to="/kadvreg"
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors flex items-center gap-1"
            >
              <span>KADVREG</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Sub-Nav Tabs */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pit-navlink flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview' ? 'active' : ''
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Annual Assessment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`pit-navlink flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'calculator' ? 'active' : ''
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Self-Assessment Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tcc')}
            className={`pit-navlink flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tcc' ? 'active' : ''
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Tax Clearance Certificate (TCC)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            className={`pit-navlink flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'receipts' ? 'active' : ''
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Receipts &amp; Remita Ledger</span>
          </button>

          {/* Trigger Gap Analysis / Profile Modal for Testing */}
          <button
            type="button"
            onClick={() => setIsProfilingModalOpen(true)}
            className="ml-auto text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-900/40 hover:bg-amber-900/60 border border-amber-500/30 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Edit Tax Profile / Re-Run Gap Analysis</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Feedback alert after updating profile */}
        {profileUpdatedFeedback && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Profile Completeness 100%:</strong> Your progressive tax profile was successfully registered under NDPA Statutory Consent Event 2.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setProfileUpdatedFeedback(false)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAXPAYER IDENTIFIER RIBBON (Formal State Revenue Header)                  */}
        {/* ========================================================================= */}
        <div className="pit-card p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {citizenName}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" />
                  NIMC Verified (Level 2)
                </span>
                <span className="text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded">
                  {currentUser?.employmentType === 'employed'
                    ? 'PAYE Contributor'
                    : 'Direct Assessment'}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                <span>
                  Citizen ID: <strong className="font-mono text-amber-400">{currentUser?.citizenId}</strong>
                </span>
                <span>
                  State TIN: <strong className="font-mono text-amber-400">{citizenTin}</strong>
                </span>
                <span>
                  Tax Office: <strong className="text-slate-200">{taxOfficeDisplay}</strong>
                </span>
                <span>
                  Employer: <strong className="text-slate-200">{employerDisplay}</strong>
                </span>
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('tcc')}
                className="px-3.5 py-2 rounded text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>View Digital TCC</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FINANCIAL SUMMARY METRIC CARDS                                            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="pit-card p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total 2024 Assessment
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                ₦54,000.00
              </div>
            </div>
            <div className="text-[11.5px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Statutory PITA Rate</span>
              <span className="text-emerald-700 font-semibold">Active Ledger</span>
            </div>
          </div>

          <div className="pit-card p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                PAYE Withheld at Source
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                ₦40,500.00
              </div>
            </div>
            <div className="text-[11.5px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Remitted by Employer</span>
              <span className="text-emerald-700 font-semibold">75% Settled</span>
            </div>
          </div>

          <div className="pit-card p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Direct Assessment Balance
              </span>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
                  paidBalance ? 'text-emerald-700' : 'text-amber-800'
                }`}
              >
                {paidBalance ? '₦0.00' : '₦13,500.00'}
              </div>
            </div>
            <div className="text-[11.5px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>{paidBalance ? 'Fully Settled' : 'Due by 31 Dec 2024'}</span>
              <span className={paidBalance ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                {paidBalance ? 'Paid (Remita)' : 'Action Required'}
              </span>
            </div>
          </div>

          <div className="pit-card p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                TCC Compliance Status
              </span>
              <div className="text-xl font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>CLEARED</span>
              </div>
            </div>
            <div className="text-[11.5px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>3-Year History</span>
              <span className="text-emerald-700 font-semibold">In Good Standing</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ANNUAL ASSESSMENT & DIRECT PAYE SUMMARY                            */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Assessment Notice Card */}
            <div className="pit-card">
              <div className="pit-card-header flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    2024 Formal Assessment Ledger &mdash; Notice of Assessment
                  </h2>
                  <p className="text-xs text-slate-500">
                    Governed under Section 37 of the Personal Income Tax Act (PITA 2011 as amended)
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                  REF: KD-NOA-2024-00892
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Ledger Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Taxpayer & Source Details */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Taxpayer Legal Name</span>
                      <span className="font-semibold text-slate-900">{citizenName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">State TIN</span>
                      <span className="font-mono font-bold text-amber-800">{citizenTin}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Employer / Agency</span>
                      <span className="font-semibold text-slate-900">{employerDisplay}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Assigned Tax Jurisdiction</span>
                      <span className="font-semibold text-slate-900">{taxOfficeDisplay}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Consolidated Relief Allowance (CRA)</span>
                      <span className="font-mono font-semibold text-slate-900">₦840,000.00</span>
                    </div>
                  </div>

                  {/* Right Column: Assessment Amounts & Settlement */}
                  <div className="space-y-3 text-xs bg-slate-50 p-4 rounded border border-slate-200">
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Gross Taxable Emoluments (2024)</span>
                      <span className="font-mono font-semibold text-slate-900">₦3,200,000.00</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Gross Annual Tax Assessed</span>
                      <span className="font-mono font-semibold text-slate-900">₦54,000.00</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">PAYE Deductions Withheld at Source</span>
                      <span className="font-mono font-semibold text-emerald-700">- ₦40,500.00</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-slate-300 font-bold text-sm">
                      <span className="text-slate-900">Net Balance Payable</span>
                      <span className={`font-mono ${paidBalance ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {paidBalance ? '₦0.00 (SETTLED)' : '₦13,500.00'}
                      </span>
                    </div>

                    {/* Settlement CTA Button */}
                    {!paidBalance ? (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handlePayBalance}
                          className="w-full pit-btn-primary flex items-center justify-center gap-2 cursor-pointer text-xs"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay Assessment Balance via Remita (₦13,500.00)</span>
                        </button>
                        <span className="text-[11px] text-slate-500 text-center block mt-1">
                          Generates instant Remita Retrieval Reference (RRR) for web, USSD, or commercial bank branch.
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded text-xs text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <strong>Settlement Verified:</strong> Remita RRR: <code className="font-mono">{simulatedRrr}</code> &middot; Assessment ledger updated to zero balance.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PAYE Monthly Remittance Breakdown Table */}
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2.5">
                    Monthly PAYE Remittance Ledger (Employer Withholding)
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Month</th>
                          <th className="py-2.5 px-3">Employer Ref</th>
                          <th className="py-2.5 px-3">Receipt No.</th>
                          <th className="py-2.5 px-3">Amount Withheld</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="py-2 px-3 font-sans">January 2024</td>
                          <td className="py-2 px-3">ABU/PAYE/2024-01</td>
                          <td className="py-2 px-3 text-slate-600">RCP-KD-24-0192</td>
                          <td className="py-2 px-3 font-semibold">₦4,500.00</td>
                          <td className="py-2 px-3 font-sans text-emerald-700 font-semibold">✓ Remitted</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-sans">February 2024</td>
                          <td className="py-2 px-3">ABU/PAYE/2024-02</td>
                          <td className="py-2 px-3 text-slate-600">RCP-KD-24-0283</td>
                          <td className="py-2 px-3 font-semibold">₦4,500.00</td>
                          <td className="py-2 px-3 font-sans text-emerald-700 font-semibold">✓ Remitted</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-sans">March 2024</td>
                          <td className="py-2 px-3">ABU/PAYE/2024-03</td>
                          <td className="py-2 px-3 text-slate-600">RCP-KD-24-0374</td>
                          <td className="py-2 px-3 font-semibold">₦4,500.00</td>
                          <td className="py-2 px-3 font-sans text-emerald-700 font-semibold">✓ Remitted</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-sans">April 2024 &mdash; September 2024</td>
                          <td className="py-2 px-3">ABU/PAYE/2024-Q2-Q3</td>
                          <td className="py-2 px-3 text-slate-600">RCP-KD-24-0982</td>
                          <td className="py-2 px-3 font-semibold">₦27,000.00</td>
                          <td className="py-2 px-3 font-sans text-emerald-700 font-semibold">✓ Remitted</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INTERACTIVE SELF-ASSESSMENT CALCULATOR (PITA)                      */}
        {/* ========================================================================= */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="pit-card">
              <div className="pit-card-header">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-700" />
                  <span>Kaduna State PITA Self-Assessment Tax Calculator</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compute personal income tax liabilities according to the graduated 6-tier PITA rate schedule.
                </p>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Input Column */}
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <label className="pit-label">
                      Gross Estimated Annual Emoluments / Income (₦) *
                    </label>
                    <input
                      type="number"
                      value={grossIncomeInput}
                      onChange={(e) => setGrossIncomeInput(Math.max(0, Number(e.target.value)))}
                      step="50000"
                      className="pit-input font-mono text-base font-semibold"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Includes basic salary, housing, transport, bonuses, or gross business profits.
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 uppercase block mb-1.5">
                      Quick Estimate Bands:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[1200000, 2400000, 3600000, 6000000, 10000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setGrossIncomeInput(amt)}
                          className="px-2.5 py-1 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-mono text-slate-800 transition-colors cursor-pointer"
                        >
                          ₦{(amt / 1000000).toFixed(1)}M
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Statutory Relief Table */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block">
                      Consolidated Relief Allowance (CRA) Breakdown
                    </span>
                    <div className="flex justify-between text-slate-600">
                      <span>Fixed Element (Higher of ₦200,000 or 1% Gross):</span>
                      <span className="font-mono font-semibold">₦{craFixed.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Percentage Element (20% of Gross):</span>
                      <span className="font-mono font-semibold">₦{craPercentage.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-slate-900">
                      <span>Total Relief Deducted:</span>
                      <span className="font-mono">₦{totalCRA.toLocaleString()}.00</span>
                    </div>
                  </div>

                  {/* File Return Action */}
                  <button
                    type="button"
                    onClick={handleFileSelfAssessment}
                    className="w-full pit-btn-primary flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>File 2024 Self-Assessment Return</span>
                  </button>

                  {assessmentFiledSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Self-assessment return successfully filed and registered on KADIRS tax database!
                      </span>
                    </div>
                  )}
                </div>

                {/* Computation Output Column */}
                <div className="lg:col-span-6 bg-slate-900 text-white p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                        Statutory Tax Computation
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">PITA 2011 Schedule</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Gross Annual Income:</span>
                        <span className="font-mono font-semibold text-white">
                          ₦{grossIncomeInput.toLocaleString()}.00
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Less CRA Relief:</span>
                        <span className="font-mono text-amber-400">
                          - ₦{totalCRA.toLocaleString()}.00
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-800 font-semibold text-slate-200">
                        <span>Net Chargeable / Taxable Income:</span>
                        <span className="font-mono text-white">
                          ₦{taxableIncome.toLocaleString()}.00
                        </span>
                      </div>
                    </div>

                    {/* Tax Liability Display */}
                    <div className="p-4 bg-slate-950/70 rounded border border-slate-800 mt-4 text-center">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
                        Net Annual Tax Liability (Payable)
                      </span>
                      <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                        ₦{computedAnnualTax.toLocaleString()}.00
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Effective Tax Rate: <strong className="text-white">{effectiveTaxRate}%</strong> &middot; Monthly Withholding: <strong className="font-mono text-amber-300">₦{monthlyTaxWithholding.toLocaleString()}.00</strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    Rates applied: First ₦300k @ 7%, Next ₦300k @ 11%, Next ₦500k @ 15%, Next ₦500k @ 19%, Next ₦1.6m @ 21%, Balance @ 24%.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TAX CLEARANCE CERTIFICATE (TCC) VIEWER                             */}
        {/* ========================================================================= */}
        {activeTab === 'tcc' && (
          <div className="space-y-6">
            <div className="pit-card">
              <div className="pit-card-header flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Digital Electronic Tax Clearance Certificate (e-TCC)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official certificate of tax compliance issued by Kaduna State Internal Revenue Service
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Certificate</span>
                </button>
              </div>

              <div className="p-6 sm:p-10 flex justify-center">
                {/* Official Certificate Paper Container */}
                <div className="w-full max-w-3xl pit-tcc-certificate space-y-6 text-slate-900">
                  {/* Certificate Header with Dual Crests */}
                  <div className="flex items-center justify-between border-b-2 border-amber-600 pb-4">
                    {/* Kaduna Crest */}
                    <div className="w-14 h-14 rounded-full border border-amber-700 bg-white flex flex-col items-center justify-center text-center p-0.5">
                      <span className="text-[6px] font-black uppercase text-emerald-800">KADUNA</span>
                      <span className="text-[10px] font-black text-amber-700">KD</span>
                      <span className="text-[5px] font-bold text-emerald-900">STATE</span>
                    </div>

                    {/* Official Heading */}
                    <div className="text-center">
                      <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                        KADUNA STATE INTERNAL REVENUE SERVICE
                      </h3>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-amber-800 mt-0.5">
                        DIRECTORATE OF PERSONAL INCOME TAX
                      </h4>
                      <div className="text-[11px] font-serif italic text-slate-600 mt-0.5">
                        Electronic Tax Clearance Certificate (e-TCC)
                      </div>
                    </div>

                    {/* QR Code Verification */}
                    <div className="w-14 h-14 bg-white border border-slate-300 p-1 flex flex-col items-center justify-center">
                      <QrCode className="w-10 h-10 text-slate-900" />
                      <span className="text-[5.5px] font-mono text-slate-500">VERIFY</span>
                    </div>
                  </div>

                  {/* Certificate Reference & Issue Date */}
                  <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                    <span>
                      TCC Ref No: <strong className="font-mono text-amber-900">KADIRS/TCC/2024/098412</strong>
                    </span>
                    <span>
                      Date Issued: <strong>{new Date().toLocaleDateString('en-GB')}</strong>
                    </span>
                    <span>
                      Expiry Date: <strong className="text-emerald-800">31 December 2024</strong>
                    </span>
                  </div>

                  {/* Taxpayer Particulars */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-amber-50/50 p-4 rounded border border-amber-200/60">
                    <div>
                      <span className="text-slate-500 block">Taxpayer Name:</span>
                      <strong className="text-slate-900 text-sm">{citizenName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">State TIN:</span>
                      <strong className="font-mono text-slate-900 text-sm">{citizenTin}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Assigned Tax Office:</span>
                      <span className="font-medium text-slate-800">{taxOfficeDisplay}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Employer / Trade Name:</span>
                      <span className="font-medium text-slate-800">{employerDisplay}</span>
                    </div>
                  </div>

                  {/* 3-Year Statutory Tax Clearance Grid */}
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Assessment &amp; Tax Remittance Record for the Last Three (3) Preceding Years:
                    </h5>
                    <table className="w-full text-xs text-left border border-slate-300">
                      <thead className="bg-slate-100 font-semibold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-300">Tax Year</th>
                          <th className="p-2 border-r border-slate-300">Assessable Income</th>
                          <th className="p-2 border-r border-slate-300">Tax Paid</th>
                          <th className="p-2 border-r border-slate-300">Receipt / RRR No.</th>
                          <th className="p-2">Clearance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        <tr>
                          <td className="p-2 border-r border-slate-300 font-sans font-semibold">2021</td>
                          <td className="p-2 border-r border-slate-300">₦2,400,000.00</td>
                          <td className="p-2 border-r border-slate-300">₦38,000.00</td>
                          <td className="p-2 border-r border-slate-300 text-[10.5px]">RCP-KD-21-9840</td>
                          <td className="p-2 font-sans text-emerald-800 font-semibold">✓ Cleared</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r border-slate-300 font-sans font-semibold">2022</td>
                          <td className="p-2 border-r border-slate-300">₦2,800,000.00</td>
                          <td className="p-2 border-r border-slate-300">₦44,500.00</td>
                          <td className="p-2 border-r border-slate-300 text-[10.5px]">RCP-KD-22-1049</td>
                          <td className="p-2 font-sans text-emerald-800 font-semibold">✓ Cleared</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r border-slate-300 font-sans font-semibold">2023</td>
                          <td className="p-2 border-r border-slate-300">₦3,100,000.00</td>
                          <td className="p-2 border-r border-slate-300">₦50,000.00</td>
                          <td className="p-2 border-r border-slate-300 text-[10.5px]">RCP-KD-23-8841</td>
                          <td className="p-2 font-sans text-emerald-800 font-semibold">✓ Cleared</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Certification Clause & Digital Signatures */}
                  <div className="pt-4 border-t-2 border-amber-600 flex items-end justify-between text-xs">
                    <div className="space-y-1 max-w-[44ch]">
                      <p className="text-[10px] text-slate-500 leading-tight">
                        This is to certify that the above-named taxpayer has satisfied all Personal Income Tax assessments in Kaduna State up to date in accordance with PITA 2011.
                      </p>
                      <span className="font-mono text-[9px] text-slate-400 block">
                        SHA-256 Digest: 8f4a2b90ce8812a...770e (Verifiable on blockchain registry)
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-serif italic font-bold text-amber-900 text-sm">
                        Executive Chairman
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold">
                        Kaduna State Internal Revenue Service
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RECEIPTS & REMITA TRANSACTION LEDGER                              */}
        {/* ========================================================================= */}
        {activeTab === 'receipts' && (
          <div className="space-y-6">
            <div className="pit-card">
              <div className="pit-card-header flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Revenue Receipts &amp; Remita RRR Audit Trail
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verified electronic receipts issued for Kaduna State Personal Income Tax remittances
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  ✓ Verified Ledger (4 Records)
                </span>
              </div>

              <div className="p-5 sm:p-6 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 uppercase tracking-wider font-semibold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Receipt No.</th>
                      <th className="py-2.5 px-3">Transaction Date</th>
                      <th className="py-2.5 px-3">Remita RRR</th>
                      <th className="py-2.5 px-3">Assessment Type</th>
                      <th className="py-2.5 px-3">Amount Paid</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {paidBalance && (
                      <tr className="bg-amber-50/60">
                        <td className="py-2.5 px-3 font-semibold text-amber-900">RCP-KD-24-9901</td>
                        <td className="py-2.5 px-3 font-sans text-slate-700">Today</td>
                        <td className="py-2.5 px-3 font-bold text-amber-800">{simulatedRrr}</td>
                        <td className="py-2.5 px-3 font-sans">Direct Assessment Balance</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">₦13,500.00</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Online Web Gateway</td>
                        <td className="py-2.5 px-3 font-sans text-emerald-700 font-bold">✓ Settled</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2.5 px-3 text-slate-800">RCP-KD-24-0982</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">15 Sep 2024</td>
                      <td className="py-2.5 px-3 text-slate-600">RRR-KD-84729104</td>
                      <td className="py-2.5 px-3 font-sans">PAYE Third Quarter Remittance</td>
                      <td className="py-2.5 px-3 font-semibold">₦27,000.00</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">Employer Direct Debit</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-700 font-semibold">✓ Settled</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-slate-800">RCP-KD-24-0374</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">31 Mar 2024</td>
                      <td className="py-2.5 px-3 text-slate-600">RRR-KD-72810492</td>
                      <td className="py-2.5 px-3 font-sans">PAYE First Quarter Remittance</td>
                      <td className="py-2.5 px-3 font-semibold">₦13,500.00</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">Employer Direct Debit</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-700 font-semibold">✓ Settled</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-slate-800">RCP-KD-23-8841</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">18 Dec 2023</td>
                      <td className="py-2.5 px-3 text-slate-600">RRR-KD-61928401</td>
                      <td className="py-2.5 px-3 font-sans">2023 Annual Assessment Settlement</td>
                      <td className="py-2.5 px-3 font-semibold">₦50,000.00</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">Bank Branch Deposit</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-700 font-semibold">✓ Settled</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* PROGRESSIVE PROFILING DELTA MODAL (Journey 5: Emeka Obi)                  */}
      {/* ========================================================================= */}
      <ProgressiveProfilingModal
        isOpen={isProfilingModalOpen}
        onClose={() => setIsProfilingModalOpen(false)}
        onSuccess={() => {
          setIsProfilingModalOpen(false)
          setProfileUpdatedFeedback(true)
        }}
      />
    </div>
  )
}

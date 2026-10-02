import React from 'react'
import { Users, Sliders, MessageSquare, ShieldCheck, Building2, TrendingDown } from 'lucide-react'
import { useBudgetStore, useBudgetSummary } from '../budget-store'

const MAU_PRESETS = [
  { label: 'Pilot (10k)', value: 10000, desc: 'Initial R1.0 pilot volume' },
  { label: 'Early Scale (25k)', value: 25000, desc: '2 LGA rollout' },
  { label: 'Enterprise (100k)', value: 100000, desc: 'Active taxpayers' },
  { label: 'Full State (500k)', value: 500000, desc: 'State-wide adoption' }
]

export function MauScaleSimulator() {
  const mau = useBudgetStore((s) => s.monthlyActiveUsers)
  const setMau = useBudgetStore((s) => s.setMonthlyActiveUsers)
  const currency = useBudgetStore((s) => s.currency)
  const summary = useBudgetSummary()

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMau(parseInt(e.target.value, 10))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setMau(raw ? parseInt(raw, 10) : 0)
  }

  const estOtp = Math.round(mau * 1.2)
  const estNimc = Math.round(mau * 0.15)
  const estCac = Math.round(mau * 0.02)

  const costPerCitizen =
    currency === 'NGN'
      ? `₦${summary.costPerCitizenPerMonthNgn.toFixed(2)}`
      : `$${summary.costPerCitizenPerMonthUsd.toFixed(2)}`

  return (
    <div className="bg-white dark:bg-[#13241E] border border-[var(--line)] dark:border-[#22382F] rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)] dark:border-[#22382F]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--line-soft)] dark:bg-[#1B352A] text-[var(--green)]">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--ink)] dark:text-[#F0F7F4] flex items-center gap-2">
              Operational Scale & Citizen Volume Simulator
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Live Dynamic OPEX
              </span>
            </h3>
            <p className="text-xs text-[var(--ink-soft)] dark:text-[#A3BFB3]">
              Simulate monthly active taxpayers to observe automated SMS OTP volume, NIMC query tiers, and per-citizen cost efficiency.
            </p>
          </div>
        </div>

        {/* Efficiency Badge */}
        <div className="flex items-center gap-2 bg-[var(--paper)] dark:bg-[#182C24] px-3 py-1.5 rounded-md border border-[var(--line)] dark:border-[#22382F] self-start sm:self-auto">
          <TrendingDown size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-[var(--ink-soft)] dark:text-[#85A396] tracking-wider">
              Cost / Citizen / Mo
            </div>
            <div className="text-sm font-extrabold text-[var(--green)] dark:text-emerald-400">
              {costPerCitizen}
            </div>
          </div>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mr-1 flex items-center gap-1">
          <Users size={14} /> Quick Scale Presets:
        </span>
        {MAU_PRESETS.map((preset) => {
          const isActive = mau === preset.value
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => setMau(preset.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all border ${
                isActive
                  ? 'bg-[var(--green)] text-white border-[var(--green)] shadow-sm font-bold'
                  : 'bg-[var(--paper)] dark:bg-[#1B3129] text-[var(--ink)] dark:text-[#C2D6CC] border-[var(--line)] dark:border-[#2B483C] hover:border-[var(--green)]'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      {/* Slider & Direct Input Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center pt-1">
        <div className="sm:col-span-3 space-y-1.5">
          <div className="flex justify-between text-xs text-[var(--ink-soft)] dark:text-[#85A396]">
            <span>5,000 citizens</span>
            <span className="font-semibold text-[var(--ink)] dark:text-white">
              {mau.toLocaleString()} Monthly Active Users
            </span>
            <span>2,000,000 citizens</span>
          </div>
          <input
            type="range"
            min={5000}
            max={2000000}
            step={5000}
            value={mau}
            onChange={handleSliderChange}
            className="w-full h-2 bg-[var(--line)] dark:bg-[#22382F] rounded-lg appearance-none cursor-pointer accent-[var(--green)]"
            aria-label="Monthly Active Users Slider"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-[11px] font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
            Exact MAU Count
          </label>
          <div className="relative">
            <input
              type="text"
              value={mau.toLocaleString()}
              onChange={handleInputChange}
              className="w-full pl-3 pr-8 py-1.5 text-sm font-bold bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            />
            <Users size={14} className="absolute right-2.5 top-2.5 text-[var(--ink-soft)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Real-time Derived Driver Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--line-soft)] dark:border-[#182C24]">
        <div className="flex items-center gap-2 p-2 rounded bg-[var(--paper)] dark:bg-[#182C24] text-xs">
          <MessageSquare size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="text-[var(--ink-soft)] dark:text-[#85A396]">OTP SMS / WhatsApp: </span>
            <strong className="text-[var(--ink)] dark:text-white">{estOtp.toLocaleString()}</strong> msg/mo
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded bg-[var(--paper)] dark:bg-[#182C24] text-xs">
          <ShieldCheck size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="truncate">
            <span className="text-[var(--ink-soft)] dark:text-[#85A396]">NIMC NIN Lookups: </span>
            <strong className="text-[var(--ink)] dark:text-white">{estNimc.toLocaleString()}</strong> /mo (15%)
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded bg-[var(--paper)] dark:bg-[#182C24] text-xs">
          <Building2 size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
          <div className="truncate">
            <span className="text-[var(--ink-soft)] dark:text-[#85A396]">CAC Corporate Searches: </span>
            <strong className="text-[var(--ink)] dark:text-white">{estCac.toLocaleString()}</strong> /mo (2%)
          </div>
        </div>
      </div>
    </div>
  )
}

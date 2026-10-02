import React from 'react'
import { Sliders } from 'lucide-react'
import { useBudgetStore, getDerivedDrivers } from '../budget-store'
import { FormattedNumberInput } from './formatted-number-input'

export function BudgetAssumptionsSidebar() {
  const assumptions = useBudgetStore((s) => s.assumptions)
  const setAssumption = useBudgetStore((s) => s.setAssumption)
  const scenarios = useBudgetStore((s) => s.scenarios)
  const activeScenarioId = useBudgetStore((s) => s.activeScenarioId)
  const setScenario = useBudgetStore((s) => s.setScenario)
  const isCustomized = useBudgetStore((s) => s.isCustomized)

  const derived = getDerivedDrivers(assumptions)

  const handleNumberChange = (
    key: keyof typeof assumptions,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = parseFloat(e.target.value)
    setAssumption(key, isNaN(val) ? 0 : val)
  }

  return (
    <aside className="bg-white dark:bg-[#18231d] border border-[var(--line)] dark:border-[#2a3a31] rounded-xl p-4 sm:p-5 shadow-xs lg:sticky lg:top-24 space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-extrabold text-base text-[var(--ink)] dark:text-[#e8f0eb] flex items-center justify-between">
          <span>Assumptions</span>
          <span className="p-1 rounded-md bg-[var(--line-soft)] dark:bg-[#1b3a2a] text-[#0b6b3a] dark:text-[#52c78d]">
            <Sliders size={15} />
          </span>
        </h2>
        <p className="text-xs text-[var(--ink-soft)] dark:text-[#9bb0a4] mt-0.5">
          Change a number and everything on the right updates instantly.
        </p>
      </div>

      {/* Scale Preset Dropdown (Requested by user) */}
      <div className="space-y-1.5 pt-1">
        <label
          htmlFor="scale-preset-select"
          className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb]"
        >
          Scale Preset
        </label>
        <select
          id="scale-preset-select"
          value={isCustomized ? 'custom' : activeScenarioId}
          onChange={(e) => {
            if (e.target.value !== 'custom') {
              setScenario(e.target.value)
            }
          }}
          className="w-full text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#0b6b3a] cursor-pointer"
        >
          {scenarios.map((scen) => (
            <option key={scen.id} value={scen.id}>
              {scen.name} ({scen.mau >= 1000000 ? `${scen.mau / 1000000}M` : `${scen.mau / 1000}k`} MAU)
            </option>
          ))}
          {isCustomized && <option value="custom">Custom Scale Override</option>}
        </select>
      </div>

      {/* Input Fields */}
      <div className="space-y-3 pt-2 border-t border-[var(--line-soft)] dark:border-[#22382f]">
        {/* Exchange Rate (Formatted with commas) */}
        <div>
          <label
            htmlFor="a-rate"
            className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] mb-1"
          >
            Exchange rate (₦ for $1)
          </label>
          <FormattedNumberInput
            value={assumptions.rate}
            onChange={(val) => setAssumption('rate', val)}
            className="w-full font-bold text-sm text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b6b3a]"
            aria-label="Exchange rate"
          />
        </div>

        {/* Development timeframe (Build phase duration in months, default: 6) */}
        <div>
          <label
            htmlFor="a-dev-months"
            className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] mb-1"
          >
            Development timeframe (months)
          </label>
          <input
            id="a-dev-months"
            type="number"
            min="1"
            max="36"
            step="1"
            value={assumptions.devMonths !== undefined ? assumptions.devMonths : 2}
            onChange={(e) => handleNumberChange('devMonths', e)}
            className="w-full font-bold text-sm text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b6b3a]"
            aria-label="Development timeframe in months"
          />
          <div className="text-[11px] text-[var(--ink-soft)] dark:text-[#9bb0a4] mt-0.5">
            Pilot build phase duration (2-month constraint)
          </div>
        </div>

        {/* Average users per month (MAU, Formatted with commas) */}
        <div>
          <label
            htmlFor="a-users"
            className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] mb-1"
          >
            Average users per month
          </label>
          <FormattedNumberInput
            value={assumptions.users}
            onChange={(val) => setAssumption('users', val)}
            className="w-full font-bold text-sm text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b6b3a]"
            aria-label="Average users per month"
          />
        </div>

        {/* Logins per user, per month */}
        <div>
          <label
            htmlFor="a-lpu"
            className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] mb-1"
          >
            Logins per user, per month
          </label>
          <input
            id="a-lpu"
            type="number"
            min="0"
            step="any"
            value={assumptions.lpu || ''}
            onChange={(e) => handleNumberChange('lpu', e)}
            className="w-full font-bold text-sm text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b6b3a]"
          />
          <div className="text-[11px] text-[#0b6b3a] dark:text-[#52c78d] font-semibold mt-0.5">
            = {derived.totalLogins.toLocaleString()} logins a month
          </div>
        </div>

        {/* Logins that need an SMS code (%) */}
        <div>
          <label
            htmlFor="a-otp"
            className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] mb-1"
          >
            Logins that need an SMS code (%)
          </label>
          <input
            id="a-otp"
            type="number"
            min="0"
            max="100"
            step="any"
            value={assumptions.otp || ''}
            onChange={(e) => handleNumberChange('otp', e)}
            className="w-full font-bold text-sm text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b6b3a]"
          />
          <div className="text-[11px] text-[#0b6b3a] dark:text-[#52c78d] font-semibold mt-0.5">
            = {derived.otpCount.toLocaleString()} SMS a month
          </div>
        </div>

        {/* New registrations per month (Formatted with commas) */}
        <div>
          <label
            htmlFor="a-reg"
            className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] mb-1"
          >
            New registrations per month
          </label>
          <FormattedNumberInput
            value={assumptions.reg}
            onChange={(val) => setAssumption('reg', val)}
            className="w-full font-bold text-sm text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b6b3a]"
            aria-label="New registrations per month"
          />
          <div className="text-[11px] text-[#0b6b3a] dark:text-[#52c78d] font-semibold mt-0.5">
            = {derived.regCount.toLocaleString()} NIN checks a month
          </div>
        </div>

        {/* Months to budget for (Operational OPEX horizon) */}
        <div>
          <label
            htmlFor="a-months"
            className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] mb-1"
          >
            Operational horizon (months)
          </label>
          <input
            id="a-months"
            type="number"
            min="1"
            step="1"
            value={assumptions.months || ''}
            onChange={(e) => handleNumberChange('months', e)}
            className="w-full font-bold text-sm text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b6b3a]"
          />
          <div className="text-[11px] text-[var(--ink-soft)] dark:text-[#9bb0a4] mt-0.5">
            Running costs projection period
          </div>
        </div>

        {/* Safety buffer (%) */}
        <div>
          <label
            htmlFor="a-cont"
            className="block text-xs font-semibold text-[var(--ink)] dark:text-[#e8f0eb] mb-1"
          >
            Safety buffer (%)
          </label>
          <input
            id="a-cont"
            type="number"
            min="0"
            max="100"
            step="any"
            value={assumptions.cont !== undefined ? assumptions.cont : 0}
            onChange={(e) => handleNumberChange('cont', e)}
            className="w-full font-bold text-sm text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b6b3a]"
          />
          <div className="text-[11px] text-[var(--ink-soft)] dark:text-[#9bb0a4] mt-0.5">
            ₦3.0M delivery contingency itemized in Build
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-2 border-t border-[var(--line-soft)] dark:border-[#22382f] text-[11px] text-[var(--ink-soft)] dark:text-[#9bb0a4] leading-relaxed">
        All prices are placeholders. Edit any quantity or rate live on the right.
      </div>
    </aside>
  )
}

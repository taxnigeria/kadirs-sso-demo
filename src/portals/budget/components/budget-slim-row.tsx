import React, { useState } from 'react'
import { Info, X } from 'lucide-react'
import type { BudgetItem, Currency } from '../budget-types'
import { useBudgetStore, calculateEffectiveItemCost } from '../budget-store'
import { FormattedNumberInput } from './formatted-number-input'

interface BudgetSlimRowProps {
  item: BudgetItem
  sectionTotalNgn: number
  onDelete: (item: BudgetItem) => void
}

export function BudgetSlimRow({ item, sectionTotalNgn, onDelete }: BudgetSlimRowProps) {
  const assumptions = useBudgetStore((s) => s.assumptions)
  const currency = useBudgetStore((s) => s.currency)
  const toggleItem = useBudgetStore((s) => s.toggleItem)
  const updateItemRow = useBudgetStore((s) => s.updateItemRow)

  const [showTooltip, setShowTooltip] = useState(false)

  const { costNgn, costUsd, effectiveQuantity, effectivePeriod } = calculateEffectiveItemCost(item, assumptions)

  const lineTotal = currency === 'NGN' ? costNgn : costUsd
  const currencySymbol = currency === 'NGN' ? '₦' : '$'
  const sectionPercentage =
    sectionTotalNgn > 0 && item.isEnabled ? Math.min(100, Math.round((costNgn / sectionTotalNgn) * 100)) : 0

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateItemRow(item.id, { title: e.target.value })
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    updateItemRow(item.id, {
      quantity: isNaN(val) ? 0 : val,
      isAutoQuantity: false
    })
  }

  // Unit dropdown change that drives calculations and auto volume
  const handleUnitChange = (newUnit: string) => {
    if (item.costType === 'recurring') {
      if (newUnit === 'per SMS' || newUnit === 'SMS') {
        updateItemRow(item.id, {
          unitLabel: newUnit,
          usageDriver: 'mau_otp',
          isAutoQuantity: true
        })
      } else if (newUnit === 'per check' || newUnit === 'check') {
        updateItemRow(item.id, {
          unitLabel: newUnit,
          usageDriver: 'mau_nimc',
          isAutoQuantity: true
        })
      } else if (newUnit === 'per lookup' || newUnit === 'lookup') {
        updateItemRow(item.id, {
          unitLabel: newUnit,
          usageDriver: 'mau_cac',
          isAutoQuantity: true
        })
      } else if (newUnit === 'per user' || newUnit === 'user') {
        updateItemRow(item.id, {
          unitLabel: newUnit,
          usageDriver: 'mau_cloud',
          isAutoQuantity: true
        })
      } else {
        updateItemRow(item.id, {
          unitLabel: newUnit,
          usageDriver: 'fixed',
          isAutoQuantity: false
        })
      }
    } else {
      updateItemRow(item.id, { unitLabel: newUnit })
    }
  }

  // Integrated currency dropdown change
  const handleCurrencyChange = (newCurr: Currency) => {
    const currentCurr = item.currency || 'NGN'
    if (newCurr === currentCurr) return
    const rate = assumptions.rate > 0 ? assumptions.rate : 1500
    let newPrice = item.unitRateNgn

    if (newCurr === 'USD' && currentCurr === 'NGN') {
      newPrice = Math.round((item.unitRateNgn / rate) * 100) / 100
    } else if (newCurr === 'NGN' && currentCurr === 'USD') {
      newPrice = Math.round(item.unitRateNgn * rate)
    }

    updateItemRow(item.id, {
      currency: newCurr,
      unitRateNgn: newPrice
    })
  }

  const handlePriceChange = (val: number) => {
    updateItemRow(item.id, { unitRateNgn: Math.max(0, val) })
  }

  const handleResetAuto = () => {
    updateItemRow(item.id, { isAutoQuantity: true })
  }

  const isAuto = item.usageDriver !== 'fixed' && item.isAutoQuantity !== false

  return (
    <div
      className={`grid grid-cols-[20px_minmax(0,1fr)_auto_100px_24px] md:grid-cols-[20px_minmax(0,1fr)_265px_110px_24px] gap-2 items-center px-3 py-1.5 border-t border-[var(--line)] dark:border-[#2a3a31] transition-colors ${
        item.isEnabled
          ? 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
          : 'opacity-40 bg-[var(--field)] dark:bg-[#121b16]/60'
      }`}
    >
      {/* 1. Toggle Checkbox */}
      <input
        type="checkbox"
        checked={item.isEnabled}
        onChange={() => toggleItem(item.id)}
        className="w-4 h-4 rounded border-[var(--line)] text-[#0b6b3a] focus:ring-[#0b6b3a] accent-[#0b6b3a] cursor-pointer"
        aria-label={item.isEnabled ? 'Exclude from budget' : 'Include in budget'}
        title={item.isEnabled ? 'Click to exclude' : 'Click to include'}
      />

      {/* 2. Item Name & Description Tooltip Popover */}
      <div className="relative flex items-center gap-1.5 min-w-0 pr-1">
        <input
          type="text"
          value={item.title}
          onChange={handleTitleChange}
          className={`w-full font-medium text-xs sm:text-sm bg-transparent border border-transparent hover:border-[var(--line)] dark:hover:border-[#2a3a31] focus:border-[var(--line)] rounded px-1 py-0.5 text-[var(--ink)] dark:text-[#e8f0eb] focus:outline-none focus:ring-1 focus:ring-[#0b6b3a] truncate ${
            !item.isEnabled ? 'line-through text-[var(--ink-soft)] dark:text-[#9bb0a4]' : ''
          }`}
          aria-label="Item title"
        />

        {/* Info Tooltip */}
        {item.description && (
          <div className="relative shrink-0 flex items-center">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip((p) => !p)}
              className="text-[var(--ink-soft)] dark:text-[#85a396] hover:text-[#0b6b3a] dark:hover:text-[#52c78d] transition-colors p-0.5 cursor-help"
              aria-label="Item details"
            >
              <Info size={13} />
            </button>

            {showTooltip && (
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-72 max-w-xs p-2.5 rounded-lg shadow-xl text-xs bg-[#14231c] text-[#e8f0eb] border border-[#2a3a31] pointer-events-none animate-in fade-in zoom-in-95 duration-100"
                role="tooltip"
              >
                <div className="font-bold text-white mb-0.5 flex items-center gap-1">
                  <span>{item.title}</span>
                  {item.costType === 'one-time' ? (
                    <span className="text-[9px] px-1 rounded bg-blue-900/60 text-blue-200 font-bold">CAPEX</span>
                  ) : (
                    <span className="text-[9px] px-1 rounded bg-emerald-900/60 text-emerald-200 font-bold">OPEX</span>
                  )}
                </div>
                <div className="text-[11px] text-[#9bb0a4] leading-relaxed">{item.description}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Calc Section: [How many (50px)] [Unit (95px)] [× (10px)] [Integrated Currency + Price (105px)] */}
      <div className="grid grid-cols-[50px_95px_10px_105px] gap-1 items-center">
        {/* Quantity Input (50px, smaller as requested) */}
        <div className="relative">
          <input
            type="number"
            min="0"
            step="any"
            value={isAuto ? effectiveQuantity : item.quantity}
            onChange={handleQuantityChange}
            disabled={isAuto}
            className={`w-full font-semibold text-xs text-center border rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-[#0b6b3a] ${
              isAuto
                ? 'bg-[var(--accbg)] dark:bg-[#1b3a2a] text-[#0b6b3a] dark:text-[#52c78d] font-bold border-transparent'
                : 'bg-[var(--field)] dark:bg-[#121b16] text-[var(--ink)] dark:text-[#e8f0eb] border-[var(--line)] dark:border-[#2a3a31]'
            }`}
            aria-label="Quantity"
            title={isAuto ? `Calculated volume: ${effectiveQuantity.toLocaleString()}` : undefined}
          />
          {isAuto ? (
            <button
              type="button"
              onClick={() => updateItemRow(item.id, { isAutoQuantity: false })}
              className="absolute -top-2 right-0.5 text-[8px] font-bold px-1 py-0.2 rounded-full bg-[#0b6b3a] text-white cursor-pointer shadow-2xs hover:bg-[#158a52]"
              title="Calculated from assumptions. Click to manually override."
            >
              auto
            </button>
          ) : (
            item.usageDriver !== 'fixed' && (
              <button
                type="button"
                onClick={handleResetAuto}
                className="absolute -top-2 right-0.5 text-[8px] font-bold px-1 py-0.2 rounded-full bg-[var(--line)] dark:bg-[#2a3a31] text-[var(--ink-soft)] dark:text-[#9bb0a4] cursor-pointer hover:bg-[#0b6b3a] hover:text-white"
                title="Reset to dynamic assumption formula"
              >
                dyn
              </button>
            )
          )}
        </div>

        {/* Unit Dropdown (Drives calculation & auto volumes) */}
        <div className="relative">
          <select
            value={
              item.unitLabel === 'per dev/month' || item.unitLabel === 'per engineer/month'
                ? 'dev/mo'
                : item.unitLabel
            }
            onChange={(e) => handleUnitChange(e.target.value)}
            className="w-full text-[11px] font-semibold text-[var(--ink)] dark:text-[#e8f0eb] bg-[var(--field)] dark:bg-[#121b16] border border-[var(--line)] dark:border-[#2a3a31] rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-[#0b6b3a] cursor-pointer truncate"
            aria-label="Unit"
          >
            {item.costType === 'one-time' ? (
              <>
                <option value="dev/mo">dev/mo</option>
                <option value="lot">lot</option>
                <option value="item">item</option>
                <option value="month">month</option>
                <option value="session">session</option>
                {!['dev/mo', 'lot', 'item', 'month', 'session', 'per dev/month', 'per engineer/month'].includes(
                  item.unitLabel
                ) && <option value={item.unitLabel}>{item.unitLabel}</option>}
              </>
            ) : (
              <>
                <option value="per month">per month</option>
                <option value="per SMS">per SMS</option>
                <option value="per check">per check</option>
                <option value="per lookup">per lookup</option>
                <option value="per user">per user</option>
                <option value="per dev/mo">per dev/mo</option>
                {![
                  'per month',
                  'per SMS',
                  'per check',
                  'per lookup',
                  'per user',
                  'per dev/mo',
                  'SMS',
                  'checks',
                  'check'
                ].includes(item.unitLabel) && <option value={item.unitLabel}>{item.unitLabel}</option>}
              </>
            )}
          </select>
          {/* Subtle indicator for build items that scale with development timeframe */}
          {item.costType === 'one-time' && effectivePeriod > 1 && (
            <span
              className="absolute -top-2 right-1 text-[8px] font-extrabold px-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 pointer-events-none select-none"
              title={`Multiplied by ${effectivePeriod} months development timeframe`}
            >
              ×{effectivePeriod}m
            </span>
          )}
        </div>

        {/* Times Symbol */}
        <span className="text-[var(--ink-soft)] dark:text-[#9bb0a4] text-center font-bold text-xs select-none">
          ×
        </span>

        {/* Integrated Currency Select + Comma Formatted Price Input */}
        <div className="flex items-center rounded border border-[var(--line)] dark:border-[#2a3a31] bg-[var(--field)] dark:bg-[#121b16] focus-within:ring-1 focus-within:ring-[#0b6b3a] focus-within:border-[#0b6b3a] overflow-hidden">
          <select
            value={item.currency || 'NGN'}
            onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
            className="text-[11px] font-bold text-[#0b6b3a] dark:text-[#52c78d] bg-transparent pl-1 pr-0.5 py-1 focus:outline-none cursor-pointer border-r border-[var(--line)]/50 dark:border-[#2a3a31]/50 appearance-none text-center"
            title="Item currency: ₦ Naira or $ USD"
            aria-label="Item currency"
          >
            <option value="NGN">₦</option>
            <option value="USD">$</option>
          </select>
          <FormattedNumberInput
            value={item.unitRateNgn}
            onChange={handlePriceChange}
            className="w-full font-bold text-xs text-right bg-transparent text-[var(--ink)] dark:text-[#e8f0eb] px-1.5 py-1 border-none focus:outline-none focus:ring-0"
            aria-label="Unit price"
          />
        </div>
      </div>

      {/* 4. Line Total & Mini Contribution Bar */}
      <div className="text-right pl-1">
        <div
          className={`font-bold text-xs sm:text-sm tabular-nums text-[var(--ink)] dark:text-[#e8f0eb] ${
            !item.isEnabled ? 'line-through opacity-50' : ''
          }`}
        >
          {currencySymbol}
          {Math.round(lineTotal).toLocaleString()}
        </div>
        <div className="w-full h-1 bg-[var(--line)] dark:bg-[#2a3a31] rounded-full overflow-hidden mt-0.5">
          <div
            className="h-full bg-[#0b6b3a] dark:bg-[#52c78d] transition-all duration-200"
            style={{ width: `${sectionPercentage}%` }}
          />
        </div>
      </div>

      {/* 5. Delete Action Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="w-6 h-6 rounded flex items-center justify-center text-[var(--ink-soft)] dark:text-[#85a396] hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer text-xs"
          title="Remove line item"
          aria-label="Delete line"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

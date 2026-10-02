import React, { useState, useMemo } from 'react'
import {
  Users,
  Server,
  Layers,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import type { BudgetCategory, BudgetItem } from '../budget-types'
import { useBudgetStore, calculateEffectiveItemCost } from '../budget-store'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Users,
  Server,
  Layers,
  ShieldCheck,
  GraduationCap
}

interface BudgetCategoryGroupProps {
  category: BudgetCategory
  onAddItem: (categoryId: string) => void
  onEditItem: (item: BudgetItem) => void
  searchQuery?: string
  costTypeFilter?: 'all' | 'one-time' | 'recurring'
}

export function BudgetCategoryGroup({
  category,
  onAddItem,
  onEditItem,
  searchQuery,
  costTypeFilter = 'all'
}: BudgetCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const allItems = useBudgetStore((s) => s.items)
  const toggleItem = useBudgetStore((s) => s.toggleItem)
  const updateItemPrice = useBudgetStore((s) => s.updateItemPrice)
  const deleteItem = useBudgetStore((s) => s.deleteItem)
  const currency = useBudgetStore((s) => s.currency)
  const assumptions = useBudgetStore((s) => s.assumptions)

  const items = useMemo(() => {
    return allItems.filter((i) => {
      if (i.categoryId !== category.id) return false
      if (costTypeFilter !== 'all' && i.costType !== costTypeFilter) return false
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (
          i.title.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [allItems, category.id, costTypeFilter, searchQuery])

  const IconComponent = CATEGORY_ICONS[category.iconName] || Layers

  const activeCount = useMemo(() => items.filter((i) => i.isEnabled).length, [items])
  const totalCount = items.length

  // Calculate category totals
  const { catTotalNgn, catTotalUsd } = useMemo(() => {
    let ngn = 0
    for (const item of items) {
      if (!item.isEnabled) continue
      const { costNgn } = calculateEffectiveItemCost(item, assumptions)
      ngn += costNgn
    }
    return {
      catTotalNgn: ngn,
      catTotalUsd: ngn / (assumptions.rate || 1)
    }
  }, [items, assumptions])


  const formatMoney = (ngn: number, usd: number, compact = false) => {
    const val = currency === 'NGN' ? ngn : usd
    const sym = currency === 'NGN' ? '₦' : '$'
    if (compact) {
      if (val >= 1_000_000_000) return `${sym}${(val / 1_000_000_000).toFixed(2)}B`
      if (val >= 1_000_000) return `${sym}${(val / 1_000_000).toFixed(1)}M`
      if (val >= 1_000) return `${sym}${(val / 1_000).toFixed(0)}k`
      return `${sym}${Math.round(val)}`
    }
    return `${sym}${Math.round(val).toLocaleString()}`
  }

  const handleDelete = (item: BudgetItem) => {
    deleteItem(item.id)
    toast.info(`Removed "${item.title}"`, {
      action: {
        label: 'Undo',
        onClick: () => useBudgetStore.getState().undoDelete()
      }
    })
  }

  if (items.length === 0 && (searchQuery?.trim() || costTypeFilter !== 'all')) {
    return null
  }

  return (
    <div className="bg-white dark:bg-[#13241E] border border-[var(--line)] dark:border-[#22382F] rounded-lg shadow-xs overflow-hidden transition-all">
      {/* Category Header */}
      <div className="p-4 bg-[var(--paper)] dark:bg-[#182C24] border-b border-[var(--line)] dark:border-[#22382F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <div
            className="p-2 rounded-md text-white shrink-0 shadow-xs"
            style={{ backgroundColor: category.accentColor }}
          >
            <IconComponent size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-[var(--ink)] dark:text-white group-hover:text-[var(--green)] transition-colors">
                {category.title}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--line-soft)] dark:bg-[#1B352A] text-[var(--ink-soft)] dark:text-[#A3BFB3]">
                {activeCount} of {totalCount} active
              </span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] dark:text-[#85A396] line-clamp-1 sm:line-clamp-none mt-0.5">
              {category.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-[var(--ink-soft)] dark:text-[#85A396] tracking-wider">
              Category Subtotal
            </div>
            <div className="text-base font-black text-[var(--ink)] dark:text-white font-mono">
              {formatMoney(catTotalNgn, catTotalUsd, false)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 print:hidden">
            <button
              type="button"
              onClick={() => onAddItem(category.id)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Add custom line item to this category"
            >
              <Plus size={13} />
              Add
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] dark:hover:text-white transition-colors"
              aria-label="Toggle Category Accordion"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Line Items Table / List */}
      {isExpanded && (
        <div className="divide-y divide-[var(--line-soft)] dark:divide-[#182C24]">
          {items.map((item) => {
            const { costNgn, costUsd } = calculateEffectiveItemCost(item, assumptions)

            let multiplierLabel = ''
            if (item.costType === 'one-time') {
              if (item.periodMonths > 1) {
                multiplierLabel = `${item.quantity} ${item.quantity > 1 ? 'roles' : 'role'} × ${item.periodMonths} mos`
              } else if (item.quantity > 1) {
                multiplierLabel = `Qty: ${item.quantity}`
              } else {
                multiplierLabel = '1-time lump sum'
              }
            } else {
              if (item.usageDriver === 'mau_otp') {
                multiplierLabel = `${(assumptions.users * (item.driverMultiplier ?? 1.2)).toLocaleString()} OTPs/mo`
              } else if (item.usageDriver === 'mau_nimc') {
                multiplierLabel = `${(assumptions.users * (item.driverMultiplier ?? 0.15)).toLocaleString()} NIN checks/mo`
              } else if (item.usageDriver === 'mau_cac') {
                multiplierLabel = `${(assumptions.users * (item.driverMultiplier ?? 0.02)).toLocaleString()} CAC lookups/mo`
              } else if (item.usageDriver === 'mau_cloud') {
                multiplierLabel = `${assumptions.users.toLocaleString()} concurrent users`
              } else {
                multiplierLabel = `${item.quantity > 1 ? `${item.quantity} units · ` : ''}Monthly Recurring`
              }
            }


            return (
              <div
                key={item.id}
                className={`p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  item.isEnabled
                    ? 'hover:bg-[var(--paper)] dark:hover:bg-[#182C24]/50'
                    : 'opacity-50 bg-[var(--paper)]/50 dark:bg-black/20'
                }`}
              >
                {/* Left: Checkbox + Title + Description */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={item.isEnabled}
                    onChange={() => toggleItem(item.id)}
                    className="mt-1 h-4 w-4 rounded border-[var(--line)] text-[var(--green)] focus:ring-[var(--green)] accent-[var(--green)] cursor-pointer"
                    title={item.isEnabled ? 'Disable item' : 'Enable item'}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`font-bold text-sm ${
                          item.isEnabled
                            ? 'text-[var(--ink)] dark:text-white'
                            : 'text-[var(--ink-soft)] dark:text-[#85A396] line-through'
                        }`}
                      >
                        {item.title}
                      </span>

                      {/* Tag: Cost Type */}
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                          item.costType === 'one-time'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        }`}
                      >
                        {item.costType === 'one-time' ? 'CAPEX' : 'OPEX'}
                      </span>

                      {/* Tag: MAU Driven */}
                      {item.usageDriver !== 'fixed' && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 flex items-center gap-0.5">
                          <Sparkles size={10} /> MAU Scale
                        </span>
                      )}

                      {item.isCustom && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                          Custom
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-[var(--ink-soft)] dark:text-[#A3BFB3] mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="text-[11px] text-[var(--ink-soft)] dark:text-[#85A396] mt-1 flex items-center gap-2">
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {multiplierLabel}
                      </span>
                      <span>·</span>
                      <span>Unit: {item.unitLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Editable Unit Price + Effective Total + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-7 sm:pl-0">
                  {/* Inline Price Editor */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs text-[var(--ink-soft)] dark:text-[#85A396]">
                      <span>Rate: ₦</span>
                      <input
                        type="number"
                        min={0}
                        step={item.unitRateNgn > 1000 ? 50000 : 1}
                        value={item.unitRateNgn}
                        onChange={(e) =>
                          updateItemPrice(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-1.5 py-0.5 text-xs font-mono font-bold bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded text-right focus:outline-none focus:ring-1 focus:ring-[var(--green)] print:border-none print:bg-transparent"
                        title="Click to edit unit price (saves dynamically)"
                      />
                    </div>

                    <div className="text-sm font-black text-[var(--ink)] dark:text-white font-mono mt-0.5">
                      {formatMoney(costNgn, costUsd, false)}
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 print:hidden">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="p-1.5 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line-soft)] dark:hover:bg-[#1B352A] transition-colors"
                      title="Edit item attributes"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded text-[var(--ink-soft)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {items.length === 0 && (
            <div className="p-6 text-center text-xs text-[var(--ink-soft)]">
              No items in this category yet. Click &quot;Add&quot; above to create one.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

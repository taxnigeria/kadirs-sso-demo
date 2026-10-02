import React, { useState } from 'react'
import { X, Plus, Edit2, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { BudgetItem, CostType, UsageDriver } from '../budget-types'
import { useBudgetStore } from '../budget-store'
import { FormattedNumberInput } from './formatted-number-input'

interface BudgetItemModalProps {
  isOpen: boolean
  onClose: () => void
  itemToEdit?: BudgetItem | null
  defaultCategoryId?: string
}

interface BudgetItemFormProps {
  onClose: () => void
  itemToEdit?: BudgetItem | null
  defaultCategoryId?: string
}

function BudgetItemForm({ onClose, itemToEdit, defaultCategoryId }: BudgetItemFormProps) {
  const categories = useBudgetStore((s) => s.categories)
  const addItem = useBudgetStore((s) => s.addItem)
  const updateItem = useBudgetStore((s) => s.updateItem)
  const deleteItem = useBudgetStore((s) => s.deleteItem)

  const [title, setTitle] = useState(itemToEdit?.title || '')
  const [categoryId, setCategoryId] = useState(itemToEdit?.categoryId || defaultCategoryId || 'engineering')
  const [costType, setCostType] = useState<CostType>(itemToEdit?.costType || 'one-time')
  const [unitRateNgn, setUnitRateNgn] = useState<number>(itemToEdit?.unitRateNgn ?? 1000000)
  const [quantity, setQuantity] = useState<number>(itemToEdit?.quantity ?? 1)
  const [periodMonths, setPeriodMonths] = useState<number>(itemToEdit?.periodMonths ?? 1)
  const [unitLabel, setUnitLabel] = useState(itemToEdit?.unitLabel || 'one-time')
  const [usageDriver, setUsageDriver] = useState<UsageDriver>(itemToEdit?.usageDriver || 'fixed')
  const [description, setDescription] = useState(itemToEdit?.description || '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter an item title')
      return
    }

    if (itemToEdit) {
      updateItem(itemToEdit.id, {
        title: title.trim(),
        categoryId,
        costType,
        unitRateNgn,
        quantity,
        periodMonths,
        unitLabel,
        usageDriver,
        description: description.trim()
      })
      toast.success('Budget line item updated')
    } else {
      addItem({
        title: title.trim(),
        categoryId,
        costType,
        unitRateNgn,
        quantity,
        periodMonths,
        unitLabel,
        usageDriver,
        description: description.trim(),
        isEnabled: true
      })
      toast.success('New line item added to budget')
    }

    onClose()
  }

  const handleDelete = () => {
    if (itemToEdit) {
      deleteItem(itemToEdit.id)
      toast.info('Item removed from budget', {
        action: {
          label: 'Undo',
          onClick: () => useBudgetStore.getState().undoDelete()
        }
      })
      onClose()
    }
  }

  return (
    <div
      className="w-full max-w-lg bg-white dark:bg-[#13241E] border border-[var(--line)] dark:border-[#22382F] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] dark:border-[#22382F]">
        <h3 className="font-bold text-base text-[var(--ink)] dark:text-white flex items-center gap-2">
          {itemToEdit ? <Edit2 size={16} /> : <Plus size={16} />}
          {itemToEdit ? 'Edit Budget Line Item' : 'Add Custom Line Item'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] dark:hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
            Item Title / Name *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lead Solutions Architect or Custom Biometric Scanner"
            className="w-full px-3 py-2 text-sm bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
          />
        </div>

        {/* Category & Cost Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
              Cost Type
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md">
              <button
                type="button"
                onClick={() => {
                  setCostType('one-time')
                  if (unitLabel === 'per month') setUnitLabel('one-time')
                }}
                className={`py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  costType === 'one-time'
                    ? 'bg-[var(--green)] text-white'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                One-Time (CAPEX)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCostType('recurring')
                  if (unitLabel === 'one-time') setUnitLabel('per month')
                }}
                className={`py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  costType === 'recurring'
                    ? 'bg-[var(--green)] text-white'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                Recurring (OPEX)
              </button>
            </div>
          </div>
        </div>

        {/* Operational Cost Scaling Driver (if recurring) */}
        {costType === 'recurring' && (
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
              Operational Cost Scaling Driver
            </label>
            <select
              value={usageDriver}
              onChange={(e) => setUsageDriver(e.target.value as UsageDriver)}
              className="w-full px-3 py-2 text-xs bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            >
              <option value="fixed">Fixed Monthly (Predictable SLA / Hosting)</option>
              <option value="mau_otp">Variable: Scales with OTP Volume (MAU × 1.2)</option>
              <option value="mau_nimc">Variable: Scales with NIMC Verification (MAU × 15%)</option>
              <option value="mau_cac">Variable: Scales with CAC Corporate Lookups (MAU × 2%)</option>
              <option value="mau_cloud">Variable: Dynamic Cloud Autoscaling Tier</option>
            </select>
          </div>
        )}

        {/* Unit Price (NGN) & Unit Label */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
              Unit Price (₦ NGN) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-[var(--ink-soft)]">₦</span>
              <FormattedNumberInput
                value={unitRateNgn}
                onChange={(val) => setUnitRateNgn(val)}
                className="w-full pl-7 pr-3 py-2 text-sm font-mono bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
              Unit Label
            </label>
            <input
              type="text"
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              placeholder="e.g. per month, per dev/month, per check"
              className="w-full px-3 py-2 text-xs bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            />
          </div>
        </div>

        {/* Quantity & Period (Months) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
              Quantity / Staff Count
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-sm bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
              Duration / Months
            </label>
            <input
              type="number"
              min={1}
              value={periodMonths}
              onChange={(e) => setPeriodMonths(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-sm bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
            />
          </div>
        </div>

        {/* Description / Scope */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ink-soft)] dark:text-[#A3BFB3] mb-1">
            Scope &amp; Technical Responsibilities
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief summary of what this role or service delivers..."
            className="w-full px-3 py-2 text-xs bg-[var(--paper)] dark:bg-[#1B3129] border border-[var(--line)] dark:border-[#2B483C] rounded-md text-[var(--ink)] dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--green)]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--line)] dark:border-[#22382F]">
          {itemToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              Delete Item
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] rounded border border-[var(--line)] dark:border-[#2B483C] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[var(--green)] hover:bg-[#158A52] rounded shadow-sm transition-colors cursor-pointer"
            >
              <Save size={14} />
              {itemToEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export function BudgetItemModal({
  isOpen,
  onClose,
  itemToEdit,
  defaultCategoryId
}: BudgetItemModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <BudgetItemForm
        key={itemToEdit ? itemToEdit.id : `new-${defaultCategoryId || 'engineering'}`}
        onClose={onClose}
        itemToEdit={itemToEdit}
        defaultCategoryId={defaultCategoryId}
      />
    </div>
  )
}

import React, { useRef, useState, useLayoutEffect } from 'react'

interface FormattedNumberInputProps {
  value: number
  onChange: (val: number) => void
  className?: string
  placeholder?: string
  min?: number
  disabled?: boolean
  prefix?: React.ReactNode
  'aria-label'?: string
}

function formatWithCommas(cleanStr: string): string {
  if (!cleanStr) return ''
  const parts = cleanStr.split('.')
  const intDigits = parts[0].replace(/\D/g, '')
  const formattedInt = intDigits ? parseInt(intDigits, 10).toLocaleString() : ''
  if (parts.length > 1) {
    return `${formattedInt}.${parts[1].replace(/\D/g, '')}`
  }
  return formattedInt
}

export function FormattedNumberInput({
  value,
  onChange,
  className = '',
  placeholder,
  min = 0,
  disabled = false,
  prefix,
  'aria-label': ariaLabel
}: FormattedNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [localStr, setLocalStr] = useState<string | null>(null)

  // Track the number of digits before cursor so cursor position can be restored
  const cursorRef = useRef<{ digitsBefore: number } | null>(null)

  // Purely derived display value avoiding set-state-in-effect
  const displayValue =
    isFocused && localStr !== null
      ? localStr
      : value > 0
      ? value.toLocaleString()
      : value === 0
      ? '0'
      : ''

  // Restore cursor position after DOM update when actively focused
  useLayoutEffect(() => {
    if (cursorRef.current && inputRef.current && isFocused) {
      const { digitsBefore } = cursorRef.current
      const text = inputRef.current.value
      let newCursor = text.length
      let count = 0

      for (let i = 0; i < text.length; i++) {
        if (count >= digitsBefore) {
          newCursor = i
          break
        }
        if (/\d/.test(text[i])) {
          count++
        }
        newCursor = i + 1
      }

      inputRef.current.setSelectionRange(newCursor, newCursor)
      cursorRef.current = null
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    const rawVal = el.value
    const currentCursor = el.selectionStart ?? rawVal.length

    // Count how many non-comma digits exist up to the cursor in current string
    const digitsBefore = rawVal.slice(0, currentCursor).replace(/\D/g, '').length

    // If cleared completely
    if (rawVal.trim() === '') {
      cursorRef.current = { digitsBefore: 0 }
      setLocalStr('')
      onChange(0)
      return
    }

    // Strip everything except digits and decimal point
    const clean = rawVal.replace(/[^\d.]/g, '')
    if (clean === '') {
      cursorRef.current = { digitsBefore: 0 }
      setLocalStr('')
      onChange(0)
      return
    }

    // Format with commas
    const parts = clean.split('.')
    const intPart = parts[0]
    const decimalPart = parts.length > 1 ? parts.slice(1).join('') : null

    const formattedInt = intPart ? parseInt(intPart, 10).toLocaleString() : '0'
    const newFormatted = decimalPart !== null ? `${formattedInt}.${decimalPart}` : formattedInt

    cursorRef.current = { digitsBefore }
    setLocalStr(newFormatted)

    const num = parseFloat(clean)
    if (!isNaN(num)) {
      onChange(Math.max(min, num))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const { selectionStart, selectionEnd, value: currentVal } = el
    if (selectionStart === null || selectionEnd === null) return

    // Allow normal handling if text range is selected
    if (selectionStart !== selectionEnd) return

    // Smart comma delete: when backspacing directly after a comma, delete the digit before it
    if (e.key === 'Backspace') {
      if (selectionStart > 0 && currentVal[selectionStart - 1] === ',') {
        e.preventDefault()
        const before = currentVal.slice(0, selectionStart - 2)
        const after = currentVal.slice(selectionStart)
        const nextVal = before + after
        const digitsBefore = before.replace(/\D/g, '').length
        const clean = nextVal.replace(/[^\d.]/g, '')
        const num = clean ? parseFloat(clean) : 0
        const formatted = clean ? formatWithCommas(clean) : ''
        cursorRef.current = { digitsBefore }
        setLocalStr(formatted)
        onChange(Math.max(min, num))
      }
    } else if (e.key === 'Delete') {
      // Smart comma delete: when deleting directly before a comma, delete the digit after it
      if (selectionStart < currentVal.length && currentVal[selectionStart] === ',') {
        e.preventDefault()
        const before = currentVal.slice(0, selectionStart)
        const after = currentVal.slice(selectionStart + 2)
        const nextVal = before + after
        const digitsBefore = before.replace(/\D/g, '').length
        const clean = nextVal.replace(/[^\d.]/g, '')
        const num = clean ? parseFloat(clean) : 0
        const formatted = clean ? formatWithCommas(clean) : ''
        cursorRef.current = { digitsBefore }
        setLocalStr(formatted)
        onChange(Math.max(min, num))
      }
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    setLocalStr(value > 0 ? value.toLocaleString() : '0')
  }

  const handleBlur = () => {
    setIsFocused(false)
    setLocalStr(null)
    cursorRef.current = null
  }

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-2 text-xs font-semibold text-[var(--ink-soft)] dark:text-[#9bb0a4] pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onFocus={handleFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`${prefix ? 'pl-5 ' : ''}${className}`}
        aria-label={ariaLabel}
      />
    </div>
  )
}

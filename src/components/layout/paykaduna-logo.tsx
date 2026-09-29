import paykadunaMarkImg from '@/assets/paykaduna-mark.png'

interface PayKadunaLogoProps {
  className?: string
  markSize?: 'sm' | 'md' | 'lg'
  markClassName?: string
  textClassName?: string
  showText?: boolean
  subtitle?: string
}

export function PayKadunaLogo({
  className = '',
  markSize = 'md',
  markClassName = '',
  textClassName = '',
  showText = true,
  subtitle
}: PayKadunaLogoProps) {
  const sizeClasses = {
    sm: 'h-6 sm:h-6.5 w-auto',
    md: 'h-7 sm:h-8 w-auto',
    lg: 'h-9 sm:h-10 w-auto'
  }[markSize]

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 group select-none ${className}`}>
      <img
        src={paykadunaMarkImg}
        alt="PayKaduna Seal"
        className={`${sizeClasses} object-contain transition-transform duration-200 group-hover:scale-105 shrink-0 drop-shadow-xs ${markClassName}`}
      />
      {showText && (
        <div className="flex flex-col leading-none justify-center">
          <span
            className={`font-sans font-black tracking-wider text-sm sm:text-base uppercase ${
              textClassName || 'text-[var(--ink)] dark:text-white'
            }`}
          >
            PAYKADUNA
          </span>
          {subtitle && (
            <span className="font-sans text-[10px] sm:text-[11px] font-medium text-[var(--ink-soft)] dark:text-emerald-300/80 mt-0.5 tracking-tight truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

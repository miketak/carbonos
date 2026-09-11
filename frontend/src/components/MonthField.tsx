import { useId } from 'react'

function shift(value: string, months: number): string {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + months, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function thisMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * A month picker with a step either way: `YYYY-MM`, or empty for "any
 * period". Native `type="month"` where the browser has one; the arrows keep
 * it usable where it falls back to a text field.
 */
export function MonthField({
  label,
  value,
  onChange,
  allLabel = 'All periods',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  allLabel?: string
}) {
  const id = useId()
  const stepClasses =
    'flex h-9 w-9 items-center justify-center rounded-lg border border-teal/20 bg-white/70 text-dark-teal transition-colors duration-150 hover:bg-teal/10 focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none disabled:opacity-50'
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous month"
          className={stepClasses}
          onClick={() => onChange(shift(value || thisMonth(), -1))}
        >
          ‹
        </button>
        <input
          id={id}
          type="month"
          value={value}
          placeholder={allLabel}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-teal/20 bg-white/70 px-3 py-2 text-dark-teal transition-colors duration-150 focus:border-bright-teal focus:ring-2 focus:ring-bright-teal/40 focus:outline-none"
        />
        <button
          type="button"
          aria-label="Next month"
          className={stepClasses}
          onClick={() => onChange(shift(value || thisMonth(), 1))}
        >
          ›
        </button>
        {value !== '' && (
          <button
            type="button"
            className="text-xs whitespace-nowrap text-link hover:underline"
            onClick={() => onChange('')}
          >
            {allLabel}
          </button>
        )}
      </div>
    </div>
  )
}

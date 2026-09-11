import type { KeyboardEvent } from 'react'

export interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
}

/**
 * A row of tabs that filter one list (a status, a view). Arrow keys move
 * between tabs and select as they go, as the tabs pattern expects.
 */
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.value === value)
    if (index < 0) return
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    onChange(tabs[next].value)
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    buttons[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex gap-1 overflow-x-auto border-b border-teal/10"
    >
      {tabs.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={tab.count !== undefined ? `${tab.label} ${tab.count}` : tab.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none ${
              selected
                ? 'border-teal-deep text-dark-teal'
                : 'border-transparent text-ink-muted hover:border-teal/30 hover:text-dark-teal'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  selected ? 'bg-teal-deep text-white' : 'bg-teal/10 text-ink-muted'
                }`}
              >
                {tab.count.toLocaleString()}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

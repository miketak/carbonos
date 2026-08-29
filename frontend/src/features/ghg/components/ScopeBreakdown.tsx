import { formatCo2e, scopeLabels } from '../format'
import type { GhgScope, Run } from '../api'

const scopeBarStyles: Record<GhgScope, string> = {
  SCOPE_1: 'bg-dark-teal',
  SCOPE_2: 'bg-teal',
  SCOPE_3: 'bg-accent-green',
}

/** A run's scope 1/2/3 split as labelled horizontal bars. */
export function ScopeBreakdown({ run }: { run: Run }) {
  const scopes: { scope: GhgScope; kg: number }[] = [
    { scope: 'SCOPE_1', kg: run.scope1KgCo2e },
    { scope: 'SCOPE_2', kg: run.scope2KgCo2e },
    { scope: 'SCOPE_3', kg: run.scope3KgCo2e },
  ]

  return (
    <div className="flex flex-col gap-2">
      {scopes.map(({ scope, kg }) => (
        <div key={scope} className="flex items-center gap-3 text-sm">
          <span className="w-16 shrink-0 text-dark-teal/70">{scopeLabels[scope]}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-teal/10">
            <div
              className={`animate-bar-grow h-full rounded-full ${scopeBarStyles[scope]}`}
              style={{
                width:
                  run.totalKgCo2e > 0
                    ? `${Math.max((kg / run.totalKgCo2e) * 100, kg > 0 ? 2 : 0)}%`
                    : '0%',
              }}
            />
          </div>
          <span className="w-28 shrink-0 text-right whitespace-nowrap text-dark-teal/80">
            {formatCo2e(kg)}
          </span>
        </div>
      ))}
    </div>
  )
}

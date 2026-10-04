import { formatCo2e, scopeLabels } from '../format'
import type { GhgScope, Run } from '../api'

/* one colour, three weights (spec 10): the bars differ by opacity, the label says which scope */
const scopeOpacity: Record<GhgScope, string> = {
  SCOPE_1: 'opacity-100',
  SCOPE_2: 'opacity-70',
  SCOPE_3: 'opacity-45',
}

/** A run's scope 1/2/3 split as labelled horizontal bars. */
export function ScopeBreakdown({ run }: { run: Run }) {
  const scopes: { scope: GhgScope; kg: number }[] = [
    { scope: 'SCOPE_1', kg: run.scope1KgCo2e },
    { scope: 'SCOPE_2', kg: run.scope2KgCo2e },
    { scope: 'SCOPE_3', kg: run.scope3KgCo2e },
  ]

  return (
    <div className="flex flex-col gap-2.5">
      {scopes.map(({ scope, kg }) => (
        <div
          key={scope}
          className="grid grid-cols-[110px_minmax(0,1fr)_120px] items-center gap-3 text-sm"
        >
          <span>{scopeLabels[scope]}</span>
          <div className="h-2 overflow-hidden rounded-sm bg-surface-sunken">
            <div
              className={`animate-bar-grow h-full bg-primary ${scopeOpacity[scope]}`}
              style={{
                width:
                  run.totalKgCo2e > 0
                    ? `${Math.max((kg / run.totalKgCo2e) * 100, kg > 0 ? 2 : 0)}%`
                    : '0%',
              }}
            />
          </div>
          <span className="text-right whitespace-nowrap">{formatCo2e(kg)}</span>
        </div>
      ))}
    </div>
  )
}

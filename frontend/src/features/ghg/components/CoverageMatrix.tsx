import { GlassCard } from '../../../components/GlassCard'
import { scopeLabels } from '../format'
import type { Activity, Facility, GhgScope } from '../api'

const scopes: GhgScope[] = ['SCOPE_1', 'SCOPE_2', 'SCOPE_3']

/** Facility × scope grid: where activity data exists and where it's still missing. */
export function CoverageMatrix({
  facilities,
  activities,
}: {
  facilities: Facility[]
  activities: Activity[]
}) {
  if (facilities.length === 0) {
    return null
  }

  const covered = new Set(activities.map((activity) => `${activity.facilityId}:${activity.scope}`))
  const total = facilities.length * scopes.length
  const done = facilities.reduce(
    (count, facility) =>
      count + scopes.filter((scope) => covered.has(`${facility.id}:${scope}`)).length,
    0,
  )
  const percent = Math.round((done / total) * 100)

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg">Data coverage</h2>
        <span className="rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-dark-teal">
          {percent}% complete
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-teal/10 text-xs text-dark-teal/60 uppercase">
              <th className="px-3 py-2 font-semibold">Facility</th>
              {scopes.map((scope) => (
                <th key={scope} className="px-3 py-2 text-center font-semibold">
                  {scopeLabels[scope]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facilities.map((facility) => (
              <tr key={facility.id} className="border-b border-teal/5 last:border-0">
                <td className="px-3 py-2 font-medium">{facility.name}</td>
                {scopes.map((scope) => (
                  <td key={scope} className="px-3 py-2 text-center">
                    <CoverageCell covered={covered.has(`${facility.id}:${scope}`)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-dark-teal/60">
        A facility counts as covered for a scope once it has at least one activity record there.
      </p>
    </GlassCard>
  )
}

function CoverageCell({ covered }: { covered: boolean }) {
  if (!covered) {
    return (
      <span className="inline-flex h-5 w-5 rounded-full border-2 border-teal/25">
        <span className="sr-only">no data</span>
      </span>
    )
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-3 w-3"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span className="sr-only">covered</span>
    </span>
  )
}

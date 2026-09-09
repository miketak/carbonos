import { useState } from 'react'
import { Button } from '../../../components/Button'
import { GlassCard } from '../../../components/GlassCard'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import { categoriesForScope } from '../format'
import { useSetOperationalBoundary } from '../useGhg'
import type { ActivityCategory, Inventory } from '../api'

/**
 * The operational boundary declaration (spec 07.1, Chapter 9): which scope 3
 * categories the inventory covers and why the others are left out. The report
 * prints it.
 */
export function OperationalBoundaryCard({ inventory }: { inventory: Inventory }) {
  const editable = inventory.status === 'DRAFT'
  const save = useSetOperationalBoundary(inventory.id)
  const toast = useToast()
  const [selected, setSelected] = useState<ActivityCategory[]>(inventory.scope3Categories)
  const [rationale, setRationale] = useState(inventory.scope3ExclusionsRationale ?? '')
  const [notQuantified, setNotQuantified] = useState<Partial<Record<ActivityCategory, string>>>(
    Object.fromEntries(
      inventory.scope3NotQuantified.map((entry) => [entry.category, entry.reason]),
    ),
  )
  const scope3 = categoriesForScope('SCOPE_3')

  const toggle = (category: ActivityCategory, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, category] : current.filter((value) => value !== category),
    )

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Operational boundary declaration</h2>
      <p className="text-sm text-ink-muted">
        Scope 1 and scope 2 are always covered. Declare which scope 3 categories this inventory
        covers and why the others are excluded; the report prints this declaration beside each
        category's total. A declared category with no lines needs a reason, or the pre-flight warns:
        a reader takes "covered" to mean quantified.
      </p>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Scope 3 categories covered</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {scope3.map((entry) => (
            <div key={entry.category} className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  aria-label={entry.label}
                  checked={selected.includes(entry.category)}
                  disabled={!editable}
                  onChange={(event) => toggle(entry.category, event.target.checked)}
                  className="size-4 accent-teal"
                />
                {entry.label}
              </label>
              {selected.includes(entry.category) && (
                <input
                  aria-label={`${entry.label}: why not quantified this year`}
                  placeholder="Not quantified this year because…"
                  value={notQuantified[entry.category] ?? ''}
                  disabled={!editable}
                  maxLength={500}
                  onChange={(event) =>
                    setNotQuantified({ ...notQuantified, [entry.category]: event.target.value })
                  }
                  className="ml-6 rounded-lg border border-teal/20 bg-white/70 px-2 py-1 text-xs focus:ring-2 focus:ring-teal focus:outline-none disabled:opacity-60"
                />
              )}
            </div>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-sm font-medium">Why other categories are excluded</span>
        <textarea
          aria-label="Why other categories are excluded"
          value={rationale}
          disabled={!editable}
          maxLength={1000}
          rows={3}
          onChange={(event) => setRationale(event.target.value)}
          className="w-full rounded-lg border border-teal/20 bg-white/70 px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:outline-none disabled:opacity-60"
        />
      </label>
      {editable && (
        <div className="mt-3 flex justify-end">
          <Button
            className="px-4 py-1.5 text-sm"
            busy={save.isPending}
            onClick={() =>
              save.mutate(
                {
                  scope3Categories: selected,
                  exclusionsRationale: rationale.trim() === '' ? undefined : rationale,
                  notQuantified: selected
                    .filter((category) => (notQuantified[category] ?? '').trim() !== '')
                    .map((category) => ({
                      category,
                      reason: (notQuantified[category] ?? '').trim(),
                    })),
                },
                {
                  onSuccess: () => toast('Operational boundary declaration saved.'),
                  onError: (error) =>
                    toast(problemDetail(error) ?? 'Could not save the declaration.', 'error'),
                },
              )
            }
          >
            Save declaration
          </Button>
        </div>
      )}
    </GlassCard>
  )
}

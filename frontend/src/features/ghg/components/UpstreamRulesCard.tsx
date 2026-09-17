import { useState } from 'react'
import type { FormEvent } from 'react'
import { InputField, SelectField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { useToast } from '../../../components/toast'
import { refusalMessage } from '../../../lib/api'
import { upstreamRuleKindLabels } from '../format'
import { mayWrite, WRITE_TOOLTIP } from '../roles'
import type { MyRole } from '../roles'
import {
  useAddUpstreamRule,
  useEmissionFactorsQuery,
  useRemoveUpstreamRule,
  useUpstreamRulesQuery,
} from '../useGhg'
import { RoleButton } from './RoleButton'
import type { EmissionFactor, Inventory, UpstreamRuleKind } from '../api'

const kinds: UpstreamRuleKind[] = ['WELL_TO_TANK', 'TRANSMISSION_AND_DISTRIBUTION']

/** How many factors each select offers at once; the search narrows a bigger library (FU-03). */
const FACTOR_CHOICES = 200

/** The list with the chosen factor pinned at the top when the search no longer returns it. */
function withChosen(items: EmissionFactor[], chosen: EmissionFactor | null): EmissionFactor[] {
  if (!chosen || items.some((factor) => factor.id === chosen.id)) return items
  return [chosen, ...items]
}

function describe(factor: EmissionFactor): string {
  return `${factor.name} (/${factor.unit})${factor.sourceActivity ? ` · ${factor.sourceActivity}` : ''}`
}

function beyondHint(beyond: number): string | undefined {
  return beyond > 0
    ? `${beyond.toLocaleString()} more approved factors. Narrow the search to reach them.`
    : undefined
}

/**
 * Upstream rules (spec 04.7): category 3 of the Scope 3 Standard is made of
 * lines that ride on records the inventory already holds. A rule pairs a
 * primary factor with an upstream factor, and the run adds one scope 3 line
 * for every included scope 1 or scope 2 line the primary factor produced. No
 * record is entered twice.
 */
export function UpstreamRulesCard({
  organizationId,
  inventory,
  myRole,
}: {
  organizationId: string
  inventory: Inventory
  myRole?: MyRole | null
}) {
  const inventoryId = inventory.id
  const editable = inventory.status === 'DRAFT'
  const rulesQuery = useUpstreamRulesQuery(inventoryId)
  // FU-03: only approved factors can carry a rule, and the search narrows them in SQL: a
  // select of every row of an imported edition is unusable. Each select has its own search:
  // the combustion row and its upstream row rarely answer to the same words (an edition holds
  // hundreds of "Well-to-tank:" rows), and one box narrowing both lists could never show the
  // pair at once. A chosen factor stays pinned in its list whatever the search says next.
  const [primarySearch, setPrimarySearch] = useState('')
  const [upstreamSearch, setUpstreamSearch] = useState('')
  const primaryQuery = useEmissionFactorsQuery(organizationId, {
    q: primarySearch.trim() === '' ? undefined : primarySearch.trim(),
    includeUnapproved: false,
    size: FACTOR_CHOICES,
  })
  const upstreamQuery = useEmissionFactorsQuery(organizationId, {
    q: upstreamSearch.trim() === '' ? undefined : upstreamSearch.trim(),
    includeUnapproved: false,
    size: FACTOR_CHOICES,
  })
  const add = useAddUpstreamRule(inventoryId)
  const remove = useRemoveUpstreamRule(inventoryId)
  const toast = useToast()
  const [primary, setPrimary] = useState<EmissionFactor | null>(null)
  const [upstream, setUpstream] = useState<EmissionFactor | null>(null)
  const [kind, setKind] = useState<UpstreamRuleKind>('WELL_TO_TANK')
  // DESNZ names the upstream row after the combustion row ("Well-to-tank: Liquid fuels: Diesel
  // ..."), so once the primary is chosen its match is one search away. It is offered at the top
  // of the list, never applied: pairing the two is the preparer's methodological choice (Scope 3
  // Standard chapter 7), and the list itself stays whatever the search says.
  const suggestionQuery = useEmissionFactorsQuery(
    organizationId,
    { q: primary ? `Well-to-tank: ${primary.name}` : undefined, includeUnapproved: false, size: 5 },
    { enabled: primary !== null && kind === 'WELL_TO_TANK' },
  )

  const rules = rulesQuery.data ?? []
  const primaryChoices = withChosen(primaryQuery.data?.items ?? [], primary)
  const suggested =
    primary && kind === 'WELL_TO_TANK'
      ? (suggestionQuery.data?.items ?? []).filter((factor) => factor.id !== primary.id)
      : []
  const upstreamChoices = withChosen(
    (upstreamQuery.data?.items ?? []).filter(
      (factor) => !suggested.some((s) => s.id === factor.id),
    ),
    upstream,
  )
  const beyondPrimary = Math.max(
    0,
    (primaryQuery.data?.total ?? 0) - (primaryQuery.data?.items.length ?? 0),
  )
  const beyondUpstream = Math.max(
    0,
    (upstreamQuery.data?.total ?? 0) - (upstreamQuery.data?.items.length ?? 0),
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!primary || !upstream) return
    add.mutate(
      { primaryFactorId: primary.id, upstreamFactorId: upstream.id, kind },
      {
        onSuccess: () => {
          setPrimary(null)
          setUpstream(null)
          toast('Upstream rule added.')
        },
        onError: (error) => toast(refusalMessage(error, myRole), 'error'),
      },
    )
  }

  return (
    <GlassCard className="mt-6 p-6">
      <h2 className="text-xl">Upstream rules</h2>
      <p className="text-sm text-ink-muted">
        Fuel- and energy-related activities (Scope 3 Standard, category 3) ride on the records this
        inventory already holds: the well-to-tank emissions of every litre in scope 1 and the
        transmission and distribution losses of every kilowatt-hour in scope 2. A rule derives those
        lines; nothing is entered twice.
      </p>
      {rules.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">
          No upstream rules. Category 3 is not quantified by this view.
        </p>
      ) : (
        <table aria-label="Upstream rules" className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
              <th className="py-1.5 pr-3 font-semibold">Primary factor</th>
              <th className="py-1.5 pr-3 font-semibold">Upstream factor</th>
              <th className="py-1.5 pr-3 font-semibold">Kind</th>
              <th className="py-1.5 pr-3 text-right font-semibold">Records</th>
              <th className="py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-teal/5 last:border-0">
                <td className="py-1.5 pr-3">{rule.primaryFactorName}</td>
                <td className="py-1.5 pr-3">{rule.upstreamFactorName}</td>
                <td className="py-1.5 pr-3 text-ink-muted">{upstreamRuleKindLabels[rule.kind]}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{rule.matchingLines}</td>
                <td className="py-1.5 text-right">
                  {editable && (
                    <RoleButton
                      allowed={mayWrite(myRole)}
                      tooltip={WRITE_TOOLTIP}
                      variant="ghost"
                      className="px-2.5 py-1 text-xs"
                      onClick={() =>
                        remove.mutate(rule.id, {
                          onSuccess: () => toast('Upstream rule removed.'),
                          onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                        })
                      }
                    >
                      Remove
                    </RoleButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editable && (
        <form
          onSubmit={submit}
          aria-label="Add an upstream rule"
          className="mt-4 grid gap-3 md:grid-cols-4"
        >
          <div className="flex flex-col gap-3">
            <InputField
              label="Narrow the primary factors"
              placeholder="Name, publication, taxonomy or pack tag"
              value={primarySearch}
              hint={beyondHint(beyondPrimary)}
              onChange={(event) => setPrimarySearch(event.target.value)}
            />
            <SelectField
              label="Primary factor"
              value={primary?.id ?? ''}
              required
              onChange={(event) =>
                setPrimary(primaryChoices.find((f) => f.id === event.target.value) ?? null)
              }
            >
              <option value="">Choose the factor the records already use…</option>
              {primaryChoices.map((factor) => (
                <option key={factor.id} value={factor.id}>
                  {describe(factor)}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="flex flex-col gap-3">
            <InputField
              label="Narrow the upstream factors"
              placeholder="Well-to-tank, T&D losses…"
              value={upstreamSearch}
              hint={beyondHint(beyondUpstream)}
              onChange={(event) => setUpstreamSearch(event.target.value)}
            />
            <SelectField
              label="Upstream factor"
              value={upstream?.id ?? ''}
              required
              hint="Its unit must convert from the primary factor's."
              onChange={(event) =>
                setUpstream(
                  [...suggested, ...upstreamChoices].find((f) => f.id === event.target.value) ??
                    null,
                )
              }
            >
              <option value="">Choose the upstream factor…</option>
              {suggested.length > 0 && (
                <optgroup label="Suggested: named after the primary factor">
                  {suggested.map((factor) => (
                    <option key={factor.id} value={factor.id}>
                      {describe(factor)}
                    </option>
                  ))}
                </optgroup>
              )}
              {upstreamChoices.map((factor) => (
                <option key={factor.id} value={factor.id}>
                  {describe(factor)}
                </option>
              ))}
            </SelectField>
          </div>
          <SelectField
            label="Kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as UpstreamRuleKind)}
          >
            {kinds.map((value) => (
              <option key={value} value={value}>
                {upstreamRuleKindLabels[value]}
              </option>
            ))}
          </SelectField>
          <div className="flex items-end">
            <RoleButton
              allowed={mayWrite(myRole)}
              tooltip={WRITE_TOOLTIP}
              type="submit"
              className="px-4 py-1.5 text-sm"
              busy={add.isPending}
              disabled={primary === null || upstream === null}
            >
              Add rule
            </RoleButton>
          </div>
        </form>
      )}
    </GlassCard>
  )
}

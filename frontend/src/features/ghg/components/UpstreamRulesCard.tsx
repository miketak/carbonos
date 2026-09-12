import { useState } from 'react'
import type { FormEvent } from 'react'
import { SelectField } from '../../../components/Field'
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
import type { Inventory, UpstreamRuleKind } from '../api'

const kinds: UpstreamRuleKind[] = ['WELL_TO_TANK', 'TRANSMISSION_AND_DISTRIBUTION']

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
  const factorsQuery = useEmissionFactorsQuery(organizationId)
  const add = useAddUpstreamRule(inventoryId)
  const remove = useRemoveUpstreamRule(inventoryId)
  const toast = useToast()
  const [primaryFactorId, setPrimaryFactorId] = useState('')
  const [upstreamFactorId, setUpstreamFactorId] = useState('')
  const [kind, setKind] = useState<UpstreamRuleKind>('WELL_TO_TANK')

  const rules = rulesQuery.data ?? []
  const factors = (factorsQuery.data ?? []).filter((factor) => factor.approved)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    add.mutate(
      { primaryFactorId, upstreamFactorId, kind },
      {
        onSuccess: () => {
          setPrimaryFactorId('')
          setUpstreamFactorId('')
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
          <SelectField
            label="Primary factor"
            value={primaryFactorId}
            required
            onChange={(event) => setPrimaryFactorId(event.target.value)}
          >
            <option value="">Choose the factor the records already use…</option>
            {factors.map((factor) => (
              <option key={factor.id} value={factor.id}>
                {factor.name} (/{factor.unit})
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Upstream factor"
            value={upstreamFactorId}
            required
            hint="Its unit must convert from the primary factor's."
            onChange={(event) => setUpstreamFactorId(event.target.value)}
          >
            <option value="">Choose the upstream factor…</option>
            {factors.map((factor) => (
              <option key={factor.id} value={factor.id}>
                {factor.name} (/{factor.unit})
              </option>
            ))}
          </SelectField>
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
              disabled={primaryFactorId === '' || upstreamFactorId === ''}
            >
              Add rule
            </RoleButton>
          </div>
        </form>
      )}
    </GlassCard>
  )
}

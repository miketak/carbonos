import { useState } from 'react'
import { TextAreaField } from '../../../components/Field'
import { Panel, PanelBody, PanelHead } from '../../../components/Panel'
import { useToast } from '../../../components/toast'
import { refusalMessage } from '../../../lib/api'
import { categoriesForScope } from '../format'
import { mayWrite, WRITE_TOOLTIP } from '../roles'
import type { MyRole } from '../roles'
import { useSetOperationalBoundary } from '../useGhg'
import { RoleButton } from './RoleButton'
import type { ActivityCategory, Inventory } from '../api'

/** An inline control beside a checkbox; 36 px tall so the column of categories stays readable. */
const inlineControl =
  'w-full min-h-9 rounded-lg border border-hairline-strong bg-surface px-2.5 py-1 text-[13px] text-ink placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-focus/40 focus:outline-none disabled:opacity-50'

/**
 * The operational boundary declaration (spec 07.1, Chapter 9): which scope 3
 * categories the inventory covers and why the others are left out. The report
 * prints it.
 */
export function OperationalBoundaryCard({
  inventory,
  myRole,
}: {
  inventory: Inventory
  myRole?: MyRole | null
}) {
  const editable = inventory.status === 'DRAFT'
  const writable = editable && mayWrite(myRole)
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
    <Panel>
      <PanelHead
        title="Operational boundary declaration"
        description={
          'Scope 1 and scope 2 are always covered. Declare which scope 3 categories this inventory covers and why the others are excluded; the report prints this declaration beside each category\'s total. A declared category with no lines needs a reason, or the pre-flight warns: a reader takes "covered" to mean quantified.'
        }
      />
      <PanelBody className="flex flex-col gap-5">
        <fieldset>
          <legend className="text-[13px] font-medium">Scope 3 categories covered</legend>
          {/* spec 10: the declaration's checkboxes in one column, each reason under its category */}
          <div className="mt-2 flex flex-col gap-1">
            {scope3.map((entry) => (
              <div key={entry.category} className="flex flex-col gap-1.5">
                <label className="flex min-h-10 items-center gap-2.5 text-[15px]">
                  <input
                    type="checkbox"
                    aria-label={entry.label}
                    checked={selected.includes(entry.category)}
                    disabled={!writable}
                    onChange={(event) => toggle(entry.category, event.target.checked)}
                    className="size-[18px] accent-primary"
                  />
                  {entry.label}
                </label>
                {selected.includes(entry.category) && (
                  <input
                    aria-label={`${entry.label}: why not quantified this year`}
                    placeholder="Not quantified this year because…"
                    value={notQuantified[entry.category] ?? ''}
                    disabled={!writable}
                    maxLength={500}
                    onChange={(event) =>
                      setNotQuantified({ ...notQuantified, [entry.category]: event.target.value })
                    }
                    className={`${inlineControl} mb-2 ml-7 max-w-xl`}
                  />
                )}
              </div>
            ))}
          </div>
        </fieldset>
        <TextAreaField
          label="Why other categories are excluded"
          value={rationale}
          disabled={!writable}
          maxLength={1000}
          rows={3}
          onChange={(event) => setRationale(event.target.value)}
        />
        {editable && (
          <div className="flex justify-end">
            <RoleButton
              allowed={mayWrite(myRole)}
              tooltip={WRITE_TOOLTIP}
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
                    onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                  },
                )
              }
            >
              Save declaration
            </RoleButton>
          </div>
        )}
      </PanelBody>
    </Panel>
  )
}

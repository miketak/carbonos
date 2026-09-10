import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { approachLabels } from '../format'
import { useCreateInventory, useInventoriesQuery, useUpdateInventory } from '../useGhg'
import type { ConsolidationApproach, GwpSet, Inventory, StraddleTreatment } from '../api'

/** Whole months between two ISO dates (end inclusive), -1 when not whole, null while incomplete. */
function wholeMonths(start: string, end: string): number | null {
  if (!start || !end) return null
  const from = new Date(start + 'T00:00:00Z')
  const to = new Date(end + 'T00:00:00Z')
  to.setUTCDate(to.getUTCDate() + 1)
  if (to <= from) return null
  const months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth()
  return to.getUTCDate() === from.getUTCDate() ? months : -1
}

/**
 * Creates an inventory, or edits a draft's settings: the name, period, purpose,
 * straddle treatment, approach and GWP set (specs 04.2 and 07.1). Copying a
 * view and pre-populating the boundary apply only on creation.
 */
export function InventoryFormModal({
  organizationId,
  inventory,
  onClose,
  onSaved,
}: {
  organizationId: string
  /** The draft being edited; absent when creating. */
  inventory?: Inventory
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const create = useCreateInventory(organizationId)
  const update = useUpdateInventory(organizationId)
  const mutation = inventory ? update : create
  const year = new Date().getFullYear()
  const [name, setName] = useState(inventory?.name ?? `${year} Corporate Inventory`)
  const [periodStart, setPeriodStart] = useState(inventory?.periodStart ?? `${year}-01-01`)
  const [periodEnd, setPeriodEnd] = useState(inventory?.periodEnd ?? `${year}-12-31`)
  const [purpose, setPurpose] = useState(inventory?.purpose ?? '')
  const [approach, setApproach] = useState<ConsolidationApproach>(
    inventory?.consolidationApproach ?? 'OPERATIONAL_CONTROL',
  )
  const [gwpSet, setGwpSet] = useState<GwpSet>(inventory?.gwpSet ?? 'AR5')
  const [straddleTreatment, setStraddleTreatment] = useState<StraddleTreatment>(
    inventory?.straddleTreatment ?? 'PRO_RATE',
  )
  const [prefillBoundary, setPrefillBoundary] = useState(true)
  const [copyFromInventoryId, setCopyFromInventoryId] = useState('')
  const inventoriesQuery = useInventoriesQuery(organizationId)
  const periodMonths = wholeMonths(periodStart, periodEnd)

  const errors = fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = {
      name,
      periodStart,
      periodEnd,
      purpose: purpose.trim() === '' ? undefined : purpose,
      consolidationApproach: approach,
      gwpSet,
      straddleTreatment,
    }
    if (inventory) {
      update.mutate(
        { id: inventory.id, input },
        { onSuccess: (saved) => onSaved(`${saved.name} updated.`) },
      )
      return
    }
    create.mutate(
      {
        ...input,
        prefillBoundary: copyFromInventoryId === '' ? prefillBoundary : false,
        copyFromInventoryId: copyFromInventoryId === '' ? undefined : copyFromInventoryId,
      },
      { onSuccess: (saved) => onSaved(`${saved.name} created.`) },
    )
  }

  return (
    <Modal title={inventory ? 'Edit inventory' : 'New inventory'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <InputField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.name}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Period start"
            type="date"
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
            error={errors?.periodStart}
            required
          />
          <InputField
            label="Period end"
            type="date"
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
            error={errors?.periodEnd}
            required
          />
        </div>
        {periodMonths !== null && periodMonths !== 12 && (
          <p role="status" className="text-xs text-amber-700">
            This period is{' '}
            {periodMonths === -1 ? 'not a whole number of months' : `${periodMonths} months`}.
            Chapter 9 expects an annual inventory; keep it only if the period is deliberate.
          </p>
        )}
        {periodMonths === 12 && periodStart.slice(5) !== '01-01' && (
          <p role="status" className="text-xs text-ink-muted">
            A fiscal year: the inventory will be labelled FY{periodStart.slice(0, 4)}/
            {periodEnd.slice(2, 4)}.
          </p>
        )}
        <SelectField
          label="Records that straddle the period or a membership window"
          value={straddleTreatment}
          onChange={(event) => setStraddleTreatment(event.target.value as StraddleTreatment)}
          hint="An annual total for a site acquired mid-year is either counted for the days inside, with the split on the line, or blocked until split (spec 04.2)."
        >
          <option value="PRO_RATE">Pro-rate by days (default)</option>
          <option value="BLOCK">Block the run until the record is split</option>
        </SelectField>
        <InputField
          label="Purpose (optional)"
          placeholder="Corporate reporting, UK regulatory…"
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          error={errors?.purpose}
        />
        <SelectField
          label="Consolidation approach"
          value={approach}
          onChange={(event) => setApproach(event.target.value as ConsolidationApproach)}
          error={errors?.consolidationApproach}
          hint="How facility emissions roll up in this view: by equity share, or all-or-nothing under control."
        >
          {Object.entries(approachLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="GWP set"
          value={gwpSet}
          onChange={(event) => setGwpSet(event.target.value as GwpSet)}
          hint="The IPCC 100-year global warming potentials the report converts each gas with (spec 07.1)."
        >
          <option value="AR5">AR5 (default)</option>
          <option value="AR6">AR6</option>
        </SelectField>
        {generalError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {generalError}
          </p>
        )}
        {!inventory && (
          <>
            <SelectField
              label="Copy the view from (optional)"
              value={copyFromInventoryId}
              onChange={(event) => setCopyFromInventoryId(event.target.value)}
              hint="The boundary, instruments, declaration and every classification and exclusion of that inventory, so a second inventory or next year's starts from its decisions."
            >
              <option value="">Start from scratch</option>
              {(inventoriesQuery.data ?? []).map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} ({candidate.periodLabel})
                </option>
              ))}
            </SelectField>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                disabled={copyFromInventoryId !== ''}
                checked={copyFromInventoryId === '' ? prefillBoundary : false}
                onChange={(event) => setPrefillBoundary(event.target.checked)}
                className="mt-0.5 size-4 accent-teal"
              />
              <span>
                Start with every operation the approach includes in the boundary
                <span className="block text-xs text-ink-muted">
                  Chapter 3: under a control approach every controlled operation is in by
                  definition. Leaving one out is then an exclusion with a reason.
                </span>
              </span>
            </label>
          </>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={mutation.isPending}>
            {inventory ? 'Save changes' : 'Create inventory'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

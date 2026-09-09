import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Modal } from '../../components/Modal'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail } from '../../lib/api'
import { ApproachBadge, InventoryStatusBadge } from './components/badges'
import { approachLabels } from './format'
import { useCreateInventory, useDeleteInventory, useInventoriesQuery } from './useGhg'
import type { ConsolidationApproach, GwpSet, Inventory, StraddleTreatment } from './api'

/**
 * The accounting views: each inventory selects, classifies, and applies
 * treatment to the same organizational facts under its own boundary and
 * consolidation approach.
 */
export function InventoriesPage() {
  const { organizationId = '' } = useParams()
  const inventoriesQuery = useInventoriesQuery(organizationId)
  const deleteInventory = useDeleteInventory(organizationId)
  const toast = useToast()
  const [creating, setCreating] = useState(false)

  const inventories = inventoriesQuery.data

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl">GHG inventories</h1>
          <p className="text-sm text-ink-muted">
            Accounting views over the organization's facts. The same period can be viewed under
            different accounting contexts.
          </p>
        </div>
        <Button className="px-4 py-1.5 text-sm" onClick={() => setCreating(true)}>
          New inventory
        </Button>
      </div>

      {inventoriesQuery.isPending && (
        <div aria-label="Loading inventories" className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      )}

      {inventories?.length === 0 && (
        <GlassCard className="animate-fade-up p-10 text-center">
          <h2 className="text-lg">No inventories yet</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Create your first accounting view: pick a reporting period and a consolidation approach,
            then define its boundary.
          </p>
        </GlassCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {inventories?.map((inventory, index) => (
          <InventoryCard
            key={inventory.id}
            inventory={inventory}
            stagger={index}
            onDelete={() =>
              deleteInventory.mutate(inventory.id, {
                onSuccess: () => toast(`${inventory.name} deleted.`),
                onError: (error) =>
                  toast(problemDetail(error) ?? `Could not delete ${inventory.name}.`, 'error'),
              })
            }
          />
        ))}
      </div>

      {creating && (
        <InventoryFormModal
          organizationId={organizationId}
          onClose={() => setCreating(false)}
          onSaved={(message) => {
            setCreating(false)
            toast(message)
          }}
        />
      )}
    </section>
  )
}

function InventoryCard({
  inventory,
  stagger,
  onDelete,
}: {
  inventory: Inventory
  stagger: number
  onDelete: () => void
}) {
  return (
    <GlassCard
      className="animate-fade-up hover-lift flex flex-col p-6"
      style={{ '--stagger': stagger } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <Link to={inventory.id} className="text-lg font-semibold text-dark-teal hover:text-link">
          {inventory.name}
        </Link>
        <ApproachBadge approach={inventory.consolidationApproach} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {inventory.periodStart} → {inventory.periodEnd}
        {inventory.purpose ? ` · ${inventory.purpose}` : ''}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <InventoryStatusBadge inventory={inventory} />
        {inventory.supersededById && (
          <span className="text-xs text-ink-muted">Superseded by a correction</span>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to={inventory.id}
          className="inline-block rounded-lg bg-teal-deep px-4 py-1.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-dark-teal"
        >
          Open
        </Link>
        {inventory.status !== 'PUBLISHED' && (
          <Button
            variant="ghost"
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </GlassCard>
  )
}

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

function InventoryFormModal({
  organizationId,
  onClose,
  onSaved,
}: {
  organizationId: string
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const create = useCreateInventory(organizationId)
  const year = new Date().getFullYear()
  const [name, setName] = useState(`${year} Corporate Inventory`)
  const [periodStart, setPeriodStart] = useState(`${year}-01-01`)
  const [periodEnd, setPeriodEnd] = useState(`${year}-12-31`)
  const [purpose, setPurpose] = useState('')
  const [approach, setApproach] = useState<ConsolidationApproach>('OPERATIONAL_CONTROL')
  const [gwpSet, setGwpSet] = useState<GwpSet>('AR5')
  const [straddleTreatment, setStraddleTreatment] = useState<StraddleTreatment>('PRO_RATE')
  const [prefillBoundary, setPrefillBoundary] = useState(true)
  const [copyFromInventoryId, setCopyFromInventoryId] = useState('')
  const inventoriesQuery = useInventoriesQuery(organizationId)
  const periodMonths = wholeMonths(periodStart, periodEnd)

  const errors = fieldErrors(create.error)
  const generalError = create.isError && !errors ? problemDetail(create.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      {
        name,
        periodStart,
        periodEnd,
        purpose: purpose.trim() === '' ? undefined : purpose,
        consolidationApproach: approach,
        gwpSet,
        straddleTreatment,
        prefillBoundary: copyFromInventoryId === '' ? prefillBoundary : false,
        copyFromInventoryId: copyFromInventoryId === '' ? undefined : copyFromInventoryId,
      },
      { onSuccess: (inventory) => onSaved(`${inventory.name} created.`) },
    )
  }

  return (
    <Modal title="New inventory" onClose={onClose}>
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
              Chapter 3: under a control approach every controlled operation is in by definition.
              Leaving one out is then an exclusion with a reason.
            </span>
          </span>
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={create.isPending}>
            Create inventory
          </Button>
        </div>
      </form>
    </Modal>
  )
}

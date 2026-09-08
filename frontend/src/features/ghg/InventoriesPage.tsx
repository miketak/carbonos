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
import { ApproachBadge, BoundaryStatusBadge } from './components/badges'
import { approachLabels } from './format'
import { useCreateInventory, useDeleteInventory, useInventoriesQuery } from './useGhg'
import type { ConsolidationApproach, Inventory } from './api'

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
        <BoundaryStatusBadge inventory={inventory} />
        {inventory.finalRunId && (
          <span className="inline-block rounded-full bg-accent-green/25 px-2.5 py-0.5 text-xs font-bold text-dark-teal">
            FINAL RUN DESIGNATED
          </span>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to={inventory.id}
          className="inline-block rounded-lg bg-teal-deep px-4 py-1.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-dark-teal"
        >
          Open
        </Link>
        <Button
          variant="ghost"
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </GlassCard>
  )
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
        {generalError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {generalError}
          </p>
        )}
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

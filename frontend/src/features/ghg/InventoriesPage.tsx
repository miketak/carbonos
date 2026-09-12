import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
import { ApproachBadge, InventoryStatusBadge } from './components/badges'
import { InventoryFormModal } from './components/InventoryFormModal'
import { RoleButton } from './components/RoleButton'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import { useDeleteInventory, useInventoriesQuery, useOrganizationQuery } from './useGhg'
import type { Inventory } from './api'

/**
 * The accounting views: each inventory selects, classifies, and applies
 * treatment to the same organizational facts under its own boundary and
 * consolidation approach.
 */
export function InventoriesPage() {
  const { organizationId = '' } = useParams()
  const inventoriesQuery = useInventoriesQuery(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const deleteInventory = useDeleteInventory(organizationId)
  const toast = useToast()
  const [creating, setCreating] = useState(false)

  const inventories = inventoriesQuery.data
  const myRole = organizationQuery.data?.myRole ?? null

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
        <RoleButton
          allowed={mayWrite(myRole)}
          tooltip={WRITE_TOOLTIP}
          className="px-4 py-1.5 text-sm"
          onClick={() => setCreating(true)}
        >
          New inventory
        </RoleButton>
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
                onError: (error) => toast(refusalMessage(error, myRole), 'error'),
              })
            }
          />
        ))}
      </div>

      {creating && (
        <InventoryFormModal
          organizationId={organizationId}
          myRole={myRole}
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

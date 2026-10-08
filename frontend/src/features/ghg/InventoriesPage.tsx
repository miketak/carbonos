import { formatDateRange } from '../../lib/dates'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, TableFooter, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
import { InventoryStatusBadge } from './components/badges'
import { ButtonLink } from './components/ButtonLink'
import { RoleButton } from './components/RoleButton'
import { approachLabels } from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import { useDeleteInventory, useInventoriesQuery, useOrganizationQuery } from './useGhg'

/**
 * The accounting views: each inventory selects, classifies, and applies
 * treatment to the same organizational facts under its own boundary and
 * consolidation approach. A table, not cards (spec 10).
 */
export function InventoriesPage() {
  const { organizationId = '' } = useParams()
  const inventoriesQuery = useInventoriesQuery(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const deleteInventory = useDeleteInventory(organizationId)
  const toast = useToast()
  const navigate = useNavigate()

  const inventories = inventoriesQuery.data
  const myRole = organizationQuery.data?.myRole ?? null

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}` }}
        crumbs={[{ label: 'Inventories' }]}
        title="GHG inventories"
        subtitle="Accounting views over the organization's facts. The same period can be viewed under different accounting contexts."
        actions={
          <RoleButton
            allowed={mayWrite(myRole)}
            tooltip={WRITE_TOOLTIP}
            onClick={() => navigate('new')}
          >
            New inventory
          </RoleButton>
        }
      />

      {inventoriesQuery.isPending && (
        <div aria-label="Loading inventories" className="flex flex-col gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      )}

      {inventories?.length === 0 && (
        <Panel className="p-10 text-center">
          <h2 className="text-lg font-semibold">No inventories yet</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Create your first accounting view: pick a reporting period and a consolidation approach,
            then define its boundary.
          </p>
        </Panel>
      )}

      {inventories && inventories.length > 0 && (
        <div>
          <Table>
            <thead>
              <tr>
                <Th>Inventory</Th>
                <Th>Period</Th>
                <Th>Approach</Th>
                <Th>Status</Th>
                <Th className="w-44">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {inventories.map((inventory) => (
                <tr key={inventory.id}>
                  <Td>
                    <Link to={inventory.id} className="font-medium hover:underline">
                      {inventory.name}
                    </Link>
                  </Td>
                  <Td>
                    <TwoLine
                      primary={
                        <span className="font-normal">
                          {formatDateRange(inventory.periodStart, inventory.periodEnd)}
                        </span>
                      }
                      secondary={inventory.purpose ?? undefined}
                    />
                  </Td>
                  <Td>{approachLabels[inventory.consolidationApproach]}</Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <InventoryStatusBadge inventory={inventory} />
                      {inventory.supersededById && (
                        <span className="text-[13px] text-ink-muted">
                          Superseded by a correction
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <ButtonLink to={inventory.id} variant="secondary" size="sm">
                        Open
                      </ButtonLink>
                      {inventory.status !== 'PUBLISHED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger"
                          onClick={() =>
                            deleteInventory.mutate(inventory.id, {
                              onSuccess: () => toast(`${inventory.name} deleted.`),
                              onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                            })
                          }
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TableFooter>
            {inventories.length} inventor{inventories.length === 1 ? 'y' : 'ies'}
          </TableFooter>
        </div>
      )}
    </section>
  )
}
